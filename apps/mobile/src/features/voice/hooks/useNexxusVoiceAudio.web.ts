import { useCallback, useState } from 'react';
import { VoiceSessionError } from '../types/voice.types';

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

const ERROR_NO_SOPORTADO: VoiceSessionError = {
  code: 'audio_init_failed',
  message: 'Nexxus Voice solo está disponible en la app móvil (iOS/Android).',
};

export function useNexxusVoiceAudio(): UseNexxusVoiceAudioResult {
  const [errorInicializacion] = useState<VoiceSessionError>(ERROR_NO_SOPORTADO);

  const inicializarAudio = useCallback(async () => false, []);
  const solicitarPermiso = useCallback(async () => false, []);
  const sinOperacion = useCallback(() => {}, []);

  return {
    estadoPermiso: 'denied',
    solicitarPermiso,
    inicializado: false,
    errorInicializacion,
    inicializarAudio,
    grabando: false,
    iniciarGrabacion: sinOperacion,
    detenerGrabacion: sinOperacion,
    nivelEntrada: 0,
    nivelSalida: 0,
    reproducirAudio: sinOperacion,
    liberar: sinOperacion,
  };
}
