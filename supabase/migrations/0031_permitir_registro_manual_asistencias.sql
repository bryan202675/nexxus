-- Los jefes y administradores pueden registrar asistencia manual para
-- colaboradores de su misma empresa; el empleado conserva la regla de
-- registrar únicamente su propio usuario_id.
alter policy "asistencias_insert" on public.asistencias
  with check (
    public.misma_empresa(empresa_id)
    and (usuario_id = (select auth.uid()) or public.es_jefe())
  );
