-- Fase C (modulo empleado): Objetivos/OKR reales -- metodologia estandar (un Objetivo cualitativo
-- + varios Resultados Clave cuantitativos). El progreso NUNCA se guarda: se calcula siempre desde
-- valor_actual/valor_objetivo de cada KR (ver packages/domain/services/okrEngine.ts).
create table public.objetivos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  creado_por uuid not null references public.usuarios(id) on delete set null,
  titulo text not null,
  descripcion text not null default '',
  ciclo text not null,
  estado text not null default 'activo' check (estado in ('activo', 'completado', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.objetivo_resultados_clave (
  id uuid primary key default gen_random_uuid(),
  objetivo_id uuid not null references public.objetivos(id) on delete cascade,
  -- empresa_id/usuario_id denormalizados desde objetivos para que las policies de RLS no
  -- necesiten un subquery/join en cada chequeo -- mismo criterio pragmatico usado en otras tablas
  -- de este esquema (ej. inbox_unificado).
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  titulo text not null,
  valor_objetivo numeric not null,
  valor_actual numeric not null default 0,
  unidad text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_objetivos_usuario on public.objetivos(usuario_id, ciclo);
create index idx_objetivos_empresa on public.objetivos(empresa_id);
create index idx_okr_resultados_objetivo on public.objetivo_resultados_clave(objetivo_id);

create trigger trg_objetivos_updated_at
  before update on public.objetivos
  for each row execute function public.set_updated_at();
create trigger trg_okr_resultados_updated_at
  before update on public.objetivo_resultados_clave
  for each row execute function public.set_updated_at();

alter table public.objetivos enable row level security;
alter table public.objetivo_resultados_clave enable row level security;

-- objetivos: el dueño ve/edita los suyos; jefe+ de la misma empresa puede ver y crear/editar
-- objetivos para su equipo (asignar objetivos a un reporte directo es una funcion normal de jefe).
create policy objetivos_select on public.objetivos
  for select using (usuario_id = auth.uid() or (misma_empresa(empresa_id) and es_jefe()));
create policy objetivos_insert on public.objetivos
  for insert with check (misma_empresa(empresa_id) and (usuario_id = auth.uid() or es_jefe()));
create policy objetivos_update on public.objetivos
  for update using (usuario_id = auth.uid() or (misma_empresa(empresa_id) and es_jefe()));
create policy objetivos_delete on public.objetivos
  for delete using (usuario_id = auth.uid() or (misma_empresa(empresa_id) and es_jefe()));

-- resultados clave: mismo criterio, usando las columnas denormalizadas.
create policy okr_resultados_select on public.objetivo_resultados_clave
  for select using (usuario_id = auth.uid() or (misma_empresa(empresa_id) and es_jefe()));
create policy okr_resultados_insert on public.objetivo_resultados_clave
  for insert with check (misma_empresa(empresa_id) and (usuario_id = auth.uid() or es_jefe()));
create policy okr_resultados_update on public.objetivo_resultados_clave
  for update using (usuario_id = auth.uid() or (misma_empresa(empresa_id) and es_jefe()));
create policy okr_resultados_delete on public.objetivo_resultados_clave
  for delete using (usuario_id = auth.uid() or (misma_empresa(empresa_id) and es_jefe()));

-- Realtime: mismo criterio de la Fase 16 (publicacion supabase_realtime) -- sin esto la lista de
-- objetivos no se actualizaria sola al crear/editar/eliminar.
alter publication supabase_realtime add table objetivos, objetivo_resultados_clave;
