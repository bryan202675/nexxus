-- Nexxus: columna "datos jsonb" de respaldo en las tablas cuyo entity de
-- dominio (nexxus/app/src/domain/entities/*.ts) tiene bastantes más campos
-- que las columnas tipadas definidas en la Fase 0 (proyecto/cliente/tags en
-- tareas, targeting de anuncios, campos legacy de payments, etc). Los
-- repositorios de Supabase escriben ahi los campos sin columna dedicada y
-- los fusionan de vuelta al mapear la fila a la entidad -- evita perder
-- fidelidad de campo mientras se termina de mapear cada modulo, sin tener
-- que adivinar por adelantado cada columna posible.

begin;

alter table public.tareas add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.solicitudes_ausencia add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.solicitudes_internas add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.citas add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.payments add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.nominas add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.documentos add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.departamentos add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.anuncios add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.incidencias add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.inventario_activos add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.reportes add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.evaluaciones add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.checkins add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.feedbacks add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.calendario_empresarial add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.especialistas add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.roles_personalizados add column if not exists datos jsonb not null default '{}'::jsonb;

commit;
