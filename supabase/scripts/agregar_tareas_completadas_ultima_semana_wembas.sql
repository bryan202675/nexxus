-- Tareas operativas ficticias completadas, distribuidas entre el 2 y el 9 de septiembre de 2026.
with empresa as (
  select id from public.empresas where codigo = 'WEM-9491'
), responsable as (
  select id
  from public.usuarios
  where empresa_id = (select id from empresa)
  order by created_at
  limit 1
), dias as (
  select offset_dia, (date '2026-09-09' - offset_dia)::date as dia
  from generate_series(0, 7) as offset_dia
), plantillas(orden, titulo_base, descripcion, prioridad) as (
  values
    (1, 'Validación de expedientes recibidos', 'Se verificaron campos obligatorios y respaldos antes de su archivo.', 'alta'),
    (2, 'Actualización de indicadores operativos', 'Se consolidaron los resultados del área para el seguimiento diario.', 'media'),
    (3, 'Conciliación de inventario asignado', 'Se contrastaron activos asignados, movimientos y existencias.', 'media'),
    (4, 'Seguimiento de solicitudes internas', 'Se documentaron avances y se comunicaron los siguientes pasos.', 'alta'),
    (5, 'Documentación de incidencias resueltas', 'Se registraron acciones aplicadas, evidencia y recomendaciones.', 'media'),
    (6, 'Revisión del plan de cobertura', 'Se confirmaron responsables y continuidad operativa del equipo.', 'baja')
), tareas_nuevas as (
  select
    d.offset_dia,
    d.dia,
    p.orden,
    p.titulo_base || ' · ' || to_char(d.dia, 'DD "de" TMMonth') as titulo,
    p.descripcion,
    p.prioridad
  from dias d
  cross join plantillas p
), empleados as (
  select id, row_number() over (order by created_at, id) as posicion
  from public.usuarios
  where empresa_id = (select id from empresa)
), total_empleados as (
  select count(*)::bigint as total from empleados
)
insert into public.tareas (
  empresa_id, titulo, descripcion, asignado_a, creado_por, estado, prioridad,
  fecha_limite, created_at, updated_at, datos
)
select
  empresa.id,
  t.titulo,
  t.descripcion,
  e.id,
  responsable.id,
  'completada',
  t.prioridad,
  (t.dia + time '17:00')::timestamptz,
  (t.dia + time '08:30')::timestamptz,
  (t.dia + time '16:15')::timestamptz,
  jsonb_build_object(
    'fecha_completada', (t.dia + time '16:15')::timestamptz,
    'resultado', 'Completada dentro del plazo operativo',
    'origen', 'historial_operativo_septiembre'
  )
from tareas_nuevas t
cross join empresa
cross join responsable
cross join total_empleados te
join empleados e on e.posicion = ((t.offset_dia * 6 + t.orden - 1) % te.total) + 1
where te.total > 0
  and not exists (
    select 1
    from public.tareas existente
    where existente.empresa_id = empresa.id
      and existente.titulo = t.titulo
      and existente.datos ->> 'fecha_completada' = (t.dia + time '16:15')::timestamptz::text
  );
