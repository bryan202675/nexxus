-- Fase A (modulo empleado): se quita la validacion de zona/geofencing por decision del usuario --
-- pedia "detectar zona sin guardar GPS", lo cual es tecnicamente contradictorio (no se puede saber
-- si alguien esta en zona sin conocer su ubicacion). En vez de guardar GPS sin validarlo de verdad
-- (como estaba antes: gps guardado, validado_en_zona hardcodeado en false), se quita el concepto
-- por completo. El check-in queda solo entrada/salida por hora. Tabla vacia (sin datos reales que
-- perder) al momento de este cambio.
alter table public.asistencias
  drop column if exists gps,
  drop column if exists ubicacion,
  drop column if exists ubicacion_estado;
