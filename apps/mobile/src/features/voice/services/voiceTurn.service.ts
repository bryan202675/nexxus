import { supabase } from '@/infrastructure/supabase/supabaseClient';
import { SensitiveAiAction } from 'domain/entities/AiAssistant';

export async function enviarTurnoDeVoz(audio: { data: string; mimeType: string }) {
  const { data, error } = await supabase.functions.invoke('voice-turn', { body: { audio } });
  if (error) {
    let mensaje = error.message || 'No pudimos procesar tu mensaje de voz.';
    try {
      if ((error as any).context && typeof (error as any).context.json === 'function') {
        const jsonError = await (error as any).context.json();
        if (jsonError?.error) mensaje = jsonError.error;
      }
    } catch {
      // Si el cuerpo del error no es JSON legible, se conserva el mensaje genérico.
    }
    throw new Error(mensaje);
  }
  return data as { transcripcion: string; respuesta: string; accionesSensibles?: SensitiveAiAction[] };
}
