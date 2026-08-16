-- Solicitudes formales de extensión. El comentario de tarea queda como historial,
-- pero la decisión y el cambio de fecha se administran desde esta entidad.
create table public.solicitudes_extension_tarea (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  tarea_id uuid not null references public.tareas(id) on delete cascade,
  solicitante_id uuid not null references public.usuarios(id) on delete cascade,
  solicitante_nombre text not null default '',
  tarea_titulo text not null default '',
  fecha_limite_anterior timestamptz,
  fecha_limite_solicitada timestamptz not null,
  dias_solicitados integer not null check (dias_solicitados > 0 and dias_solicitados <= 365),
  urgencia text not null check (urgencia in ('Normal', 'Alta', 'Crítica')),
  motivo text not null check (char_length(trim(motivo)) > 0),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  resuelto_por uuid references public.usuarios(id) on delete set null,
  resuelto_en timestamptz,
  observacion_resolucion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_solicitudes_extension_tarea_pendientes
  on public.solicitudes_extension_tarea (empresa_id, estado, created_at desc);
create unique index idx_solicitudes_extension_tarea_pendiente_por_tarea
  on public.solicitudes_extension_tarea (tarea_id)
  where estado = 'pendiente';

create trigger trg_solicitudes_extension_tarea_updated_at
  before update on public.solicitudes_extension_tarea
  for each row execute function public.set_updated_at();

alter table public.solicitudes_extension_tarea enable row level security;

create policy solicitudes_extension_tarea_select on public.solicitudes_extension_tarea
  for select using (
    public.misma_empresa(empresa_id)
    and (public.es_admin_empresa() or solicitante_id = auth.uid())
  );

create policy solicitudes_extension_tarea_insert on public.solicitudes_extension_tarea
  for insert with check (
    empresa_id = public.empresa_actual()
    and solicitante_id = auth.uid()
    and exists (
      select 1 from public.tareas tarea
      where tarea.id = tarea_id
        and tarea.empresa_id = solicitudes_extension_tarea.empresa_id
        and tarea.asignado_a = auth.uid()
    )
  );

grant select, insert on table public.solicitudes_extension_tarea to authenticated;

-- Solo el propietario/admin puede resolver. La función también actualiza la fecha
-- límite de forma atómica para evitar aprobaciones duplicadas o parciales.
create or replace function public.resolver_solicitud_extension_tarea(
  p_solicitud_id uuid,
  p_aprobar boolean,
  p_observacion text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  solicitud public.solicitudes_extension_tarea%rowtype;
  estado_final text := case when p_aprobar then 'aprobada' else 'rechazada' end;
begin
  if not public.es_admin_empresa() then
    raise exception 'No autorizado para resolver solicitudes de extensión';
  end if;

  select * into solicitud from public.solicitudes_extension_tarea
  where id = p_solicitud_id and empresa_id = public.empresa_actual() and estado = 'pendiente'
  for update;
  if not found then
    raise exception 'La solicitud ya fue resuelta o no existe';
  end if;

  update public.solicitudes_extension_tarea
  set estado = estado_final,
      resuelto_por = auth.uid(),
      resuelto_en = now(),
      observacion_resolucion = nullif(trim(coalesce(p_observacion, '')), '')
  where id = solicitud.id;

  if p_aprobar then
    update public.tareas
    set fecha_limite = solicitud.fecha_limite_solicitada
    where id = solicitud.tarea_id and empresa_id = solicitud.empresa_id;
  end if;

  insert into public.notificaciones (empresa_id, usuario_id, titulo, cuerpo, tipo, leida)
  values (
    solicitud.empresa_id,
    solicitud.solicitante_id,
    case when p_aprobar then 'Extensión aprobada' else 'Extensión rechazada' end,
    case when p_aprobar
      then format('La nueva fecha límite de "%s" es %s.', solicitud.tarea_titulo, to_char(solicitud.fecha_limite_solicitada, 'DD/MM/YYYY'))
      else format('La extensión de "%s" fue rechazada.', solicitud.tarea_titulo)
    end,
    'aprobacion',
    false
  );
end;
$$;

revoke execute on function public.resolver_solicitud_extension_tarea(uuid, boolean, text) from public;
grant execute on function public.resolver_solicitud_extension_tarea(uuid, boolean, text) to authenticated;

alter publication supabase_realtime add table public.solicitudes_extension_tarea;
