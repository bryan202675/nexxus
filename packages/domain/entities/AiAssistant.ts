export type AiTool =
  | 'employee_summary'
  | 'employee_tasks'
  | 'employee_payroll'
  | 'employee_requests'
  | 'company_summary'
  | 'global_summary';

/**
 * Accion sensible sugerida por la IA (p.ej. aprobar/rechazar una solicitud) que NO se ejecuta
 * automaticamente -- a diferencia de notificaciones/tareas/eventos, requiere que un humano la
 * confirme explicitamente en el chat antes de ejecutarse. Ver ask-nexxus-ai (Edge Function) y
 * services/priorityEngine no aplica aqui: la fuente real (RequestReportItem) se re-consulta al
 * confirmar, este tipo solo transporta lo minimo para mostrar la tarjeta de confirmacion.
 */
export interface SensitiveAiAction {
  id: string;
  tipo: 'aprobar_solicitud';
  sourceCollection: 'solicitudes_ausencia' | 'solicitudes_internas';
  itemId: string;
  titulo: string;
}

export interface AiAssistantResponse {
  respuesta: string;
  tool?: AiTool;
  fuentes?: string[];
  accionesSensibles?: SensitiveAiAction[];
}
