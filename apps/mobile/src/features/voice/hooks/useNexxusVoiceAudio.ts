import { useCallback, useEffect, useRef, useState } from 'react';
import {
  initialize,
  playPCMData,
  tearDown,
  toggleRecording,
  useExpoTwoWayAudioEventListener,
  useIsRecording,
  useMicrophonePermissions,
} from '@speechmatics/expo-two-way-audio';
import { VoiceSessionError } from '../types/voice.types';
import { normalizarNivelAudio } from '../utils/audio.utils';

export type EstadoPermisoMicrofono = 'granted' | 'denied' | 'undetermined';

interface UseNexxusVoiceAudioResult {
  estadoPermiso: EstadoPermisoMicrofono;
  solicitarPermiso: () => Promise<boolean>;
  inicializado: boolean;
  errorInicializacion: VoiceSessionError | null;
  inicializarAudio: () => Promise<boolean>;
  grabando: boolean;
  iniciarGrabacion: () => void;
  detenerGrabacion: () => void;
  nivelEntrada: number;
  nivelSalida: number;
  reproducirAudio: (pcm: Uint8Array) => void;
  liberar: () => void;
}

export function useNexxusVoiceAudio(): UseNexxusVoiceAudioResult {
  const [permiso, solicitarPermisoNativo] = useMicrophonePermissions();
  const [inicializado, setInicializado] = useState(false);
  const [errorInicializacion, setErrorInicializacion] = useState<VoiceSessionError | null>(null);
  const [nivelEntrada, setNivelEntrada] = useState(0);
  const [nivelSalida, setNivelSalida] = useState(0);
  const grabando = useIsRecording();
  const liberadoRef = useRef(false);

  useExpoTwoWayAudioEventListener('onInputVolumeLevelData', (evento) => {
    setNivelEntrada(normalizarNivelAudio(evento.data));
  });

  useExpoTwoWayAudioEventListener('onOutputVolumeLevelData', (evento) => {
    setNivelSalida(normalizarNivelAudio(evento.data));
  });

  useEffect(() => {
    liberadoRef.current = false;
    return () => {
      liberadoRef.current = true;
      tearDown();
    };
  }, []);

  const solicitarPermiso = useCallback(async () => {
    const resultado = await solicitarPermisoNativo();
    return resultado.status === 'granted';
  }, [solicitarPermisoNativo]);

  const inicializarAudio = useCallback(async () => {
    try {
      await initialize();
      if (liberadoRef.current) return false;
      setInicializado(true);
      setErrorInicializacion(null);
      return true;
    } catch (error) {
      setErrorInicializacion({
        code: 'audio_init_failed',
        message: error instanceof Error ? error.message : 'No se pudo iniciar el audio',
      });
      return false;
    }
  }, []);

  const iniciarGrabacion = useCallback(() => {
    toggleRecording(true);
  }, []);

  const detenerGrabacion = useCallback(() => {
    toggleRecording(false);
  }, []);

  const reproducirAudio = useCallback((pcm: Uint8Array) => {
    playPCMData(pcm);
  }, []);

  const liberar = useCallback(() => {
    toggleRecording(false);
    tearDown();
    setInicializado(false);
  }, []);

  return {
    estadoPermiso: (permiso?.status ?? 'undetermined') as EstadoPermisoMicrofono,
    solicitarPermiso,
    inicializado,
    errorInicializacion,
    inicializarAudio,
    grabando,
    iniciarGrabacion,
    detenerGrabacion,
    nivelEntrada,
    nivelSalida,
    reproducirAudio,
    liberar,
  };
}
