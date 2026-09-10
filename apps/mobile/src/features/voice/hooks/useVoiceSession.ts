import { useCallback, useEffect, useRef, useState } from 'react';
import { useNexxusVoiceAudio } from './useNexxusVoiceAudio';
import { enviarTurnoDeVoz } from '../services/voiceTurn.service';
import { VoiceSessionError, VoiceSessionState, VoiceTranscriptEntry } from '../types/voice.types';
import { useContextoUsuario } from '@/presentation/context/ContextoUsuario';
import { useCases } from '@/infrastructure/container';
import { SensitiveAiAction } from 'domain/entities/AiAssistant';
import { PayrollStatus } from 'domain/entities/Payroll';

import { createVoiceActivity, updateVoiceActivity } from '../services/voiceActivity';

function logVoz(...args: unknown[]) {
  if (__DEV__) console.log('[VOICE]', ...args);
}

// La sesión de audio nativa (expo-audio) a veces queda colgada tras varios hot-reloads en
// desarrollo -- una promesa de solicitarPermiso/inicializarAudio que nunca resuelve deja la
// llamada pegada en "conectando" para siempre. Con timeout, al menos falla con un error visible.
const TIMEOUT_INICIALIZACION_MS = 8000;
function conTimeout<T>(promesa: Promise<T>, etiqueta: string): Promise<T> {
  return Promise.race([
    promesa,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Tiempo de espera agotado: ${etiqueta}`)), TIMEOUT_INICIALIZACION_MS),
    ),
  ]);
}

export function useVoiceSession() {
  const audio = useNexxusVoiceAudio();
  const { perfil } = useContextoUsuario();
  const [estado, setEstado] = useState<VoiceSessionState>('idle');
  const [error, setError] = useState<VoiceSessionError | null>(null);
  const [muteado, setMuteado] = useState(false);
  const [transcripcion, setTranscripcion] = useState<VoiceTranscriptEntry[]>([]);
  const [accionesPendientes, setAccionesPendientes] = useState<SensitiveAiAction[]>([]);
  const accionesPendientesRef = useRef<SensitiveAiAction[]>([]);
  // Espejo de "transcripcion" en ref (no en las deps de procesarTurno, para no recrearlo en
  // cada turno) -- sin esto, cada llamada a voice-turn arrancaba sin memoria de la llamada:
  // Nexxus pedía el título, el usuario lo daba, y el siguiente turno no sabía que ya lo tenía
  // (cada turno era una petición nueva y aislada a Gemini), así que preguntaba todo de nuevo
  // en bucle. Ver enviarTurnoDeVoz(clip, historial).
  const transcripcionRef = useRef<VoiceTranscriptEntry[]>([]);
  const estadoRef = useRef<VoiceSessionState>('idle');
  const activoRef = useRef(false);
  const muteadoRef = useRef(false);
  const procesandoRef = useRef(false);
  const actividadRef = useRef(createVoiceActivity(Date.now()));

  const cambiarEstado = useCallback((siguiente: VoiceSessionState) => {
    estadoRef.current = siguiente;
    setEstado(siguiente);
    logVoz('estado ->', siguiente);
  }, []);

  const iniciarEscucha = useCallback(async () => {
    if (!activoRef.current || muteadoRef.current || procesandoRef.current) return;
    actividadRef.current = createVoiceActivity(Date.now());
    logVoz('volviendo a escuchar, iniciando grabación');
    try {
      // Mismo salvavidas que en iniciarLlamada: volver a activar el modo de grabación justo
      // después de haber hablado (que cambió el modo de audio a altavoz) es otro punto donde
      // expo-audio puede quedarse colgado sin lanzar error -- sin timeout, la llamada se queda
      // pegada en "hablando" para siempre porque nunca se llega a cambiarEstado('listening').
      await conTimeout(audio.iniciarGrabacion(), 'iniciarGrabacion');
      logVoz('grabación iniciada correctamente');
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
    actividadRef.current = createVoiceActivity(Date.now());
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
    accionesPendientesRef.current = [];
    setAccionesPendientes([]);
    transcripcionRef.current = [];
    setTranscripcion([]);
    cambiarEstado('connecting');

    try {
      logVoz('solicitando permiso de micrófono');
      const granted = audio.estadoPermiso === 'granted'
        || await conTimeout(audio.solicitarPermiso(), 'solicitarPermiso');
      logVoz('permiso resuelto:', granted);
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

      logVoz('inicializando audio');
      const inicializado = await conTimeout(audio.inicializarAudio(), 'inicializarAudio');
      logVoz('audio inicializado:', inicializado);
      if (!inicializado) {
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
    } catch (cause) {
      // Cubre el caso de que la sesión de audio nativa quede colgada (típico tras varios
      // hot-reloads en desarrollo): sin esto, la llamada se quedaba en "conectando" para
      // siempre sin ningún error visible ni log adicional.
      logVoz('iniciarLlamada: excepción o timeout', cause);
      activoRef.current = false;
      setError({
        code: 'audio_init_failed',
        message: 'No pudimos iniciar el audio. Cierra la app por completo y vuelve a abrirla.',
      });
      cambiarEstado('error');
    }
  }, [audio, cambiarEstado, iniciarEscucha]);

  const procesarTurno = useCallback(async () => {
    if (!activoRef.current || procesandoRef.current) return;
    procesandoRef.current = true;

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

      // Últimos turnos de ESTA llamada, para que Gemini recuerde lo ya dicho (p.ej. un título
      // que ya dio el usuario) en vez de tratar cada turno como una conversación nueva.
      const historialReciente = transcripcionRef.current.slice(-10).map((entrada) => ({
        rol: entrada.rol,
        texto: entrada.texto,
      }));
      const inicioSolicitud = Date.now();
      const turno = await enviarTurnoDeVoz(clip, historialReciente);
      logVoz('servidor respondió en ms', Date.now() - inicioSolicitud);

      if (!activoRef.current) return;

      const ahora = Date.now();
      const nuevasEntradas: VoiceTranscriptEntry[] = [
        { id: `${ahora}-u`, rol: 'usuario', texto: turno.transcripcion, final: true },
        { id: `${ahora}-n`, rol: 'nexxus', texto: turno.respuesta, final: true },
      ];
      transcripcionRef.current = [...transcripcionRef.current, ...nuevasEntradas];
      setTranscripcion((previa) => [...previa, ...nuevasEntradas]);
      if (turno.accionesSensibles?.length) {
        accionesPendientesRef.current = turno.accionesSensibles;
        setAccionesPendientes(turno.accionesSensibles);
      }
      // Speech.speak('') no siempre dispara onDone -- si por lo que sea llega vacía, no nos
      // quedamos congelados en 'speaking': se trata como turno terminado de inmediato.
      const textoAHablar = turno.respuesta?.trim();
      if (!textoAHablar) {
        logVoz('respuesta vacía, se omite el habla');
        procesandoRef.current = false;
        if (activoRef.current && accionesPendientesRef.current.length === 0) void iniciarEscucha();
        return;
      }
      cambiarEstado('speaking');
      void audio.hablar(textoAHablar, () => {
        logVoz('Nexxus terminó de hablar');
        procesandoRef.current = false;
        // Si quedó una acción sensible por confirmar, no se vuelve a escuchar sola: se
        // espera a que el usuario toque Aprobar/Rechazar en la tarjeta (ver resolverAccionPendiente).
        if (activoRef.current && accionesPendientesRef.current.length === 0) void iniciarEscucha();
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

    const detectarFin = () => {
      if (updateVoiceActivity(actividadRef.current, audio.nivelEntrada, Date.now())) {
        logVoz('fin de intervención detectado');
        void procesarTurno();
      }
    };
    detectarFin();
    // Silence can produce identical meter readings, with no React render.
    const timer = setInterval(detectarFin, 100);
    return () => clearInterval(timer);
  }, [audio.grabando, audio.nivelEntrada, estado, muteado, procesarTurno]);

  const alternarMute = useCallback(() => {
    setMuteado((previo) => {
      const siguiente = !previo;
      muteadoRef.current = siguiente;
      actividadRef.current = createVoiceActivity(Date.now());
      if (siguiente && estadoRef.current === 'listening') {
        void audio.detenerGrabacion();
      } else if (!siguiente && estadoRef.current === 'listening') {
        void iniciarEscucha();
      }
      return siguiente;
    });
  }, [audio.detenerGrabacion, iniciarEscucha]);

  const resolverAccionPendiente = useCallback(async (accion: SensitiveAiAction, resultado: 'aprobada' | 'rechazada') => {
    if (!perfil) return;
    try {
      if (accion.tipo === 'aprobar_nomina') {
        // Rechazar una nómina no tiene estado propio (solo pendiente/revisado/pagado): no
        // hacer nada la deja como estaba.
        if (resultado === 'aprobada' && accion.estadoDestino) {
          await useCases.admin.payroll.updateStatus(accion.itemId, accion.estadoDestino as PayrollStatus, {
            id: perfil.id,
            nombre: perfil.nombre,
          });
        }
        return;
      }
      const item = await useCases.admin.requestReports.getById(accion.sourceCollection, accion.itemId);
      if (!item || item.estado !== 'pendiente') throw new Error('Esta solicitud ya no está pendiente o no existe.');
      await useCases.leader.resolveApproval(item, resultado, { id: perfil.id, nombre: perfil.nombre, rol: perfil.rol });
    } catch (cause) {
      logVoz('error confirmando acción sensible', cause);
    } finally {
      const restantes = accionesPendientesRef.current.filter((a) => a.id !== accion.id);
      accionesPendientesRef.current = restantes;
      setAccionesPendientes(restantes);
      if (restantes.length === 0 && activoRef.current && estadoRef.current !== 'listening') {
        void iniciarEscucha();
      }
    }
  }, [perfil, iniciarEscucha]);

  const interrumpir = useCallback(() => {
    if (estadoRef.current !== 'speaking') return;
    audio.interrumpirHabla();
  }, [audio]);

  const finalizarLlamada = useCallback(() => {
    if (__DEV__) console.trace('[VOICE] llamada finalizada, ver quién la llamó');
    logVoz('llamada finalizada');
    activoRef.current = false;
    procesandoRef.current = false;
    actividadRef.current = createVoiceActivity(Date.now());

    accionesPendientesRef.current = [];
    setAccionesPendientes([]);
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
    accionesPendientes,
    resolverAccionPendiente,
    iniciarLlamada,
    alternarMute,
    interrumpir,
    finalizarLlamada,
  };
}
