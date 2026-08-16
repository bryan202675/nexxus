import { useCallback, useEffect, useState } from 'react';
import { useNexxusVoiceAudio } from './useNexxusVoiceAudio';
import { VoiceSessionError, VoiceSessionState } from '../types/voice.types';
import { generarTonoPruebaPCM16 } from '../utils/audio.utils';

interface UseVoiceSessionResult {
  estado: VoiceSessionState;
  error: VoiceSessionError | null;
  muteado: boolean;
  nivelEntrada: number;
  nivelSalida: number;
  iniciarLlamada: () => Promise<void>;
  alternarMute: () => void;
  finalizarLlamada: () => void;
}

export function useVoiceSession(): UseVoiceSessionResult {
  const audio = useNexxusVoiceAudio();
  const [estado, setEstado] = useState<VoiceSessionState>('idle');
  const [error, setError] = useState<VoiceSessionError | null>(null);
  const [muteado, setMuteado] = useState(false);

  const iniciarLlamada = useCallback(async () => {
    setEstado('connecting');
    setError(null);
    setMuteado(false);

    const permisoConcedido =
      audio.estadoPermiso === 'granted' ? true : await audio.solicitarPermiso();

    if (!permisoConcedido) {
      setError({
        code: 'microphone_permission_denied',
        message: 'Nexxus necesita acceso al micrófono para escucharte.',
      });
      setEstado('error');
      return;
    }

    const inicializado = await audio.inicializarAudio();
    if (!inicializado) {
      setError(
        audio.errorInicializacion ?? {
          code: 'audio_init_failed',
          message: 'No pudimos iniciar el audio. Intenta de nuevo.',
        },
      );
      setEstado('error');
      return;
    }

    audio.iniciarGrabacion();
    audio.reproducirAudio(generarTonoPruebaPCM16(180, 16000, 880));
    setEstado('listening');
  }, [audio]);

  const alternarMute = useCallback(() => {
    setMuteado((muteadoPrevio) => {
      const siguiente = !muteadoPrevio;
      if (siguiente) audio.detenerGrabacion();
      else audio.iniciarGrabacion();
      return siguiente;
    });
  }, [audio]);

  const finalizarLlamada = useCallback(() => {
    audio.liberar();
    setEstado('ended');
  }, [audio]);

  useEffect(() => {
    if (estado !== 'error') return;
    audio.liberar();
  }, [estado, audio]);

  return {
    estado,
    error,
    muteado,
    nivelEntrada: audio.nivelEntrada,
    nivelSalida: audio.nivelSalida,
    iniciarLlamada,
    alternarMute,
    finalizarLlamada,
  };
}
