import { useCallback, useState } from 'react';
import { File } from 'expo-file-system';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import * as Speech from 'expo-speech';
import { VoiceSessionError } from '../types/voice.types';

export type EstadoPermisoMicrofono = 'granted' | 'denied' | 'undetermined';
export interface VoiceAudioClip {
  data: string;
  mimeType: string;
}

// Referencia estable: pasar un objeto nuevo en cada render a useAudioRecorder hace que
// expo-audio recree el grabador nativo constantemente (se re-renderiza cada 150ms por
// el polling de nivel de audio), lo que termina liberando el objeto nativo mientras el
// resto del hook todavía lo referencia -> NativeSharedObjectNotFoundException.
const OPCIONES_GRABACION = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

interface UseNexxusVoiceAudioResult {
  estadoPermiso: EstadoPermisoMicrofono;
  solicitarPermiso: () => Promise<boolean>;
  errorInicializacion: VoiceSessionError | null;
  inicializarAudio: () => Promise<boolean>;
  grabando: boolean;
  iniciarGrabacion: () => Promise<void>;
  detenerGrabacion: () => Promise<void>;
  detenerYLeer: () => Promise<VoiceAudioClip | null>;
  nivelEntrada: number;
  hablar: (texto: string, alTerminar?: () => void) => void;
  interrumpirHabla: () => void;
  liberar: () => void;
}

export function useNexxusVoiceAudio(): UseNexxusVoiceAudioResult {
  const recorder = useAudioRecorder(OPCIONES_GRABACION);
  const recorderState = useAudioRecorderState(recorder, 150);
  const [estadoPermiso, setEstadoPermiso] = useState<EstadoPermisoMicrofono>('undetermined');
  const [errorInicializacion, setErrorInicializacion] = useState<VoiceSessionError | null>(null);
  const solicitarPermiso = useCallback(async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      const granted = permission.granted;
      setEstadoPermiso(granted ? 'granted' : 'denied');
      return granted;
    } catch {
      setEstadoPermiso('denied');
      return false;
    }
  }, []);

  const inicializarAudio = useCallback(async () => {
    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });
      setErrorInicializacion(null);
      return true;
    } catch (cause) {
      setErrorInicializacion({
        code: 'audio_init_failed',
        message: cause instanceof Error ? cause.message : 'No se pudo iniciar el micrófono.',
      });
      return false;
    }
  }, [recorder]);

  const iniciarGrabacion = useCallback(async () => {
    if (recorder.isRecording) return;
    await recorder.prepareToRecordAsync();
    recorder.record();
  }, [recorder]);
  const detenerGrabacion = useCallback(async () => {
    if (recorder.isRecording) await recorder.stop();
  }, [recorder]);
  const detenerYLeer = useCallback(async (): Promise<VoiceAudioClip | null> => {
    await detenerGrabacion();
    if (!recorder.uri) return null;
    return {
      data: await new File(recorder.uri).base64(),
      mimeType: 'audio/mp4',
    };
  }, [detenerGrabacion, recorder]);
  const hablar = useCallback((texto: string, alTerminar?: () => void) => {
    Speech.speak(texto, {
      language: 'es-SV',
      rate: 0.96,
      onDone: alTerminar,
      onStopped: alTerminar,
      onError: () => alTerminar?.(),
    });
  }, []);
  const interrumpirHabla = useCallback(() => {
    Speech.stop();
  }, []);
  const liberar = useCallback(() => {
    if (recorder.isRecording) void recorder.stop();
    Speech.stop();
  }, [recorder]);
  return {
    estadoPermiso,
    solicitarPermiso,
    errorInicializacion,
    inicializarAudio,
    grabando: recorderState.isRecording,
    iniciarGrabacion,
    detenerGrabacion,
    detenerYLeer,
    nivelEntrada: Math.max(0, Math.min(1, ((recorderState.metering ?? -60) + 60) / 60)),
    hablar,
    interrumpirHabla,
    liberar,
  };
}
