/**
 * Documentacion Nexxus - packages/domain/entities/PrioritySignal.ts
 * Capa: dominio.
 * Proposito: Forma normalizada de una "senal" priorizable para el Centro Inteligente (home por rol).
 * Cualquier fuente (tareas, aprobaciones, asistencia, notificaciones) se mapea a este tipo antes de
 * mezclarse y ordenarse por urgencia via services/priorityEngine.ts.
 * Dependencias clave: ninguna (solo tipos).
 * Consideracion de mantenimiento: preservar la forma exacta, la consumen los 3 homes (empleado/jefe/admin).
 */

export type PrioritySignalCategory = 'tarea' | 'aprobacion' | 'asistencia' | 'notificacion';

/** Urgencia derivada de la fecha limite (o su ausencia), no del nivel de prioridad declarado. */
export type PriorityUrgency = 'vencida' | 'hoy' | 'proxima' | 'normal';

export interface PrioritySignal {
  id: string;
  category: PrioritySignalCategory;
  title: string;
  detail: string;
  urgency: PriorityUrgency;
  /** Mayor score = mas urgente. Combina urgencia por fecha + nivel de prioridad declarado. */
  score: number;
  dueDate?: string;
  route: string;
  routeParams?: Record<string, any>;
}
