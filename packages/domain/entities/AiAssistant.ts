export type AiTool =
  | 'employee_summary'
  | 'employee_tasks'
  | 'employee_payroll'
  | 'employee_requests'
  | 'company_summary'
  | 'global_summary';

export interface AiAssistantResponse {
  respuesta: string;
  tool: AiTool;
  fuentes: string[];
}
