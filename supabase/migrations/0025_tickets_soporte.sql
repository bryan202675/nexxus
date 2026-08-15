-- Fase F (modulo empleado): sistema real de tickets de soporte, separado de solicitudes_internas.
-- ticket_creado_por se denormaliza desde tickets.creado_por sobre ticket_mensajes (mismo criterio
-- pragmatico usado en tarea_comentarios/objetivos) para que las policies de RLS no necesiten join.

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  creado_por uuid not null references public.usuarios(id) on delete cascade,
  creado_por_nombre text not null default '',
  titulo text not null,
  descripcion text not null default '',
  categoria text not null default 'tecnico' check (categoria in ('tecnico', 'incidente', 'otro')),
  prioridad text not null default 'media' check (prioridad in ('baja', 'media', 'alta', 'urgente')),
  estado text not null default 'abierto' check (estado in ('abierto', 'en_progreso', 'resuelto', 'cerrado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mensajes del hilo del ticket. Inmutables (sin update/delete) igual que chat_contextual: son un
-- registro de auditoria de la conversacion, no notas editables.
create table public.ticket_mensajes (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  ticket_creado_por uuid references public.usuarios(id) on delete set null,
  autor_id uuid not null references public.usuarios(id) on delete cascade,
  autor_nombre text not null default '',
  texto text not null,
  created_at timestamptz not null default now()
);

create index idx_tickets_empresa on public.tickets(empresa_id, created_at);
create index idx_tickets_creado_por on public.tickets(creado_por);
create index idx_ticket_mensajes_ticket on public.ticket_mensajes(ticket_id, created_at);

create trigger trg_tickets_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

alter table public.tickets enable row level security;
alter table public.ticket_mensajes enable row level security;

-- tickets: el creador ve/crea los suyos; jefe+ de la misma empresa ve y puede cambiar el estado
-- (triage de soporte). El creador tambien puede cambiar el estado (ej. cerrar su propio ticket).
create policy tickets_select on public.tickets
  for select using (misma_empresa(empresa_id) or creado_por = auth.uid());
create policy tickets_insert on public.tickets
  for insert with check (misma_empresa(empresa_id) and creado_por = auth.uid());
create policy tickets_update on public.tickets
  for update using ((misma_empresa(empresa_id) and es_jefe()) or creado_por = auth.uid());

-- ticket_mensajes: ver = misma empresa o dueño del ticket; escribir = jefe+ (respuesta de soporte)
-- o el creador del ticket (seguimiento). Inmutable: sin policies de update/delete.
create policy ticket_mensajes_select on public.ticket_mensajes
  for select using (misma_empresa(empresa_id) or ticket_creado_por = auth.uid());
create policy ticket_mensajes_insert on public.ticket_mensajes
  for insert with check (
    (misma_empresa(empresa_id) and (es_jefe() or ticket_creado_por = auth.uid()))
    and autor_id = auth.uid()
  );

-- Realtime: sin esto el hilo del ticket y la lista no se actualizarian solos.
alter publication supabase_realtime add table tickets, ticket_mensajes;
