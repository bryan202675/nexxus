-- Server-authoritative task completion notifications. The task update, completion
-- event, and recipient notifications live in the same transaction: a retry can
-- never produce a notification for an unpersisted state transition.
begin;

alter table public.usuarios
  add column if not exists jefe_id uuid references public.usuarios(id) on delete set null;

alter table public.tareas
  add column if not exists completada_en timestamptz,
  add column if not exists completada_por uuid references public.usuarios(id) on delete set null;

alter table public.notificaciones
  add column if not exists evento_clave text;

create unique index if not exists idx_notificaciones_usuario_evento_clave
  on public.notificaciones (usuario_id, evento_clave)
  where evento_clave is not null;

create table if not exists public.tarea_finalizaciones (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  completada_por uuid not null references public.usuarios(id) on delete restrict,
  completada_en timestamptz not null default now(),
  unique (tarea_id, completada_en)
);

create index if not exists idx_tarea_finalizaciones_tarea
  on public.tarea_finalizaciones (tarea_id, completada_en desc);

alter table public.tarea_finalizaciones enable row level security;
revoke all on table public.tarea_finalizaciones from anon, authenticated;

-- A client cannot manufacture the new event type. The task trigger below sets
-- this transaction-local flag immediately before writing each recipient row.
create or replace function public.notificaciones_proteger_eventos_tarea()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tipo = 'tarea'
     and coalesce(current_setting('app.task_completion_notification', true), '') <> 'on' then
    raise exception 'Las notificaciones de tareas se generan desde la transición de la tarea';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notificaciones_proteger_eventos_tarea on public.notificaciones;
create trigger trg_notificaciones_proteger_eventos_tarea
  before insert on public.notificaciones
  for each row execute function public.notificaciones_proteger_eventos_tarea();

create or replace function public.tareas_notificar_finalizacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_actor public.usuarios%rowtype;
  v_evento_id uuid;
  v_evento_clave text;
  v_contexto text;
  v_destinatario record;
begin
  if new.estado is not distinct from 'completada'
     or old.estado is not distinct from 'completada' then
    return new;
  end if;

  -- The actor must be the authenticated user that persisted the transition,
  -- never a recipient or company supplied by the client.
  if v_actor_id is null then
    raise exception 'No se pudo identificar a quien completó la tarea';
  end if;

  select * into v_actor
  from public.usuarios
  where id = v_actor_id and empresa_id = new.empresa_id and estado_activo and not eliminado;

  if not found then
    raise exception 'No autorizado para completar esta tarea';
  end if;

  new.completada_en := coalesce(new.completada_en, now());
  new.completada_por := v_actor_id;

  insert into public.tarea_finalizaciones (tarea_id, empresa_id, completada_por, completada_en)
  values (new.id, new.empresa_id, v_actor_id, new.completada_en)
  returning id into v_evento_id;

  v_evento_clave := 'task-completed:' || v_evento_id::text;
  v_contexto := coalesce(
    nullif(new.datos ->> 'proyecto', ''),
    nullif(new.datos ->> 'equipo', ''),
    nullif(new.datos ->> 'sucursal', ''),
    nullif(new.datos ->> 'sede', '')
  );

  perform set_config('app.task_completion_notification', 'on', true);

  -- Recipients are resolved from persisted tenant relationships only. DISTINCT
  -- makes overlapping admin / manager / assigner roles receive one event.
  for v_destinatario in
    select distinct u.id
    from public.usuarios u
    where u.empresa_id = new.empresa_id
      and u.estado_activo
      and not u.eliminado
      and u.id <> v_actor_id
      and (
        u.rol in ('admin', 'admin_empresa')
        or u.id = new.creado_por
        or u.id = v_actor.jefe_id
        or exists (
          select 1
          from public.departamentos d
          where d.id = v_actor.departamento_id
            and d.empresa_id = new.empresa_id
            and d.jefe_id = u.id
        )
      )
  loop
    insert into public.notificaciones (
      empresa_id, usuario_id, titulo, cuerpo, tipo, prioridad, datos, leida, evento_clave
    ) values (
      new.empresa_id,
      v_destinatario.id,
      'Tarea completada',
      format('%s ha completado la tarea "%s".%s', v_actor.nombre, new.titulo,
        case when v_contexto is null then '' else ' · ' || v_contexto end),
      'tarea',
      'media',
      jsonb_strip_nulls(jsonb_build_object(
        'evento_id', v_evento_id,
        'evento_clave', v_evento_clave,
        'tarea_id', new.id,
        'empleado_id', v_actor.id,
        'empleado_nombre', v_actor.nombre,
        'empleado_avatar', v_actor.foto_perfil,
        'completada_en', new.completada_en,
        'proyecto_equipo_sede', v_contexto,
        'destino', 'Tareas'
      )),
      false,
      v_evento_clave
    ) on conflict (usuario_id, evento_clave) where evento_clave is not null do nothing;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_tareas_notificar_finalizacion on public.tareas;
create trigger trg_tareas_notificar_finalizacion
  before update of estado on public.tareas
  for each row execute function public.tareas_notificar_finalizacion();

-- Task notifications are recipient-private even though legacy general notices
-- remain company-visible for compatibility with the existing inbox.
drop policy if exists notificaciones_select on public.notificaciones;
create policy notificaciones_select on public.notificaciones
  for select to authenticated
  using (
    usuario_id = (select auth.uid())
    or (
      public.misma_empresa(empresa_id)
      and tipo is distinct from 'bienestar'
      and tipo is distinct from 'tarea'
    )
  );

commit;
