-- Fase B (modulo empleado): gamificacion real. Los puntos se calculan en vivo (ver
-- packages/domain/services/gamificationEngine.ts), pero la fecha en que un empleado cruzo un
-- umbral de logro no se puede reconstruir despues -- eso si necesita persistirse en el momento.
create table public.logros_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  codigo_logro text not null,
  fecha_obtenida timestamptz not null default now(),
  unique (usuario_id, codigo_logro)
);

create index idx_logros_usuario_usuario on public.logros_usuario(usuario_id);

alter table public.logros_usuario enable row level security;

-- Lectura: el propio usuario o jefe+ de la misma empresa (ver el progreso del equipo es un
-- privilegio operativo normal, igual que el resto de paneles).
create policy logros_usuario_select on public.logros_usuario
  for select using (usuario_id = auth.uid() or (misma_empresa(empresa_id) and es_jefe()));

-- Escritura: solo el propio usuario puede otorgarse sus logros -- es un calculo derivado de datos
-- que el ya puede leer (sus propias tareas/racha/cursos), no un privilegio nuevo. unique(usuario_id,
-- codigo_logro) evita duplicados aunque SyncAchievements se llame varias veces.
create policy logros_usuario_insert on public.logros_usuario
  for insert with check (usuario_id = auth.uid() and misma_empresa(empresa_id));
