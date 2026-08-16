-- Nexxus: notificaciones de bienestar ("Cuidado del Equipo") + alerta automatica
-- desde checkins. Agrega columnas nuevas a notificaciones (tipo/prioridad/datos/
-- resuelta), endurece la policy de SELECT solo para el tipo 'bienestar' (el resto
-- de tipos sigue visible a nivel de empresa, como hasta ahora), y crea un trigger
-- AFTER INSERT en checkins que genera una alerta cuando el estres/carga cruza un
-- umbral -- independiente de si el empleado usa el chat de IA o no.

begin;

-- ============================================================
-- 1. Columnas nuevas en notificaciones
-- ============================================================
alter table public.notificaciones add column if not exists tipo text not null default 'general'
  check (tipo in ('general','bienestar','tarea','aprobacion','sistema'));
alter table public.notificaciones add column if not exists prioridad text not null default 'media'
  check (prioridad in ('baja','media','alta','critica'));
alter table public.notificaciones add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.notificaciones add column if not exists resuelta boolean not null default false;
alter table public.notificaciones add column if not exists resuelta_por uuid references public.usuarios(id) on delete set null;
alter table public.notificaciones add column if not exists resuelta_en timestamptz;

create index if not exists idx_notificaciones_empresa_tipo on public.notificaciones(empresa_id, tipo);
create index if not exists idx_notificaciones_no_leidas on public.notificaciones(empresa_id, leida) where leida = false;
create index if not exists idx_notificaciones_bienestar_pendientes on public.notificaciones(empresa_id, resuelta) where tipo = 'bienestar' and resuelta = false;

-- ============================================================
-- 2. Endurecer SELECT: notificaciones tipo 'bienestar' solo
--    visibles para el dueño o para es_jefe(); el resto de tipos
--    sigue siendo visible a toda la empresa como antes.
-- ============================================================
drop policy if exists notificaciones_select on public.notificaciones;
create policy notificaciones_select on public.notificaciones for select
  using (
    usuario_id = auth.uid()
    or (
      public.misma_empresa(empresa_id)
      and (tipo is distinct from 'bienestar' or public.es_jefe())
    )
  );

-- ============================================================
-- 3. Endurecer el trigger de UPDATE: antes solo protegia 4
--    columnas por nombre (titulo/cuerpo/usuario_id/empresa_id),
--    dejando las columnas nuevas (tipo/prioridad/datos/resuelta*)
--    editables por cualquier no-jefe sin querer -- un empleado
--    podria auto-marcar su propia alerta de bienestar como
--    resuelta sin que ningun jefe la haya visto.
-- ============================================================
create or replace function public.notificaciones_restringir_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.es_jefe() then
    return new;
  end if;
  if new.titulo is distinct from old.titulo
     or new.cuerpo is distinct from old.cuerpo
     or new.usuario_id is distinct from old.usuario_id
     or new.empresa_id is distinct from old.empresa_id
     or new.tipo is distinct from old.tipo
     or new.prioridad is distinct from old.prioridad
     or new.datos is distinct from old.datos
     or new.resuelta is distinct from old.resuelta
     or new.resuelta_por is distinct from old.resuelta_por
     or new.resuelta_en is distinct from old.resuelta_en then
    raise exception 'Solo se puede marcar la notificacion como leida';
  end if;
  return new;
end;
$$;
-- (el trigger trg_notificaciones_restringir_update ya existe y apunta a esta funcion)

-- ============================================================
-- 4. Alerta automatica de bienestar al insertar un checkin.
--    Reproduce el fallback de estresDeCheckIn()/normalizeCheckIn()
--    del frontend: datos.estres puede ser numerico O solo existir
--    datos.nivelEstres como texto.
-- ============================================================
create or replace function public.checkins_generar_alerta_bienestar() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_datos jsonb := coalesce(new.datos, '{}'::jsonb);
  v_estres numeric := nullif(v_datos->>'estres', '')::numeric;
  v_nivel_estres text := lower(coalesce(v_datos->>'nivelEstres', v_datos->>'nivel_estres', ''));
  v_carga numeric := nullif(coalesce(v_datos->>'cargaLaboral', v_datos->>'carga_laboral'), '')::numeric;
  v_energia text := lower(coalesce(v_datos->>'energia', ''));
  v_nombre text;
  v_disparar boolean := false;
  v_motivo text;
  v_prioridad text := 'alta';
begin
  if v_estres is not null and v_estres >= 4 then
    v_disparar := true; v_motivo := 'nivel de estrés alto';
  elsif v_nivel_estres in ('alto','critico') then
    v_disparar := true; v_motivo := 'nivel de estrés alto';
  elsif v_carga is not null and v_carga >= 5 then
    v_disparar := true; v_motivo := 'carga laboral muy alta';
  elsif v_energia = 'bajo' and v_estres is not null and v_estres >= 3 then
    v_disparar := true; v_motivo := 'energía baja combinada con estrés';
  end if;

  if not v_disparar then
    return new;
  end if;

  if v_nivel_estres = 'critico' or (v_estres is not null and v_estres >= 5) then
    v_prioridad := 'critica';
  end if;

  select nombre into v_nombre from public.usuarios where id = new.usuario_id;

  insert into public.notificaciones (empresa_id, usuario_id, titulo, cuerpo, tipo, prioridad, datos, leida)
  values (
    new.empresa_id,
    new.usuario_id,
    'Alerta de bienestar',
    format('%s reportó %s en su check-in de hoy. Requiere seguimiento.', coalesce(v_nombre, 'Un colaborador'), v_motivo),
    'bienestar',
    v_prioridad,
    jsonb_build_object('checkin_id', new.id, 'usuario_id', new.usuario_id, 'motivo', v_motivo),
    false
  );

  return new;
end;
$$;

drop trigger if exists trg_checkins_alerta_bienestar on public.checkins;
create trigger trg_checkins_alerta_bienestar after insert on public.checkins
  for each row execute function public.checkins_generar_alerta_bienestar();

commit;
