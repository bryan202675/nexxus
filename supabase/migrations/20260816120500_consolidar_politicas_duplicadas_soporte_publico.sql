-- solicitudes_soporte_publico terminó con 2 juegos de políticas duplicadas para las mismas
-- operaciones (probablemente de 0029_solicitudes_soporte_publico.sql y la migración de
-- reparación posterior, que agregó un segundo juego sin borrar el primero). El advisor de
-- performance marca esto como "multiple_permissive_policies": cada política adicional
-- duplica el costo de evaluación en esa tabla. Nos quedamos con el juego "soporte_publico_*"
-- porque es más preciso (soporte_publico_select/update están acotadas al rol authenticated en
-- vez de public, y soporte_publico_update ya tiene WITH CHECK además de USING) y borramos el
-- juego "solicitudes_soporte_publico_*", que es un subconjunto redundante del mismo permiso.
drop policy if exists "solicitudes_soporte_publico_insert" on public.solicitudes_soporte_publico;
drop policy if exists "solicitudes_soporte_publico_select" on public.solicitudes_soporte_publico;
drop policy if exists "solicitudes_soporte_publico_update" on public.solicitudes_soporte_publico;
