-- La tabla "reportes" nunca tuvo columnas estado/resuelto_por/resolved_at, a diferencia de
-- solicitudes_ausencia/solicitudes_internas -- pero SupabaseRequestReportRepository.ts (mobile,
-- Centro de Reportes) siempre intentó escribir esas tres columnas al resolver un reporte
-- disciplinario, y siempre leyó item.estado para filtros/KPIs. Resultado: resolver un "reporte"
-- (a diferencia de una solicitud de ausencia/interna) fallaba con "Could not find the 'estado'
-- column of 'reportes' in the schema cache" -- el mismo tipo de bug ya arreglado antes para
-- solicitudes_internas.resuelto_por, aquí faltaban las tres columnas completas.

alter table public.reportes
  add column if not exists estado text not null default 'pendiente',
  add column if not exists resuelto_por uuid references public.usuarios(id),
  add column if not exists resolved_at timestamptz;

create index if not exists idx_reportes_estado on public.reportes (estado);
create index if not exists idx_reportes_resuelto_por on public.reportes (resuelto_por);
