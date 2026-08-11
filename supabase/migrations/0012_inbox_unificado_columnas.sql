-- Fase 9 (Bandeja Unificada real): promueve titulo/estado/prioridad/tipo/origen_ref_id de
-- inbox_unificado.contenido (jsonb) a columnas reales, para poder filtrar/indexar por estado y
-- prioridad en el servidor en vez de siempre traer todo y filtrar en el cliente.
--
-- NO CAMBIA el comportamiento actual: apps/mobile/src/infrastructure/supabase/SupabaseInboxRepository.ts
-- sigue leyendo/escribiendo via `contenido` hasta que se actualice explicitamente para usar estas
-- columnas -- aplicar esta migracion es seguro y aditivo (no rompe nada) incluso antes de ese cambio
-- de codigo, pero el codigo debe actualizarse en un paso separado para aprovecharla.
--
-- IMPORTANTE: esta migracion NO se aplico al proyecto Supabase real en la sesion donde se escribio
-- (ver NEXXUS_IMPLEMENTATION_PLAN.md, Fase 9) -- solo queda commiteada en el repo, pendiente de
-- que el usuario confirme el despliegue.

alter table public.inbox_unificado
  add column if not exists titulo text,
  add column if not exists mensaje text,
  add column if not exists estado text not null default 'pendiente',
  add column if not exists prioridad text not null default 'normal',
  add column if not exists tipo text,
  add column if not exists origen_ref_id text;

-- Backfill desde el jsonb existente, por si hay filas ya insertadas por SupabaseInboxRepository.addItem.
update public.inbox_unificado
set
  titulo = coalesce(titulo, contenido->>'titulo'),
  mensaje = coalesce(mensaje, contenido->>'mensaje'),
  estado = coalesce(nullif(contenido->>'estado', ''), estado),
  prioridad = coalesce(nullif(contenido->>'prioridad', ''), prioridad),
  tipo = coalesce(tipo, origen),
  origen_ref_id = coalesce(origen_ref_id, contenido->>'origenRefId')
where contenido is not null;

create index if not exists inbox_unificado_estado_idx on public.inbox_unificado (empresa_id, usuario_id, estado);
create index if not exists inbox_unificado_prioridad_idx on public.inbox_unificado (empresa_id, prioridad) where estado = 'pendiente';

comment on column public.inbox_unificado.estado is 'pendiente | resuelto -- antes solo vivia dentro de contenido (jsonb)';
comment on column public.inbox_unificado.prioridad is 'normal | urgente -- antes solo vivia dentro de contenido (jsonb)';
