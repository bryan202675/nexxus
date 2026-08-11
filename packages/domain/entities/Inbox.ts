/**
 * Documentacion Nexxus - apps/mobile/src/domain/entities/Inbox.ts
 * Capa: dominio.
 * Proposito: Entidad de dominio. Define la estructura de datos principal que usa Nexxus sin acoplarla a Supabase o React.
 * Dependencias clave: imports superiores y contratos tipados del propio modulo.
 * Consideracion de mantenimiento: preservar firmas publicas, rutas de navegacion y lecturas/escrituras de datos al extender este archivo.
 */

export interface InboxItem {
  id: string;
  userId: string;
  empresaId: string;
  origenRefId: string; // ID de tarea, solicitud, ticket, etc.
  tipo: 'tarea_vencida' | 'aprobacion' | 'mensaje' | 'ticket' | 'cambio_turno' | 'notificacion_critica' | 'documento';
  prioridad: 'urgente' | 'normal';
  estado: 'pendiente' | 'resuelto';
  titulo: string;
  mensaje: string;
  timestamp: string;
}
