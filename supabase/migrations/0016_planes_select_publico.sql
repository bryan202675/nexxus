-- Fase 15: la tabla planes pasó a ser la fuente de verdad del catálogo de precios/features, leída
-- directamente por el cliente (mobile + dashboard) en vez de un catálogo hardcodeado. La política
-- anterior (planes_select: solo auth.uid() IS NOT NULL) bloqueaba justo el caso que más lo
-- necesita: la pantalla pública de registro, antes de iniciar sesión. Precios de planes no son
-- información sensible -- es normal que sean públicos (como cualquier página de pricing).
drop policy if exists planes_select on public.planes;
create policy planes_select on public.planes
  for select using (true);
