-- Permite conservar el motivo de los registros manuales de asistencia.
-- IF NOT EXISTS mantiene la migración segura frente a entornos donde la
-- columna ya haya sido creada directamente en Supabase.
alter table public.asistencias
  add column if not exists observaciones text;

-- Asegura que PostgREST no conserve una caché anterior de la tabla.
notify pgrst, 'reload schema';
