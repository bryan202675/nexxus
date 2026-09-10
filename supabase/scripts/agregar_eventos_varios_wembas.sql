-- Agenda operativa ficticia para septiembre de 2026: complementa las reuniones existentes.
with empresa as (
  select id from public.empresas where codigo = 'WEM-9491'
), participantes as (
  select
    coalesce(jsonb_agg(id), '[]'::jsonb) as ids,
    coalesce(jsonb_agg(nombre), '[]'::jsonb) as nombres
  from (
    select id, nombre
    from public.usuarios
    where empresa_id = (select id from empresa)
    order by created_at
    limit 4
  ) seleccionados
), nuevos(titulo, descripcion, fecha_inicio, fecha_fin, tipo, ubicacion) as (
  values
    ('Taller de ciberseguridad: prevención de phishing', 'Sesión práctica para identificar correos maliciosos y proteger información corporativa.', '2026-09-02 09:00:00-06'::timestamptz, '2026-09-02 11:00:00-06'::timestamptz, 'capacitacion', 'Sala de formación San Salvador'),
    ('Clínica de Excel para reportes operativos', 'Ejercicios aplicados para consolidar indicadores mensuales.', '2026-09-03 14:00:00-06'::timestamptz, '2026-09-03 16:00:00-06'::timestamptz, 'capacitacion', 'Aula virtual Nexxus'),
    ('Ausencia programada: equipo de Operaciones', 'Cobertura interna coordinada para personal con permiso aprobado.', '2026-09-04 08:00:00-06'::timestamptz, '2026-09-04 17:00:00-06'::timestamptz, 'vacaciones', 'Sede San Salvador'),
    ('All-hands: resultados de agosto', 'Presentación de resultados, prioridades de septiembre y reconocimientos.', '2026-09-05 10:00:00-06'::timestamptz, '2026-09-05 11:30:00-06'::timestamptz, 'corporativo', 'Auditorio principal'),
    ('Cierre de novedades de nómina', 'Fecha límite para validar incidencias, horas extra y permisos del período.', '2026-09-07 15:00:00-06'::timestamptz, '2026-09-07 16:00:00-06'::timestamptz, 'recordatorio', 'Portal de nómina'),
    ('Turno especial: soporte de cierre', 'Guardia operativa para acompañar el cierre semanal.', '2026-09-07 17:00:00-06'::timestamptz, '2026-09-07 21:00:00-06'::timestamptz, 'turno', 'Centro de soporte'),
    ('Inducción de seguridad y evacuación', 'Actualización de protocolos para colaboradores de nuevo ingreso.', '2026-09-09 09:30:00-06'::timestamptz, '2026-09-09 11:00:00-06'::timestamptz, 'capacitacion', 'Sala de formación San Salvador'),
    ('Jornada de bienestar: pausas activas', 'Espacio guiado de ergonomía, movilidad y autocuidado laboral.', '2026-09-10 15:00:00-06'::timestamptz, '2026-09-10 16:00:00-06'::timestamptz, 'corporativo', 'Terraza sede central'),
    ('Ausencia programada: cita médica', 'Bloque de cobertura planificada para ausencias autorizadas.', '2026-09-11 08:00:00-06'::timestamptz, '2026-09-11 12:00:00-06'::timestamptz, 'vacaciones', 'Sede San Salvador'),
    ('Recordatorio: entrega de comprobantes', 'Último día para entregar comprobantes de gastos y viáticos.', '2026-09-11 16:00:00-06'::timestamptz, '2026-09-11 16:30:00-06'::timestamptz, 'recordatorio', 'Administración'),
    ('Taller de atención al cliente', 'Prácticas de comunicación clara y manejo de casos complejos.', '2026-09-14 09:00:00-06'::timestamptz, '2026-09-14 11:30:00-06'::timestamptz, 'capacitacion', 'Aula virtual Nexxus'),
    ('Comité de seguridad y salud ocupacional', 'Revisión mensual de hallazgos preventivos y acciones correctivas.', '2026-09-15 10:00:00-06'::timestamptz, '2026-09-15 11:00:00-06'::timestamptz, 'corporativo', 'Sala de juntas'),
    ('Turno especial: inventario de bodega', 'Cobertura para conteo físico y actualización de activos.', '2026-09-16 17:30:00-06'::timestamptz, '2026-09-16 20:30:00-06'::timestamptz, 'turno', 'Bodega central'),
    ('Recordatorio: evaluación de desempeño', 'Inicio del período de autoevaluaciones y retroalimentación de líderes.', '2026-09-17 08:30:00-06'::timestamptz, '2026-09-17 09:00:00-06'::timestamptz, 'recordatorio', 'Portal de talento'),
    ('Vacaciones programadas: cobertura comercial', 'Plan de atención y reemplazos para el equipo comercial.', '2026-09-18 08:00:00-06'::timestamptz, '2026-09-18 17:00:00-06'::timestamptz, 'vacaciones', 'Sede Santa Tecla'),
    ('Capacitación: protección de datos personales', 'Refuerzo de manejo responsable de información de clientes y colaboradores.', '2026-09-21 14:00:00-06'::timestamptz, '2026-09-21 16:00:00-06'::timestamptz, 'capacitacion', 'Aula virtual Nexxus'),
    ('Feria interna de beneficios', 'Espacio informativo sobre prestaciones, convenios y programas de bienestar.', '2026-09-22 10:00:00-06'::timestamptz, '2026-09-22 13:00:00-06'::timestamptz, 'corporativo', 'Lobby sede central'),
    ('Cierre de solicitudes de compra', 'Validación final de requerimientos para abastecimiento de octubre.', '2026-09-23 15:30:00-06'::timestamptz, '2026-09-23 16:00:00-06'::timestamptz, 'recordatorio', 'Compras'),
    ('Turno especial: mantenimiento preventivo', 'Ventana de acompañamiento durante mantenimiento de estaciones de trabajo.', '2026-09-24 18:00:00-06'::timestamptz, '2026-09-24 21:00:00-06'::timestamptz, 'turno', 'Sede San Salvador'),
    ('Ausencia programada: vacaciones de personal', 'Seguimiento de cobertura para vacaciones aprobadas del mes.', '2026-09-25 08:00:00-06'::timestamptz, '2026-09-25 17:00:00-06'::timestamptz, 'vacaciones', 'Sedes operativas'),
    ('Foro de innovación operativa', 'Intercambio de propuestas para mejorar procesos y experiencia del colaborador.', '2026-09-28 10:00:00-06'::timestamptz, '2026-09-28 11:30:00-06'::timestamptz, 'corporativo', 'Auditorio principal'),
    ('Capacitación: uso responsable de IA', 'Guía práctica para utilizar herramientas de IA en tareas administrativas.', '2026-09-29 14:00:00-06'::timestamptz, '2026-09-29 16:00:00-06'::timestamptz, 'capacitacion', 'Aula virtual Nexxus'),
    ('Cierre mensual de indicadores', 'Consolidación de métricas comerciales, operativas y de personas.', '2026-09-30 15:00:00-06'::timestamptz, '2026-09-30 16:30:00-06'::timestamptz, 'recordatorio', 'Sala de juntas')
)
insert into public.calendario_empresarial (
  empresa_id, titulo, descripcion, fecha_inicio, fecha_fin, tipo, datos
)
select
  empresa.id, n.titulo, n.descripcion, n.fecha_inicio, n.fecha_fin, n.tipo,
  jsonb_build_object(
    'ubicacion', n.ubicacion,
    'empleadoIds', participantes.ids,
    'empleadoNombres', participantes.nombres,
    'origen', 'agenda_operativa_septiembre'
  )
from nuevos n
cross join empresa
cross join participantes
where not exists (
  select 1
  from public.calendario_empresarial e
  where e.empresa_id = empresa.id
    and e.titulo = n.titulo
    and e.fecha_inicio = n.fecha_inicio
);
