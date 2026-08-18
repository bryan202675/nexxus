-- apps/dashboard/src/views/nexxus/empresa-solicitudes/index.tsx (Bandeja Unificada de
-- Solicitudes) resuelve solicitudes_ausencia y solicitudes_internas con el mismo código
-- genérico (handleResolve), que siempre escribe resuelto_por -- pero solicitudes_internas
-- nunca tuvo esa columna (solo solicitudes_ausencia la tenía), así que aprobar/rechazar
-- cualquier solicitud interna fallaba con "Could not find the 'resuelto_por' column of
-- 'solicitudes_internas' in the schema cache". Se agrega la misma columna, con el mismo tipo
-- y FK que ya tiene solicitudes_ausencia.
alter table public.solicitudes_internas
  add column if not exists resuelto_por uuid references public.usuarios(id);

create index if not exists idx_solicitudes_internas_resuelto_por on public.solicitudes_internas (resuelto_por);
