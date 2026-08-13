-- La publicacion supabase_realtime estaba vacia (0 tablas) -- ningun canal de Realtime del
-- proyecto ha estado funcionando nunca, ni en apps/mobile (subscribeQuery en
-- infrastructure/supabase/realtime.ts) ni en apps/dashboard (subscribeTable en
-- services/adminRepository.ts). Ambos ya hacen .channel().on('postgres_changes', ...) para cada
-- una de estas tablas -- sin la tabla en esta publicacion, Postgres nunca emite el evento y el
-- listener se queda esperando en silencio (la UI solo se actualiza en el fetch inicial al montar,
-- de ahi que agregar un empleado no aparezca hasta recargar la pagina).
alter publication supabase_realtime add table
  ai_usage, ai_usage_daily, anuncios, asistencias, audit_logs, calendario_empresarial, cargos,
  chat_contextual, checkins, configuraciones_empresa, conversaciones, departamentos, documentos,
  empresas, feedbacks, inbox_unificado, incidencias, inventario_activos, mensajes, nominas,
  notificaciones, payments, planes, reportes, roles_personalizados, sedes, solicitudes_ausencia,
  solicitudes_internas, support_sessions, suscripciones, tareas, usuarios;
