import { useCallback, useEffect, useState } from 'react';
import { File } from 'expo-file-system';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import * as Speech from 'expo-speech';
import { VoiceSessionError } from '../types/voice.types';

export type EstadoPermisoMicrofono = 'granted' | 'denied' | 'undetermined';
export interface VoiceAudioClip {
  data: string;
  mimeType: string;
}

// Referencia estable: pasar un objeto nuevo en cada render a useAudioRecorder hace que
// expo-audio recree el grabador nativo constantemente, lo que puede liberar el objeto
// nativo mientras el resto del hook todavía lo referencia.
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
  const [grabando, setGrabando] = useState(false);
  const [nivelEntrada, setNivelEntrada] = useState(0);
  const [estadoPermiso, setEstadoPermiso] = useState<EstadoPermisoMicrofono>('undetermined');
  const [errorInicializacion, setErrorInicializacion] = useState<VoiceSessionError | null>(null);

  // Polling propio (en vez de useAudioRecorderState) porque su intervalo interno llama
  // recorder.getStatus() sin try/catch: si el objeto nativo ya se liberó (p.ej. justo
  // después de recorder.stop()), ese tick lanza NativeSharedObjectNotFoundException fuera
  // de cualquier try/catch de React y tumba la pantalla entera vía el error boundary.
  useEffect(() => {
    const intervalo = setInterval(() => {
      try {
        const estado = recorder.getStatus();
        setGrabando(estado.isRecording);
        setNivelEntrada(Math.max(0, Math.min(1, ((estado.metering ?? -60) + 60) / 60)));
      } catch {
        // El objeto nativo no está disponible en este tick (p.ej. se está liberando); se ignora.
      }
    }, 150);
    return () => clearInterval(intervalo);
  }, [recorder]);

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

  // En iOS, `allowsRecording: true` pone la sesión de audio en categoría .playAndRecord,
  // que por defecto saca el sonido por el auricular de llamadas (no el altavoz) --
  // `shouldRouteThroughEarpiece` de expo-audio solo existe en Android. La forma real de
  // que suene por el altavoz en iOS es desactivar el modo de grabación mientras se habla.
  const activarModoEscucha = useCallback(async () => {
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    });
  }, []);

  const activarModoAltavoz = useCallback(async () => {
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    });
  }, []);

  const inicializarAudio = useCallback(async () => {
    try {
      await activarModoEscucha();
      setErrorInicializacion(null);
      return true;
    } catch (cause) {
      setErrorInicializacion({
        code: 'audio_init_failed',
        message: cause instanceof Error ? cause.message : 'No se pudo iniciar el micrófono.',
      });
      return false;
    }
  }, [activarModoEscucha]);

  const iniciarGrabacion = useCallback(async () => {
    try {
      await activarModoEscucha();
      if (recorder.isRecording) return;
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (cause) {
      throw new Error(cause instanceof Error ? cause.message : 'No se pudo iniciar el micrófono.');
    }
  }, [recorder, activarModoEscucha]);

  const detenerGrabacion = useCallback(async () => {
    try {
      if (recorder.isRecording) await recorder.stop();
    } catch {
      // Puede fallar si el objeto nativo ya se liberó; no hay nada que grabar en ese caso.
    }
  }, [recorder]);

  const detenerYLeer = useCallback(async (): Promise<VoiceAudioClip | null> => {
    await detenerGrabacion();
    try {
      if (!recorder.uri) return null;
      return {
        data: await new File(recorder.uri).base64(),
        mimeType: 'audio/mp4',
      };
    } catch {
      return null;
    }
  }, [detenerGrabacion, recorder]);

  const hablar = useCallback(async (texto: string, alTerminar?: () => void) => {
    try {
      await activarModoAltavoz();
    } catch {
      // Si falla el cambio de modo, igual intentamos hablar con la ruta de audio actual.
    }
    Speech.speak(texto, {
      language: 'es-SV',
      rate: 0.96,
      onDone: alTerminar,
      onStopped: alTerminar,
      onError: () => alTerminar?.(),
    });
  }, [activarModoAltavoz]);

  const interrumpirHabla = useCallback(() => {
    Speech.stop();
  }, []);

  const liberar = useCallback(() => {
    try {
      if (recorder.isRecording) void recorder.stop();
    } catch {
      // El objeto nativo puede ya estar liberado durante el desmontaje; no hay nada que hacer.
    }
    Speech.stop();
  }, [recorder]);

  return {
    estadoPermiso,
    solicitarPermiso,
    errorInicializacion,
    inicializarAudio,
    grabando,
    iniciarGrabacion,
    detenerGrabacion,
    detenerYLeer,
    nivelEntrada,
    hablar,
    interrumpirHabla,
    liberar,
  };
}
