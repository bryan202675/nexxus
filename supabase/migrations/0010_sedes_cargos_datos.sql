alter table public.sedes add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.cargos add column if not exists datos jsonb not null default '{}'::jsonb;
