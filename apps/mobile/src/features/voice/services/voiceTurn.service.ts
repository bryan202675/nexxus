import { supabase } from '@/infrastructure/supabase/supabaseClient';
export async function enviarTurnoDeVoz(audio: { data: string; mimeType: string }) { const { data, error } = await supabase.functions.invoke('voice-turn', { body: { audio } }); if (error) throw new Error(error.message || 'No pudimos procesar tu mensaje de voz.'); return data as { transcripcion: string; respuesta: string }; }
