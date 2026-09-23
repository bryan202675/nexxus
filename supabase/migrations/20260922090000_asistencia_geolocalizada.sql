-- Eventos de geolocalización de asistencia. La ubicación se captura únicamente
-- al fichar; esta migración no crea ningún mecanismo de seguimiento continuo.
begin;

create extension if not exists postgis with schema extensions;

create table if not exists public.ubicaciones_asistencia (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  sede_id uuid not null references public.sedes(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 120),
  descripcion text,
  latitud double precision not null check (latitud between -90 and 90),
  longitud double precision not null check (longitud between -180 and 180),
  radio_metros integer not null check (radio_metros between 25 and 5000),
  tipos_evento text[] not null default array['entrada','salida']::text[]
    check (tipos_evento <@ array['entrada','salida']::text[] and cardinality(tipos_evento) > 0),
  es_predeterminada boolean not null default false,
  activa boolean not null default true,
  created_by uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, empresa_id)
);

create unique index if not exists ubicaciones_asistencia_predeterminada_por_sede
  on public.ubicaciones_asistencia (sede_id) where es_predeterminada and activa;
create index if not exists ubicaciones_asistencia_empresa_sede_activa
  on public.ubicaciones_asistencia (empresa_id, sede_id, activa);

create table if not exists public.eventos_geograficos_asistencia (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  sede_id uuid references public.sedes(id) on delete set null,
  asistencia_id uuid references public.asistencias(id) on delete set null,
  ubicacion_autorizada_id uuid references public.ubicaciones_asistencia(id) on delete set null,
  tipo_evento text not null check (tipo_evento in ('entrada','salida')),
  latitud double precision not null check (latitud between -90 and 90),
  longitud double precision not null check (longitud between -180 and 180),
  precision_horizontal_m double precision check (precision_horizontal_m >= 0 and precision_horizontal_m <= 100000),
  captured_at timestamptz not null,
  received_at timestamptz not null default now(),
  proveedor jsonb not null default '{}'::jsonb,
  distancia_m double precision,
  estado_validacion text not null check (estado_validacion in ('validado','fuera_de_zona','precision_insuficiente','sin_geocerca','pendiente_revision','excepcion_aprobada','excepcion_rechazada')),
  estado_revision text not null default 'no_requiere' check (estado_revision in ('no_requiere','pendiente','aprobada','rechazada')),
  idempotency_key uuid not null,
  justificacion text,
  revisado_por uuid references public.usuarios(id) on delete set null,
  revisado_at timestamptz,
  comentario_revision text,
  created_at timestamptz not null default now(),
  unique (usuario_id, idempotency_key)
);
create index if not exists eventos_geograficos_asistencia_empresa_fecha
  on public.eventos_geograficos_asistencia (empresa_id, captured_at desc);
create index if not exists eventos_geograficos_asistencia_empresa_sede_estado
  on public.eventos_geograficos_asistencia (empresa_id, sede_id, estado_validacion, captured_at desc);

alter table public.notificaciones drop constraint if exists notificaciones_tipo_check;
alter table public.notificaciones add constraint notificaciones_tipo_check
  -- Conserva los tipos históricos ya presentes en producción.
  check (tipo in ('general','bienestar','tarea','aprobacion','sistema','anuncio','info','solicitud','asistencia_geolocalizacion'));
create unique index if not exists notificaciones_alerta_geo_unica
  on public.notificaciones ((datos->>'evento_geografico_id'))
  where tipo = 'asistencia_geolocalizacion' and resuelta = false;
-- Las alertas geográficas, igual que las de bienestar, no son visibles para
-- miembros generales de la empresa; solo para su dueño o responsables.
drop policy if exists notificaciones_select on public.notificaciones;
create policy notificaciones_select on public.notificaciones for select to authenticated
  using (
    usuario_id = (select auth.uid())
    or (
      public.misma_empresa(empresa_id)
      and (tipo not in ('bienestar', 'asistencia_geolocalizacion') or public.es_jefe())
    )
  );

alter table public.ubicaciones_asistencia enable row level security;
alter table public.eventos_geograficos_asistencia enable row level security;
revoke all on public.ubicaciones_asistencia, public.eventos_geograficos_asistencia from anon, authenticated;
grant select, insert, update, delete on public.ubicaciones_asistencia to authenticated;
grant select, update on public.eventos_geograficos_asistencia to authenticated;

create policy ubicaciones_asistencia_select on public.ubicaciones_asistencia for select to authenticated
  using (public.misma_empresa(empresa_id));
create policy ubicaciones_asistencia_write on public.ubicaciones_asistencia for all to authenticated
  using (public.misma_empresa(empresa_id) and public.es_admin_empresa())
  with check (public.misma_empresa(empresa_id) and public.es_admin_empresa());
create policy eventos_geo_select on public.eventos_geograficos_asistencia for select to authenticated
  using (usuario_id = (select auth.uid()) or (public.misma_empresa(empresa_id) and public.es_jefe()));
create policy eventos_geo_review on public.eventos_geograficos_asistencia for update to authenticated
  using (public.misma_empresa(empresa_id) and public.es_jefe())
  with check (public.misma_empresa(empresa_id) and public.es_jefe());

create or replace function public.set_ubicacion_asistencia_updated_at() returns trigger
language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_ubicacion_asistencia_updated_at on public.ubicaciones_asistencia;
create trigger trg_ubicacion_asistencia_updated_at before update on public.ubicaciones_asistencia
for each row execute function public.set_ubicacion_asistencia_updated_at();

-- Único punto de escritura para fichajes GPS. Deriva el usuario, empresa y sede
-- desde la sesión/relaciones y calcula distancia geodésica con PostGIS.
create or replace function public.registrar_asistencia_geolocalizada(
  p_tipo text, p_latitud double precision, p_longitud double precision,
  p_precision_m double precision, p_captured_at timestamptz, p_idempotency_key uuid,
  p_proveedor jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_usuario public.usuarios%rowtype;
  v_ubicacion public.ubicaciones_asistencia%rowtype;
  v_evento public.eventos_geograficos_asistencia%rowtype;
  v_asistencia_id uuid;
  v_distancia double precision;
  v_estado text;
  v_revision text := 'no_requiere';
  v_max_precision constant double precision := 100;
begin
  if auth.uid() is null then raise exception 'Sesión requerida' using errcode = '28000'; end if;
  if p_tipo not in ('entrada','salida') then raise exception 'Tipo de fichaje inválido' using errcode = '22023'; end if;
  if p_latitud not between -90 and 90 or p_longitud not between -180 and 180 or p_precision_m is null or p_precision_m < 0 then
    raise exception 'Lectura GPS inválida' using errcode = '22023';
  end if;
  if p_captured_at < now() - interval '5 minutes' or p_captured_at > now() + interval '1 minute' then
    raise exception 'La ubicación debe ser reciente' using errcode = '22023';
  end if;
  select * into v_usuario from public.usuarios where id = auth.uid() and estado_activo and not baneado and not eliminado;
  if not found or v_usuario.empresa_id is null then raise exception 'Usuario no autorizado para fichar' using errcode = '42501'; end if;
  select * into v_evento from public.eventos_geograficos_asistencia where usuario_id = auth.uid() and idempotency_key = p_idempotency_key;
  if found then return jsonb_build_object('evento_id', v_evento.id, 'asistencia_id', v_evento.asistencia_id, 'estado', v_evento.estado_validacion, 'duplicado', true); end if;
  select * into v_ubicacion from public.ubicaciones_asistencia
    where empresa_id = v_usuario.empresa_id and sede_id = v_usuario.sede_id and activa and p_tipo = any(tipos_evento)
    order by es_predeterminada desc, created_at asc limit 1;
  if not found then
    v_estado := 'sin_geocerca'; v_revision := 'pendiente';
  elsif p_precision_m > v_max_precision then
    v_estado := 'precision_insuficiente'; v_revision := 'pendiente';
  else
    v_distancia := extensions.st_distance(
      extensions.st_setsrid(extensions.st_makepoint(p_longitud, p_latitud), 4326)::extensions.geography,
      extensions.st_setsrid(extensions.st_makepoint(v_ubicacion.longitud, v_ubicacion.latitud), 4326)::extensions.geography
    );
    if v_distancia - p_precision_m > v_ubicacion.radio_metros then v_estado := 'fuera_de_zona'; v_revision := 'pendiente';
    elsif v_distancia + p_precision_m > v_ubicacion.radio_metros then v_estado := 'precision_insuficiente'; v_revision := 'pendiente';
    else v_estado := 'validado'; end if;
  end if;
  if v_estado = 'validado' then
    if p_tipo = 'entrada' and exists (select 1 from public.asistencias where usuario_id = auth.uid() and tipo = 'entrada' and coalesce(fecha_jornada, created_at::date) = current_date and not exists (select 1 from public.asistencias s where s.usuario_id = auth.uid() and s.tipo = 'salida' and coalesce(s.fecha_jornada, s.created_at::date) = current_date)) then
      raise exception 'Ya existe una jornada activa' using errcode = '23505';
    end if;
    if p_tipo = 'salida' and not exists (select 1 from public.asistencias where usuario_id = auth.uid() and tipo = 'entrada' and coalesce(fecha_jornada, created_at::date) = current_date) then
      raise exception 'No existe una entrada activa para cerrar' using errcode = '23505';
    end if;
    insert into public.asistencias (empresa_id, usuario_id, tipo, fecha_jornada, metodo_registro, estado_aprobacion)
      values (v_usuario.empresa_id, auth.uid(), p_tipo, current_date, 'movil', 'aprobado') returning id into v_asistencia_id;
  end if;
  insert into public.eventos_geograficos_asistencia (empresa_id, usuario_id, sede_id, asistencia_id, ubicacion_autorizada_id, tipo_evento, latitud, longitud, precision_horizontal_m, captured_at, proveedor, distancia_m, estado_validacion, estado_revision, idempotency_key)
  values (v_usuario.empresa_id, auth.uid(), v_usuario.sede_id, v_asistencia_id, v_ubicacion.id, p_tipo, p_latitud, p_longitud, p_precision_m, p_captured_at, coalesce(p_proveedor, '{}'::jsonb), v_distancia, v_estado, v_revision, p_idempotency_key)
  returning * into v_evento;
  if v_estado = 'fuera_de_zona' then
    insert into public.notificaciones (empresa_id, usuario_id, titulo, cuerpo, tipo, prioridad, datos)
    values (v_usuario.empresa_id, auth.uid(), 'Alerta crítica de asistencia', 'Se detectó un intento de registro fuera de la zona autorizada.', 'asistencia_geolocalizacion', 'critica', jsonb_build_object('evento_geografico_id', v_evento.id, 'tipo_evento', p_tipo, 'sede_id', v_usuario.sede_id, 'distancia_m', round(v_distancia)::integer, 'precision_m', round(p_precision_m)::integer))
    on conflict ((datos->>'evento_geografico_id')) where tipo = 'asistencia_geolocalizacion' and resuelta = false do nothing;
  end if;
  return jsonb_build_object('evento_id', v_evento.id, 'asistencia_id', v_asistencia_id, 'estado', v_estado, 'distancia_m', v_distancia, 'radio_metros', v_ubicacion.radio_metros, 'precision_m', p_precision_m, 'duplicado', false);
end; $$;
revoke all on function public.registrar_asistencia_geolocalizada(text,double precision,double precision,double precision,timestamptz,uuid,jsonb) from public, anon;
grant execute on function public.registrar_asistencia_geolocalizada(text,double precision,double precision,double precision,timestamptz,uuid,jsonb) to authenticated;

-- Solo responsables autorizados pueden resolver una excepción; las coordenadas no se reescriben.
create or replace function public.revisar_evento_geografico_asistencia(p_evento_id uuid, p_aprobar boolean, p_comentario text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_evento public.eventos_geograficos_asistencia%rowtype;
begin
  if not public.es_jefe() then raise exception 'No autorizado' using errcode = '42501'; end if;
  select * into v_evento from public.eventos_geograficos_asistencia where id = p_evento_id and public.misma_empresa(empresa_id) for update;
  if not found or v_evento.estado_revision <> 'pendiente' then raise exception 'Evento no revisable' using errcode = '22023'; end if;
  update public.eventos_geograficos_asistencia set estado_revision = case when p_aprobar then 'aprobada' else 'rechazada' end, estado_validacion = case when p_aprobar then 'excepcion_aprobada' else 'excepcion_rechazada' end, revisado_por = auth.uid(), revisado_at = now(), comentario_revision = nullif(trim(p_comentario), '') where id = p_evento_id;
  update public.notificaciones set resuelta = true, resuelta_por = auth.uid(), resuelta_en = now(), leida = true, fecha_lectura = now() where tipo = 'asistencia_geolocalizacion' and datos->>'evento_geografico_id' = p_evento_id::text;
end; $$;
revoke all on function public.revisar_evento_geografico_asistencia(uuid,boolean,text) from public, anon;
grant execute on function public.revisar_evento_geografico_asistencia(uuid,boolean,text) to authenticated;

alter publication supabase_realtime add table public.ubicaciones_asistencia, public.eventos_geograficos_asistencia;
commit;
