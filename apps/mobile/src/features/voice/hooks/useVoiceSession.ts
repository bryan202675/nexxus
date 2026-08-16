import { useCallback, useEffect, useRef, useState } from 'react';
import { useNexxusVoiceAudio } from './useNexxusVoiceAudio';
import { enviarTurnoDeVoz } from '../services/voiceTurn.service';
import { VoiceSessionError, VoiceSessionState, VoiceTranscriptEntry } from '../types/voice.types';

const UMBRAL_VOZ = 0.18;
const SILENCIO_PARA_ENVIAR_MS = 1200;

export function useVoiceSession() {
  const audio = useNexxusVoiceAudio();
  const [estado, setEstado] = useState<VoiceSessionState>('idle');
  const [error, setError] = useState<VoiceSessionError | null>(null);
  const [muteado, setMuteado] = useState(false);
  const [transcripcion, setTranscripcion] = useState<VoiceTranscriptEntry[]>([]);
  const estadoRef = useRef<VoiceSessionState>('idle');
  const activoRef = useRef(false);
  const muteadoRef = useRef(false);
  const procesandoRef = useRef(false);
  const silencioDesdeRef = useRef<number | null>(null);
  const vozDetectadaRef = useRef(false);

  const cambiarEstado = useCallback((siguiente: VoiceSessionState) => {
    estadoRef.current = siguiente;
    setEstado(siguiente);
  }, []);

  const iniciarEscucha = useCallback(async () => {
    if (!activoRef.current || muteadoRef.current || procesandoRef.current) return;
    silencioDesdeRef.current = null;
    vozDetectadaRef.current = false;
    try {
      await audio.iniciarGrabacion();
    } catch {
      if (!activoRef.current) return;
      setError({ code: 'audio_init_failed', message: 'No pudimos iniciar el micrófono. Intenta de nuevo.' });
      cambiarEstado('error');
      return;
    }
    if (!activoRef.current || muteadoRef.current || procesandoRef.current) {
      await audio.detenerGrabacion();
      return;
    }
    cambiarEstado('listening');
  }, [audio.detenerGrabacion, audio.iniciarGrabacion, cambiarEstado]);

  const iniciarLlamada = useCallback(async () => {
    activoRef.current = true;
    procesandoRef.current = false;
    muteadoRef.current = false;
    setMuteado(false);
    setError(null);
    cambiarEstado('connecting');

    const granted = audio.estadoPermiso === 'granted' || await audio.solicitarPermiso();
    if (!granted) {
      activoRef.current = false;
      setError({
        code: 'microphone_permission_denied',
        message: 'Nexxus necesita acceso al micrófono para escucharte.',
      });
      cambiarEstado('error');
      return;
    }

    if (!await audio.inicializarAudio()) {
      activoRef.current = false;
      setError({
        code: 'audio_init_failed',
        message: 'No pudimos iniciar el micrófono. Intenta de nuevo.',
      });
      cambiarEstado('error');
      return;
    }

    await iniciarEscucha();
  }, [audio, cambiarEstado, iniciarEscucha]);

  const procesarTurno = useCallback(async () => {
    if (!activoRef.current || procesandoRef.current) return;
    procesandoRef.current = true;
    cambiarEstado('thinking');

    try {
      const clip = await audio.detenerYLeer();
      if (!clip || !vozDetectadaRef.current) {
        procesandoRef.current = false;
        await iniciarEscucha();
        return;
      }

      const turno = await enviarTurnoDeVoz(clip);
      if (!activoRef.current) return;

      const ahora = Date.now();
      setTranscripcion((previa) => [
        ...previa,
        { id: `${ahora}-u`, rol: 'usuario', texto: turno.transcripcion, final: true },
        { id: `${ahora}-n`, rol: 'nexxus', texto: turno.respuesta, final: true },
      ]);
      cambiarEstado('speaking');
      audio.hablar(turno.respuesta, () => {
        procesandoRef.current = false;
        if (activoRef.current) void iniciarEscucha();
      });
    } catch (cause) {
      procesandoRef.current = false;
      if (!activoRef.current) return;
      setError({
        code: 'connection_failed',
        message: cause instanceof Error ? cause.message : 'No pudimos procesar tu voz.',
      });
      cambiarEstado('error');
    }
  }, [audio, cambiarEstado, iniciarEscucha]);

  useEffect(() => {
    if (estado !== 'listening' || muteado || !audio.grabando) return;

    const ahora = Date.now();
    if (audio.nivelEntrada > UMBRAL_VOZ) {
      vozDetectadaRef.current = true;
      silencioDesdeRef.current = null;
      return;
    }
    if (!vozDetectadaRef.current) return;
    if (!silencioDesdeRef.current) silencioDesdeRef.current = ahora;

    if (ahora - silencioDesdeRef.current >= SILENCIO_PARA_ENVIAR_MS) {
      silencioDesdeRef.current = null;
      void procesarTurno();
    }
  }, [audio.grabando, audio.nivelEntrada, estado, muteado, procesarTurno]);

  const alternarMute = useCallback(() => {
    setMuteado((previo) => {
      const siguiente = !previo;
      muteadoRef.current = siguiente;
      silencioDesdeRef.current = null;
      if (siguiente && estadoRef.current === 'listening') {
        void audio.detenerGrabacion();
      } else if (!siguiente && estadoRef.current === 'listening') {
        void iniciarEscucha();
      }
      return siguiente;
    });
  }, [audio.detenerGrabacion, iniciarEscucha]);

  const finalizarLlamada = useCallback(() => {
    activoRef.current = false;
    procesandoRef.current = false;
    silencioDesdeRef.current = null;
    audio.liberar();
    cambiarEstado('ended');
  }, [audio.liberar, cambiarEstado]);

  useEffect(() => () => {
    activoRef.current = false;
    audio.liberar();
  }, [audio.liberar]);

  return {
    estado,
    error,
    muteado,
    nivelEntrada: audio.nivelEntrada,
    nivelSalida: estado === 'speaking' ? 0.7 : 0,
    transcripcion,
    iniciarLlamada,
    alternarMute,
    finalizarLlamada,
  };
}
