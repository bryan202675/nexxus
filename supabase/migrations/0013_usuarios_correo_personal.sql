-- Fase 11: correo personal de contacto para email transaccional (bienvenida, recuperación).
-- Separado de `correo` (que sigue siendo el correo sintético de login usuario@codigoempresa.nexxus
-- para empleados, o el correo real para el admin que registró la empresa). Opcional: si el admin
-- no lo llena, simplemente no se envían correos a ese empleado.
alter table public.usuarios
  add column if not exists correo_personal text;
