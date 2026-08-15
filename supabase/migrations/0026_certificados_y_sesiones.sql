-- Fase H (modulo empleado): certificados reales de capacitacion + sesiones/dispositivos.

-- Parte A: el codigo de certificado nunca se generaba (campo declarado en el dominio pero
-- inexistente en la tabla). Se genera server-side en la Edge Function complete-training-module
-- al completar el curso, una sola vez (idempotente).
alter table public.capacitacion_avances add column if not exists certificado_codigo text;
alter table public.capacitacion_avances add column if not exists certificado_emitido_at timestamptz;

-- Parte B: sesiones/dispositivos. Tabla privada por usuario (RLS solo self, ni siquiera el
-- jefe puede leer los dispositivos de otro usuario -- es informacion sensible de seguridad
-- personal, distinta al resto de tablas de este esquema donde jefe+ suele tener visibilidad).
create table public.sesiones_dispositivo (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  device_id text not null,
  dispositivo_nombre text not null default 'Dispositivo',
  dispositivo_so text not null default '',
  app_version text not null default '',
  creado_en timestamptz not null default now(),
  ultimo_acceso timestamptz not null default now(),
  unique (usuario_id, device_id)
);

create index idx_sesiones_dispositivo_usuario on public.sesiones_dispositivo(usuario_id);

alter table public.sesiones_dispositivo enable row level security;

create policy sesiones_dispositivo_select on public.sesiones_dispositivo
  for select using (usuario_id = auth.uid());
create policy sesiones_dispositivo_insert on public.sesiones_dispositivo
  for insert with check (usuario_id = auth.uid());
create policy sesiones_dispositivo_update on public.sesiones_dispositivo
  for update using (usuario_id = auth.uid());
create policy sesiones_dispositivo_delete on public.sesiones_dispositivo
  for delete using (usuario_id = auth.uid());

alter publication supabase_realtime add table sesiones_dispositivo;
