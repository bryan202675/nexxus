-- Añadir índices compuestos a la tabla de asistencias para prevenir "statement timeout"
-- en las consultas del dashboard que filtran por empresa_id y ordenan por created_at,
-- y para las consultas de asistencias de hoy que filtran por empresa_id y fecha_jornada.

CREATE INDEX IF NOT EXISTS idx_asistencias_empresa_created_desc
  ON public.asistencias (empresa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_asistencias_empresa_fecha_created
  ON public.asistencias (empresa_id, fecha_jornada, created_at ASC);
