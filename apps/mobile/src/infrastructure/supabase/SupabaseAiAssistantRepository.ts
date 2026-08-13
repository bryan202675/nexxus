import { supabase } from './supabaseClient';
import { IAiAssistantRepository } from 'domain/repositories/IAiAssistantRepository';
import { AiAssistantResponse } from 'domain/entities/AiAssistant';

export class SupabaseAiAssistantRepository implements IAiAssistantRepository {
  async ask(prompt: string, history?: { rol: 'ia' | 'usuario'; texto: string }[]): Promise<AiAssistantResponse> {
    const { data, error } = await supabase.functions.invoke('ask-nexxus-ai', { body: { prompt, history } });
    if (error) throw error;
    return data as AiAssistantResponse;
  }
}
