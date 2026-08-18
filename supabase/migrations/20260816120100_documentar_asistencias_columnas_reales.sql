-- La tabla asistencias en producción tiene columnas (tipo, fecha_jornada, metodo_registro,
-- horas_trabajadas, horas_extra, tarde, minutos_tarde, salida_anticipada,
-- minutos_salida_anticipada, estado_aprobacion, offline_sync) que ninguna migración
-- documentaba -- se agregaron directo contra el proyecto remoto en algún momento, fuera
-- del flujo de migraciones. Ambas apps ya las leen/escriben (SupabaseAttendanceRepository
-- en mobile, adminRepository/WorkspaceModule en el dashboard) y funcionan bien porque la
-- columna sí existe en producción; el problema es que `supabase/migrations/` no podía
-- reconstruir el esquema real. Este ADD COLUMN IF NOT EXISTS es un no-op contra la base
-- actual (las columnas ya existen) -- solo alinea el historial de migraciones con la realidad.
alter table public.asistencias
  add column if not exists tipo text not null default 'entrada',
  add column if not exists fecha_jornada date,
  add column if not exists metodo_registro text,
  add column if not exists horas_trabajadas numeric,
  add column if not exists horas_extra numeric,
  add column if not exists tarde boolean,
  add column if not exists minutos_tarde integer,
  add column if not exists salida_anticipada boolean,
  add column if not exists minutos_salida_anticipada integer,
  add column if not exists estado_aprobacion text not null default 'pendiente',
  add column if not exists offline_sync boolean not null default false;
