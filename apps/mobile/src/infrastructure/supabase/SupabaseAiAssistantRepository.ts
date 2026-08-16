import { supabase } from './supabaseClient';
import { IAiAssistantRepository } from 'domain/repositories/IAiAssistantRepository';
import { AiAssistantResponse } from 'domain/entities/AiAssistant';

export class SupabaseAiAssistantRepository implements IAiAssistantRepository {
  async ask(prompt: string, history?: { rol: 'ia' | 'usuario'; texto: string }[]): Promise<AiAssistantResponse> {
    const { data, error } = await supabase.functions.invoke('ask-nexxus-ai', { body: { prompt, history } });
    if (error) {
      let mensajeError = error.message || 'Error en asistente IA';
      try {
        if ((error as any).context && typeof (error as any).context.json === 'function') {
          const jsonError = await (error as any).context.json();
          if (jsonError?.error) mensajeError = jsonError.error;
        }
      } catch {}
      const err = new Error(mensajeError);
      (err as any).code = (error as any).code || 'functions_error';
      throw err;
    }
    return data as AiAssistantResponse;
  }
}
