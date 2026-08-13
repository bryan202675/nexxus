alter table public.empresas add column if not exists datos jsonb not null default '{}'::jsonb;
