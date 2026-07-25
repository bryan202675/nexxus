import { httpsCallable } from 'firebase/functions';
import { AiAssistantResponse, AiTool } from '@/domain/entities/AiAssistant';
import { IAiAssistantRepository } from '@/domain/repositories/IAiAssistantRepository';
import { functions } from './firebaseConfig';

const textValue = (value: unknown, fallback = '') => typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;

const normalizeTool = (value: unknown): AiTool => {
  const tool = textValue(value);
  if (['employee_summary', 'employee_tasks', 'employee_payroll', 'employee_requests', 'company_summary', 'global_summary'].includes(tool)) {
    return tool as AiTool;
  }
  return 'employee_summary';
};

export class FirebaseAiAssistantRepository implements IAiAssistantRepository {
  async ask(prompt: string, history?: { rol: 'ia' | 'usuario'; texto: string }[]): Promise<AiAssistantResponse> {
    const callable = httpsCallable<{ prompt: string } & { history?: { rol: 'ia' | 'usuario'; texto: string }[] }, Record<string, unknown>>(functions, 'askNexxusAI');
    const result = await callable({ prompt, history });
    const data = result.data || {};
    return {
      respuesta: textValue(data.respuesta, 'No pude generar una respuesta en este momento.'),
      tool: normalizeTool(data.tool),
      fuentes: Array.isArray(data.fuentes) ? data.fuentes.map(String).filter(Boolean) : [],
    };
  }
}
