/**
 * Fase 13: entidad de dominio para el motor de automatizaciones SI/ENTONCES.
 */

export type AutomationTriggerType = 'tarea_vencida' | 'solicitud_pendiente_tiempo' | 'checkin_faltante';

export type AutomationActionTarget = 'asignado' | 'creador' | 'admins';

export interface AutomationRuleConditions {
  // 'solicitud_pendiente_tiempo': horas en 'pendiente' antes de disparar. Default 48 si no viene.
  horasUmbral?: number;
  // 'checkin_faltante': hora del dia (0-23, UTC) a partir de la cual se considera faltante. Default 10.
  horaLimite?: number;
}

export interface AutomationRule {
  id: string;
  empresaId: string;
  nombre: string;
  descripcion?: string;
  triggerTipo: AutomationTriggerType;
  condiciones: AutomationRuleConditions;
  accionDestino: AutomationActionTarget;
  activa: boolean;
  creadoPor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRunResult {
  reglaId: string;
  nombre: string;
  evaluadas: number;
  ejecutadas: number;
}
