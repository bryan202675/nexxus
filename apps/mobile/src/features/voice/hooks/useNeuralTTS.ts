import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { supabase } from '@/infrastructure/supabase/supabaseClient';

interface UseNeuralTTSResult {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  available: boolean;
  // Devuelve true si logró reproducir, false si falló (para que el caller pueda usar un
  // respaldo, p.ej. la voz del sistema) -- antes tragaba el error y quedaba en silencio total.
  speak: (text: string, onDone?: () => void) => Promise<boolean>;
  stop: () => void;
}

const API_ENDPOINT = process.env.EXPO_PUBLIC_TTS_API_URL || (typeof window !== 'undefined' ? '/api/tts' : '');

export function useNeuralTTS(): UseNeuralTTSResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const fileRef = useRef<File | null>(null);
  const doneRef = useRef<(() => void) | undefined>(undefined);
  const requestIdRef = useRef(0);

  const clearPlayer = useCallback((notifyCompletion: boolean) => {
    const complete = doneRef.current;
    doneRef.current = undefined;
    playerRef.current?.pause();
    playerRef.current?.remove();
    playerRef.current = null;
    if (fileRef.current?.exists) fileRef.current.delete();
    fileRef.current = null;
    setIsLoading(false);
    setIsPlaying(false);
    if (notifyCompletion) complete?.();
  }, []);

  const stop = useCallback(() => {
    requestIdRef.current += 1;
    clearPlayer(true);
  }, [clearPlayer]);

  const speak = useCallback(async (text: string, onDone?: () => void): Promise<boolean> => {
    if (!API_ENDPOINT) {
      setError('La voz neuronal no está configurada en esta compilación.');
      return false;
    }
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    clearPlayer(false);
    setError(null);
    setIsLoading(true);
    doneRef.current = onDone;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Tu sesión expiró.');
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ text, voice: 'es-MX-DaliaNeural' }),
      });
      if (!response.ok) {
        const detalle = await response.text().catch(() => '');
        throw new Error(`voz neuronal respondió ${response.status}: ${detalle.slice(0, 200)}`);
      }
      if (requestId !== requestIdRef.current) return true;

      const file = new File(Paths.cache, `nexxus-voice-${Date.now()}.mp3`);
      file.write(new Uint8Array(await response.arrayBuffer()));
      if (requestId !== requestIdRef.current) {
        if (file.exists) file.delete();
        return true;
      }
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true, interruptionMode: 'duckOthers' });
      const player = createAudioPlayer(file.uri);
      playerRef.current = player;
      fileRef.current = file;
      player.addListener('playbackStatusUpdate', (status) => {
        if (!status.didJustFinish) return;
        const complete = doneRef.current;
        clearPlayer(false);
        complete?.();
      });
      setIsLoading(false);
      setIsPlaying(true);
      player.play();
      return true;
    } catch (cause) {
      if (__DEV__) console.log('[VOICE] neuralTts.speak() falló, se usará la voz del sistema como respaldo', cause);
      if (requestId !== requestIdRef.current) return false;
      clearPlayer(false);
      setError('No pudimos reproducir la voz de Nexxus.');
      // No se llama a onDone aquí: el caller (hablar()) hace el respaldo con la voz del
      // sistema y es ESE flujo el que finalmente llama a onDone al terminar de hablar.
      return false;
    }
  }, [clearPlayer]);

  useEffect(() => () => clearPlayer(false), [clearPlayer]);

  // Sin memoizar, este objeto es literal nuevo en cada render -- cualquier hook/efecto que lo
  // use en sus dependencias (p.ej. useNexxusVoiceAudio.liberar) se recrea en cada actualización
  // de estado, y efectos que dependan de ESO (como el que vigila "perfil"/"estado" en
  // VoiceChatScreen) se re-disparan decenas de veces por segundo durante la llamada.
  return useMemo(
    () => ({ isLoading, isPlaying, error, available: Boolean(API_ENDPOINT), speak, stop }),
    [isLoading, isPlaying, error, speak, stop],
  );
}
