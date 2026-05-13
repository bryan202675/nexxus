export interface InboxItem {
  id: string;
  userId: string;
  empresaId: string;
  origenRefId: string; // ID de tarea, solicitud, ticket, etc.
  tipo: 'tarea_vencida' | 'aprobacion' | 'mensaje' | 'ticket' | 'cambio_turno' | 'notificacion_critica';
  prioridad: 'urgente' | 'normal';
  estado: 'pendiente' | 'resuelto';
  titulo: string;
  mensaje: string;
  timestamp: string;
}
