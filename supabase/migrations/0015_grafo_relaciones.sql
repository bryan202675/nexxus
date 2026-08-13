-- Fase 14: Nexxus Brain -- grafo empresarial de relaciones entidad-entidad.
-- Tabla de relaciones genérica (un solo edge type para cualquier par de entidades) en vez de una
-- tabla de grafo/pgvector completa -- no hay todavía un caso de uso que necesite similitud
-- semántica ni recorridos de grafo complejos, solo "qué está conectado con qué".
-- Alcance confirmado: modelo de datos + 2-3 relaciones reales funcionando, no solo esquema vacío.
--
-- Sin aplicar todavia -- mismo criterio que 0012/0013/0014: se aplica cuando el usuario lo confirme.

begin;

create type public.grafo_entidad_tipo as enum (
  'usuario',
  'tarea',
  'documento',
  'solicitud_ausencia',
  'solicitud_interna',
  'departamento'
);

create table public.grafo_relaciones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  origen_tipo public.grafo_entidad_tipo not null,
  origen_id uuid not null,
  relacion_tipo text not null,
  destino_tipo public.grafo_entidad_tipo not null,
  destino_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  creado_por uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  -- Un mismo par (origen, relacion, destino) es una sola relación, no un log por evento -- reenviar
  -- un mensaje entre las mismas dos personas no crea un edge nuevo cada vez, solo confirma que ya
  -- existe (upsert con ignoreDuplicates desde el cliente).
  unique (empresa_id, origen_tipo, origen_id, relacion_tipo, destino_tipo, destino_id)
);

-- Los dos índices cubren ambos sentidos de la consulta típica de un grafo: "qué sale de esta
-- entidad" y "qué le apunta a esta entidad" -- sin esto, buscar las relaciones de un documento
-- (que siempre es destino, nunca origen) sería un full scan.
create index idx_grafo_relaciones_origen on public.grafo_relaciones(empresa_id, origen_tipo, origen_id);
create index idx_grafo_relaciones_destino on public.grafo_relaciones(empresa_id, destino_tipo, destino_id);

alter table public.grafo_relaciones enable row level security;

-- Lectura del grafo completo: jefe+ (igual que el resto de paneles operativos) -- un empleado
-- individual no necesita ver el mapa de relaciones de toda la empresa.
-- Escritura: cualquier usuario de la empresa, sin exigir jefe+ -- a diferencia de tareas/
-- documentos (que sí son jefe+), la mensajería interna (una de las 3 relaciones reales de esta
-- fase, ver ChatInterno.tsx) la usa cualquier empleado, y cada quien solo puede escribir edges
-- donde participa (lo aplica el código de la app, no esta policy -- la tabla no distingue "mi
-- edge" de "el edge de otro" a nivel de fila sin duplicar la lógica de cada flujo que ya valida
-- esto en la capa de aplicación).
create policy grafo_relaciones_select on public.grafo_relaciones
  for select using (public.misma_empresa(empresa_id) and public.es_jefe());
create policy grafo_relaciones_insert on public.grafo_relaciones
  for insert with check (public.misma_empresa(empresa_id));
create policy grafo_relaciones_delete on public.grafo_relaciones
  for delete using (public.misma_empresa(empresa_id) and public.es_jefe());

commit;
