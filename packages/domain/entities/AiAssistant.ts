export type AiTool =
  | 'employee_summary'
  | 'employee_tasks'
  | 'employee_payroll'
  | 'employee_requests'
  | 'company_summary'
  | 'global_summary';

/**
 * Accion sensible sugerida por la IA (p.ej. aprobar/rechazar una solicitud o nomina) que NO se
 * ejecuta automaticamente -- a diferencia de notificaciones/tareas/eventos, requiere que un
 * humano la confirme explicitamente en el chat antes de ejecutarse. Ver ask-nexxus-ai (Edge
 * Function) -- la fuente real se re-consulta (solicitudes) o se actualiza via el mismo caso de
 * uso que ya usa el dashboard (nomina, useCases.admin.payroll.updateStatus) al confirmar; este
 * tipo solo transporta lo minimo para mostrar la tarjeta de confirmacion.
 */
export type SensitiveAiAction =
  | {
      id: string;
      tipo: 'aprobar_solicitud';
      sourceCollection: 'solicitudes_ausencia' | 'solicitudes_internas';
      itemId: string;
      titulo: string;
    }
  | {
      id: string;
      tipo: 'aprobar_nomina';
      sourceCollection: 'nominas';
      itemId: string;
      titulo: string;
      // A que estado mover la nomina ('revisado' | 'pagado').
      estadoDestino: string;
    };

export interface AiAssistantResponse {
  respuesta: string;
  tool?: AiTool;
  fuentes?: string[];
  accionesSensibles?: SensitiveAiAction[];
}
