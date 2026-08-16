-- Tabla de solicitudes de soporte público / general (onboarding, login y asistencia de plataforma).
create table if not exists public.solicitudes_soporte_publico (
  id uuid primary key default gen_random_uuid(),
  ticket_codigo text not null,
  nombre text not null,
  correo text not null,
  telefono text,
  empresa text,
  categoria text not null default 'acceso' check (categoria in ('acceso', 'registro_empresa', 'tecnico', 'facturacion', 'otro')),
  asunto text not null,
  mensaje text not null,
  prioridad text not null default 'media' check (prioridad in ('baja', 'media', 'alta', 'urgente')),
  origen text not null default 'app',
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_revision', 'contactado', 'resuelto')),
  respuesta_soporte text,
  atendido_por uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_solicitudes_soporte_publico_estado
  on public.solicitudes_soporte_publico (estado, created_at desc);

create trigger trg_solicitudes_soporte_publico_updated_at
  before update on public.solicitudes_soporte_publico
  for each row execute function public.set_updated_at();

alter table public.solicitudes_soporte_publico enable row level security;

-- Cualquiera (incluso sin autenticar en onboarding) puede enviar una solicitud de soporte
drop policy if exists soporte_publico_insert on public.solicitudes_soporte_publico;
create policy soporte_publico_insert on public.solicitudes_soporte_publico
  for insert to anon, authenticated with check (true);

-- Super admin puede leer y actualizar todas las solicitudes públicas de soporte
drop policy if exists soporte_publico_select on public.solicitudes_soporte_publico;
create policy soporte_publico_select on public.solicitudes_soporte_publico
  for select to authenticated using (public.es_super_admin());

drop policy if exists soporte_publico_update on public.solicitudes_soporte_publico;
create policy soporte_publico_update on public.solicitudes_soporte_publico
  for update to authenticated using (public.es_super_admin()) with check (public.es_super_admin());

grant insert on table public.solicitudes_soporte_publico to anon, authenticated;
grant select, update on table public.solicitudes_soporte_publico to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'solicitudes_soporte_publico'
  ) then
    alter publication supabase_realtime add table public.solicitudes_soporte_publico;
  end if;
end $$;
