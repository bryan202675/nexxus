import { AiAssistantResponse } from '../entities/AiAssistant';

export interface IAiAssistantRepository {
  ask(prompt: string, history?: { rol: 'ia' | 'usuario'; texto: string }[]): Promise<AiAssistantResponse>;
}
