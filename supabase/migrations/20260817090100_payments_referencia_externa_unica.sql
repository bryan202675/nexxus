-- confirm-plan-purchase hacía lectura-luego-inserción (select por referencia_externa, luego
-- insert) sin ninguna restricción única real de por medio: dos solicitudes concurrentes con el
-- mismo purchaseId (ej. un reintento de red del lado del cliente) podían ambas pasar el chequeo
-- "no existe todavía" y ambas insertar una fila de payments para la misma compra, duplicando el
-- crédito de la suscripción. Verificado: no había filas duplicadas existentes, así que el índice
-- se puede crear sin migrar datos.
create unique index if not exists payments_referencia_externa_unique
  on public.payments (referencia_externa)
  where referencia_externa is not null;
