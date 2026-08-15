-- Fase D (modulo empleado): subtareas, comentarios editables y adjuntos reales para tareas.
-- tarea_asignado_a se denormaliza desde tareas.asignado_a (mismo criterio pragmatico usado en
-- objetivos/objetivo_resultados_clave) para que las policies de RLS no necesiten subquery/join.

create table public.tarea_subtareas (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  tarea_asignado_a uuid references public.usuarios(id) on delete set null,
  titulo text not null,
  completada boolean not null default false,
  orden integer not null default 0,
  creado_por uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tarea_comentarios (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  tarea_asignado_a uuid references public.usuarios(id) on delete set null,
  autor_id uuid not null references public.usuarios(id) on delete cascade,
  autor_nombre text not null default '',
  texto text not null,
  editado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tarea_adjuntos (
  id uuid primary key default gen_random_uuid(),
  tarea_id uuid not null references public.tareas(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  tarea_asignado_a uuid references public.usuarios(id) on delete set null,
  nombre text not null,
  url text not null,
  public_id text not null,
  mime text not null default '',
  tamano bigint not null default 0,
  subido_por uuid references public.usuarios(id) on delete set null,
  subido_por_nombre text not null default '',
  created_at timestamptz not null default now()
);

create index idx_tarea_subtareas_tarea on public.tarea_subtareas(tarea_id, orden);
create index idx_tarea_comentarios_tarea on public.tarea_comentarios(tarea_id, created_at);
create index idx_tarea_adjuntos_tarea on public.tarea_adjuntos(tarea_id);

create trigger trg_tarea_subtareas_updated_at
  before update on public.tarea_subtareas
  for each row execute function public.set_updated_at();
create trigger trg_tarea_comentarios_updated_at
  before update on public.tarea_comentarios
  for each row execute function public.set_updated_at();

alter table public.tarea_subtareas enable row level security;
alter table public.tarea_comentarios enable row level security;
alter table public.tarea_adjuntos enable row level security;

-- subtareas: ver = misma empresa; crear/editar(toggle)/borrar = jefe+ o el asignado de la tarea.
create policy tarea_subtareas_select on public.tarea_subtareas
  for select using (misma_empresa(empresa_id) or tarea_asignado_a = auth.uid());
create policy tarea_subtareas_insert on public.tarea_subtareas
  for insert with check (misma_empresa(empresa_id) and (es_jefe() or tarea_asignado_a = auth.uid()));
create policy tarea_subtareas_update on public.tarea_subtareas
  for update using (misma_empresa(empresa_id) and (es_jefe() or tarea_asignado_a = auth.uid()));
create policy tarea_subtareas_delete on public.tarea_subtareas
  for delete using (misma_empresa(empresa_id) and (es_jefe() or tarea_asignado_a = auth.uid()));

-- comentarios: ver = misma empresa; crear = jefe+ o el asignado; editar = SOLO el autor (no ni
-- siquiera el jefe puede alterar el texto de otro, solo moderar borrando); borrar = autor o jefe+.
create policy tarea_comentarios_select on public.tarea_comentarios
  for select using (misma_empresa(empresa_id) or tarea_asignado_a = auth.uid());
create policy tarea_comentarios_insert on public.tarea_comentarios
  for insert with check (misma_empresa(empresa_id) and (es_jefe() or tarea_asignado_a = auth.uid()) and autor_id = auth.uid());
create policy tarea_comentarios_update on public.tarea_comentarios
  for update using (autor_id = auth.uid());
create policy tarea_comentarios_delete on public.tarea_comentarios
  for delete using (autor_id = auth.uid() or (misma_empresa(empresa_id) and es_jefe()));

-- adjuntos: ver = misma empresa; subir = jefe+ o el asignado; borrar = quien lo subio o jefe+.
create policy tarea_adjuntos_select on public.tarea_adjuntos
  for select using (misma_empresa(empresa_id) or tarea_asignado_a = auth.uid());
create policy tarea_adjuntos_insert on public.tarea_adjuntos
  for insert with check (misma_empresa(empresa_id) and (es_jefe() or tarea_asignado_a = auth.uid()) and subido_por = auth.uid());
create policy tarea_adjuntos_delete on public.tarea_adjuntos
  for delete using (subido_por = auth.uid() or (misma_empresa(empresa_id) and es_jefe()));

-- Realtime: sin esto el tablero kanban no reflejaria en vivo subtareas/comentarios/adjuntos nuevos.
alter publication supabase_realtime add table tarea_subtareas, tarea_comentarios, tarea_adjuntos;
