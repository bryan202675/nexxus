import { supabase } from '@/infrastructure/supabase/supabaseClient';
import { SensitiveAiAction } from 'domain/entities/AiAssistant';

export interface TurnoDeVozHistorialEntrada {
  rol: 'usuario' | 'nexxus';
  texto: string;
}

export async function enviarTurnoDeVoz(
  audio: { data: string; mimeType: string },
  historial?: TurnoDeVozHistorialEntrada[],
) {
  const { data, error } = await supabase.functions.invoke('voice-turn', { body: { audio, history: historial } });
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
