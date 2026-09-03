-- Migración: optimizar asistencias, índices compuestos y RLS con InitPlan
-- Resuelve timeouts (canceling statement due to statement timeout / error 57014)
-- en empresas con alto volumen de marcaciones (ej. > 20,000 filas).

-- 1. Índices compuestos para tenant + fecha / fecha de creación
create index if not exists idx_asistencias_empresa_fecha on public.asistencias (empresa_id, fecha_jornada desc);
create index if not exists idx_asistencias_empresa_created on public.asistencias (empresa_id, created_at desc);
create index if not exists idx_asistencias_fecha_jornada on public.asistencias (fecha_jornada);

-- 2. Optimización de políticas RLS:
-- Envolver funciones auxiliares (empresa_actual, es_super_admin, es_jefe) en (select ...)
-- para que el optimizador de Postgres las evalúe como InitPlan una sola vez por consulta
-- en lugar de ejecutarlas por cada fila analizada.

drop policy if exists "asistencias_select" on public.asistencias;
create policy "asistencias_select" on public.asistencias for select
  using (
    empresa_id = (select public.empresa_actual())
    or (select public.es_super_admin())
    or usuario_id = (select auth.uid())
  );

drop policy if exists "asistencias_insert" on public.asistencias;
create policy "asistencias_insert" on public.asistencias for insert
  with check (
    empresa_id = (select public.empresa_actual())
    and usuario_id = (select auth.uid())
  );

drop policy if exists "asistencias_update" on public.asistencias;
create policy "asistencias_update" on public.asistencias for update
  using (
    empresa_id = (select public.empresa_actual())
    and ((select public.es_jefe()) or usuario_id = (select auth.uid()))
  );

drop policy if exists "asistencias_delete" on public.asistencias;
create policy "asistencias_delete" on public.asistencias for delete
  using (
    empresa_id = (select public.empresa_actual())
    and (select public.es_jefe())
  );
