import { useCallback, useEffect, useRef, useState } from 'react';
import { useNexxusVoiceAudio } from './useNexxusVoiceAudio';
import { enviarTurnoDeVoz } from '../services/voiceTurn.service';
import { VoiceSessionError, VoiceSessionState, VoiceTranscriptEntry } from '../types/voice.types';

// Nivel mínimo para considerar que el usuario "empezó a hablar" (entrada al estado de voz).
const UMBRAL_VOZ = 0.18;
// El "silencio" para cerrar el turno se mide relativo al pico de volumen de ESTA
// intervención, no contra un número fijo: el ruido ambiente/sensibilidad del mic varía
// mucho entre dispositivos, y un umbral absoluto (p.ej. 0.18) casi nunca se cruza hacia
// abajo en algunos teléfonos -- terminaba esperando siempre el salvavidas completo.
const FRACCION_SILENCIO = 0.4;
const SILENCIO_PARA_ENVIAR_MS = 700;
// Salvavidas: si por lo que sea nunca se detecta silencio relativo, no queremos quedarnos
// escuchando para siempre -- se cierra el turno igual después de este tiempo.
const MAX_ESCUCHA_MS = 6000;

function logVoz(...args: unknown[]) {
  if (__DEV__) console.log('[VOICE]', ...args);
}

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
  const escuchandoDesdeRef = useRef<number | null>(null);
  const ultimoLogNivelRef = useRef(0);
  const picoNivelRef = useRef(0);

  const cambiarEstado = useCallback((siguiente: VoiceSessionState) => {
    estadoRef.current = siguiente;
    setEstado(siguiente);
    logVoz('estado ->', siguiente);
  }, []);

  const iniciarEscucha = useCallback(async () => {
    if (!activoRef.current || muteadoRef.current || procesandoRef.current) return;
    silencioDesdeRef.current = null;
    vozDetectadaRef.current = false;
    picoNivelRef.current = 0;
    try {
      await audio.iniciarGrabacion();
    } catch (cause) {
      logVoz('error al iniciar micrófono', cause);
      if (!activoRef.current) return;
      setError({ code: 'audio_init_failed', message: 'No pudimos iniciar el micrófono. Intenta de nuevo.' });
      cambiarEstado('error');
      return;
    }
    if (!activoRef.current || muteadoRef.current || procesandoRef.current) {
      await audio.detenerGrabacion();
      return;
    }
    escuchandoDesdeRef.current = Date.now();
    logVoz('micrófono iniciado, escuchando');
    cambiarEstado('listening');
  }, [audio.detenerGrabacion, audio.iniciarGrabacion, cambiarEstado]);

  const iniciarLlamada = useCallback(async () => {
    logVoz('iniciando llamada');
    activoRef.current = true;
    procesandoRef.current = false;
    muteadoRef.current = false;
    setMuteado(false);
    setError(null);
    cambiarEstado('connecting');

    const granted = audio.estadoPermiso === 'granted' || await audio.solicitarPermiso();
    if (!granted) {
      logVoz('permiso de micrófono denegado');
      activoRef.current = false;
      setError({
        code: 'microphone_permission_denied',
        message: 'Nexxus necesita acceso al micrófono para escucharte.',
      });
      cambiarEstado('error');
      return;
    }

    if (!await audio.inicializarAudio()) {
      logVoz('fallo al inicializar audio');
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
    escuchandoDesdeRef.current = null;
    cambiarEstado('thinking');
    logVoz('turno cerrado, transcribiendo y consultando a Nexxus');

    try {
      const clip = await audio.detenerYLeer();
      if (!clip) {
        logVoz('sin audio grabado, volviendo a escuchar');
        procesandoRef.current = false;
        await iniciarEscucha();
        return;
      }

      const turno = await enviarTurnoDeVoz(clip);
      logVoz('respuesta recibida', turno.transcripcion ? `"${turno.transcripcion}"` : '(sin transcripción)');
      if (!activoRef.current) return;

      const ahora = Date.now();
      setTranscripcion((previa) => [
        ...previa,
        { id: `${ahora}-u`, rol: 'usuario', texto: turno.transcripcion, final: true },
        { id: `${ahora}-n`, rol: 'nexxus', texto: turno.respuesta, final: true },
      ]);
      cambiarEstado('speaking');
      void audio.hablar(turno.respuesta, () => {
        logVoz('Nexxus terminó de hablar');
        procesandoRef.current = false;
        if (activoRef.current) void iniciarEscucha();
      });
    } catch (cause) {
      logVoz('error procesando el turno', cause);
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
    if (ahora - ultimoLogNivelRef.current > 2000) {
      ultimoLogNivelRef.current = ahora;
      logVoz('nivel actual', audio.nivelEntrada.toFixed(3), '(umbral', UMBRAL_VOZ, ')');
    }
    if (escuchandoDesdeRef.current && ahora - escuchandoDesdeRef.current >= MAX_ESCUCHA_MS) {
      logVoz('tiempo máximo de escucha alcanzado, cerrando turno de todas formas');
      silencioDesdeRef.current = null;
      void procesarTurno();
      return;
    }

    if (audio.nivelEntrada > UMBRAL_VOZ) {
      if (!vozDetectadaRef.current) logVoz('voz detectada, nivel', audio.nivelEntrada.toFixed(2));
      vozDetectadaRef.current = true;
      picoNivelRef.current = Math.max(picoNivelRef.current, audio.nivelEntrada);
    }
    if (!vozDetectadaRef.current) return;

    // "Silencio" = el nivel bajó a una fracción del pico de esta intervención, no un
    // número absoluto -- así se adapta a qué tan fuerte habla cada quien en cada ambiente.
    const umbralSilencioRelativo = picoNivelRef.current * FRACCION_SILENCIO;
    if (audio.nivelEntrada > umbralSilencioRelativo) {
      silencioDesdeRef.current = null;
      return;
    }
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

  const interrumpir = useCallback(() => {
    if (estadoRef.current !== 'speaking') return;
    audio.interrumpirHabla();
  }, [audio]);

  const finalizarLlamada = useCallback(() => {
    logVoz('llamada finalizada');
    activoRef.current = false;
    procesandoRef.current = false;
    silencioDesdeRef.current = null;
    escuchandoDesdeRef.current = null;
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
    interrumpir,
    finalizarLlamada,
  };
}
