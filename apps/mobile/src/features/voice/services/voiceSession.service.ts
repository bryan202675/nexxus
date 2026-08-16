import { supabase } from '@/infrastructure/supabase/supabaseClient';

export interface VoiceSessionCredentials {
  token: string;
  expireTime: string;
  model: string;
  websocketUrl: string;
  context: { usuarioId: string; empresaId: string | null; rol: string };
}

export async function crearSesionDeVoz(): Promise<VoiceSessionCredentials> {
  const { data, error } = await supabase.functions.invoke('voice-session');
  if (error || !data?.token) throw new Error(error?.message || 'No se pudo iniciar la sesión de voz.');
  return data as VoiceSessionCredentials;
}
