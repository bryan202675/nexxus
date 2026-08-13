-- Nexxus: agregar columna 'datos jsonb' a conversaciones y mensajes
-- Permite guardar metadatos extendidos (tipo de conversación, título personalizado, adjuntos y nombres de remitente)

begin;

alter table public.conversaciones add column if not exists datos jsonb not null default '{}'::jsonb;
alter table public.mensajes add column if not exists datos jsonb not null default '{}'::jsonb;

commit;
