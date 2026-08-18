import { useCallback, useEffect, useRef, useState } from "react";
import {
  MdCallEnd,
  MdMic,
  MdMicOff,
  MdRefresh,
  MdKeyboard,
  MdClose,
  MdKeyboardArrowDown,
} from "react-icons/md";
import { FiCheck, FiX } from "react-icons/fi";

import { supabase } from "supabaseClient/supabaseConfig";
import { useTheme } from "context/ThemeContext";
import { useAuth } from "context/AuthContext";

type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "ended" | "error";

interface TranscriptEntry {
  id: string;
  role: "user" | "nexxus";
  text: string;
}

interface SensitiveAction {
  id: string;
  tipo?: "aprobar_solicitud" | "aprobar_nomina";
  sourceCollection: "solicitudes_ausencia" | "solicitudes_internas" | "nominas";
  itemId: string;
  titulo: string;
  // Solo para tipo "aprobar_nomina": a qué estado mover la nómina ('revisado' | 'pagado').
  estadoDestino?: string;
}

interface VoiceTurnResponse {
  transcripcion: string;
  respuesta: string;
  accionesSensibles?: SensitiveAction[];
}

const MASCOTA_URL = "/nexxusIA.png";

const STATUS: Record<VoiceState, { title: string; subtitle: string }> = {
  idle: { title: "Nexxus está listo", subtitle: "Pulsa para iniciar la llamada" },
  connecting: { title: "Conectando...", subtitle: "Estableciendo canal de audio seguro" },
  listening: { title: "Nexxus está escuchando", subtitle: "Habla de forma natural" },
  thinking: { title: "Nexxus está pensando...", subtitle: "Analizando tu consulta" },
  speaking: { title: "Nexxus está hablando", subtitle: "Puedes interrumpirme cuando quieras" },
  ended: { title: "Llamada finalizada", subtitle: "Sesión concluida" },
  error: { title: "Algo salió mal", subtitle: "Intenta iniciar la llamada de nuevo" },
};

function audioBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No pudimos leer el audio."));
    reader.onloadend = () => resolve(String(reader.result).split(",")[1] || "");
    reader.readAsDataURL(blob);
  });
}

export default function VoiceAiPanel({ onClose }: { onClose: () => void }) {
  const { dark } = useTheme();
  const { user, perfil } = useAuth();
  const [state, setState] = useState<VoiceState>("idle");
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [level, setLevel] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [actions, setActions] = useState<SensitiveAction[]>([]);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const activeRef = useRef(false);
  const finishingRef = useRef(false);
  const mutedRef = useRef(false);
  const stateRef = useRef<VoiceState>("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<number | null>(null);
  const smoothedLevelRef = useRef(0);

  // Mantener sincronizado el ref de estado para la animación continua
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const release = useCallback(() => {
    activeRef.current = false;
    finishingRef.current = true;
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
    // Safari puede conservar la locución actual tras cancel(); pause/resume fuerza a vaciarla.
    window.speechSynthesis.pause();
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    void contextRef.current?.close();
    recorderRef.current = null;
    streamRef.current = null;
    contextRef.current = null;
    analyserRef.current = null;
    smoothedLevelRef.current = 0;
    setLevel(0);
  }, []);

  const speak = useCallback((text: string, onEnd: () => void) => {
    if (!("speechSynthesis" in window)) {
      onEnd();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 1.05;
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    window.speechSynthesis.speak(utterance);
  }, []);

  const beginListening = useCallback(() => {
    if (!activeRef.current || finishingRef.current || mutedRef.current || !streamRef.current) return;
    const preferredMimeType = "audio/webm;codecs=opus";
    const recorder = MediaRecorder.isTypeSupported(preferredMimeType)
      ? new MediaRecorder(streamRef.current, { mimeType: preferredMimeType })
      : new MediaRecorder(streamRef.current);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    recorder.onstop = async () => {
      if (!activeRef.current || finishingRef.current || mutedRef.current) return;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      if (!blob.size) return beginListening();
      setState("thinking");
      try {
        const data = await audioBase64(blob);
        // Últimos turnos de ESTA llamada, para que el backend recuerde lo ya dicho (p.ej. un
        // título que ya dio el usuario) en vez de tratar cada turno como una llamada nueva --
        // sin esto entra en el mismo bucle de "pedir lo mismo otra vez" que ya se arregló en mobile.
        const history = transcriptRef.current.slice(-10).map((entry) => ({
          rol: entry.role === "user" ? "usuario" : "nexxus",
          texto: entry.text,
        }));
        const { data: response, error: invokeError } = await supabase.functions.invoke("voice-turn", {
          body: { audio: { data, mimeType: blob.type }, history },
        });
        if (invokeError) throw new Error(invokeError.message || "No pudimos procesar tu voz.");
        const turn = response as VoiceTurnResponse;
        if (!activeRef.current || finishingRef.current) return;
        setTranscript((previous) => {
          const next = [
            ...previous,
            { id: `${Date.now()}-user`, role: "user" as const, text: turn.transcripcion },
            { id: `${Date.now()}-nexxus`, role: "nexxus" as const, text: turn.respuesta },
          ];
          transcriptRef.current = next;
          return next;
        });
        setActions(turn.accionesSensibles || []);
        setState("speaking");
        speak(turn.respuesta, () => {
          if (activeRef.current && !finishingRef.current && !turn.accionesSensibles?.length) beginListening();
        });
      } catch (cause) {
        if (!activeRef.current || finishingRef.current) return;
        setError(cause instanceof Error ? cause.message : "No pudimos procesar tu voz.");
        setState("error");
      }
    };
    recorderRef.current = recorder;
    recorder.start();
    setState("listening");
    stopTimerRef.current = window.setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, 6000);
  }, [speak]);

  const start = useCallback(async () => {
    release();
    finishingRef.current = false;
    setError("");
    setActions([]);
    setState("connecting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeRef.current = true;
      streamRef.current = stream;
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      contextRef.current = audioContext;
      analyserRef.current = analyser;
      const samples = new Uint8Array(analyser.frequencyBinCount);

      let stepTime = 0;

      const renderLoop = () => {
        stepTime += 0.035;
        let targetLevel = 0;
        const currentSt = stateRef.current;

        if (currentSt === "listening" && analyserRef.current && !mutedRef.current) {
          analyserRef.current.getByteFrequencyData(samples);
          // Rango de voz humana suave
          let sum = 0;
          const startBin = 2;
          const endBin = Math.min(32, samples.length);
          for (let i = startBin; i < endBin; i++) {
            sum += samples[i];
          }
          const avg = sum / (endBin - startBin);
          // Escalado suave amortiguado
          const normalized = Math.max(0, (avg - 14) / 110);
          targetLevel = Math.min(0.65, Math.pow(normalized, 0.85) * 0.75);
        } else if (currentSt === "speaking") {
          // Respiración vocal armónica suave para Nexxus
          const wave1 = (Math.sin(stepTime * 2.4) + 1) * 0.18;
          const wave2 = (Math.sin(stepTime * 4.6) + 1) * 0.12;
          targetLevel = Math.min(0.55, 0.1 + wave1 + wave2);
        } else if (currentSt === "thinking") {
          // Pulso zen sutil mientras procesa
          targetLevel = 0.08 + (Math.sin(stepTime * 1.8) + 1) * 0.06;
        } else {
          // Estado de reposo sutil
          targetLevel = (Math.sin(stepTime * 1.0) + 1) * 0.03;
        }

        // Lerp amortiguado para movimiento ultrasuave y orgánico
        smoothedLevelRef.current = smoothedLevelRef.current * 0.86 + targetLevel * 0.14;
        setLevel(smoothedLevelRef.current);

        animationRef.current = window.requestAnimationFrame(renderLoop);
      };

      renderLoop();
      beginListening();
    } catch {
      setError("Nexxus necesita acceso al micrófono para escucharte.");
      setState("error");
    }
  }, [beginListening, release]);

  // Auto-iniciar al abrir
  useEffect(() => {
    start();
    return release;
  }, [start, release]);

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next && recorderRef.current?.state === "recording") recorderRef.current.stop();
    if (!next) beginListening();
  };

  const resolveAction = async (action: SensitiveAction, status: "aprobada" | "rechazada") => {
    // Nómina usa su propio ciclo de estados (pendiente/revisado/pagado), no "aprobada"/"rechazada":
    // escribir esos valores en nominas.estado corrompía el registro. Rechazar una nómina no tiene
    // estado propio (solo pendiente/revisado/pagado), así que no hacer nada la deja como estaba,
    // igual que en la app móvil (ver useVoiceSession.resolverAccionPendiente).
    if (action.sourceCollection === "nominas") {
      if (status === "aprobada" && action.estadoDestino) {
        const now = new Date().toISOString();
        const { data: nomina, error: fetchError } = await supabase
          .from("nominas")
          .select("*")
          .eq("id", action.itemId)
          .maybeSingle();
        if (fetchError || !nomina) {
          setError("No pudimos actualizar la nómina. Intenta de nuevo.");
          return;
        }
        const { error: updateError } = await supabase
          .from("nominas")
          .update({
            estado: action.estadoDestino,
            aprobado_por: user?.id,
            aprobado_por_nombre: perfil?.nombre || user?.email || "Administrador",
            fecha_aprobacion: now,
            updated_at: now,
          })
          .eq("id", action.itemId);
        if (updateError) {
          setError("No pudimos actualizar la nómina. Intenta de nuevo.");
          return;
        }
        // Espejo en "payments" (lo único que lee la app del empleado): sin esto se queda
        // congelado en "pendiente" aunque la nómina quede marcada como pagada por voz.
        const ESTADO_PAYMENT: Record<string, string> = { pendiente: "pendiente", revisado: "procesando", pagado: "confirmado" };
        await supabase
          .from("payments")
          .update({ estado: ESTADO_PAYMENT[action.estadoDestino] || "pendiente" })
          .eq("usuario_id", nomina.usuario_id)
          .eq("empresa_id", nomina.empresa_id)
          .contains("datos", { periodo: nomina.periodo });
        if (action.estadoDestino === "pagado" && nomina.usuario_id) {
          await supabase.from("notificaciones").insert({
            usuario_id: nomina.usuario_id,
            empresa_id: nomina.empresa_id,
            titulo: "Pago de nómina realizado",
            cuerpo: `Se confirmó el pago de tu nómina del período ${nomina.periodo}.`,
            tipo: "info",
          });
        }
      }
    } else {
      const { error: updateError } = await supabase
        .from(action.sourceCollection)
        .update({ estado: status, resolved_at: new Date().toISOString() })
        .eq("id", action.itemId)
        .eq("estado", "pendiente");
      if (updateError) {
        setError("No pudimos actualizar la solicitud. Intenta de nuevo.");
        return;
      }
    }
    setActions((previous) => previous.filter((item) => item.id !== action.id));
    if (activeRef.current && actions.length === 1) beginListening();
  };

  const status = STATUS[state];
  const active = state === "listening" || state === "thinking" || state === "speaking";
  const auraColor =
    state === "error"
      ? "#EF4444"
      : state === "speaking"
      ? (dark ? "#60A5FA" : "#2563EB")
      : (dark ? "#818CF8" : "#6366F1");

  return (
    <section className="relative isolate flex min-h-[76vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-gray-200/80 bg-white/95 px-5 py-6 shadow-2xl backdrop-blur-2xl transition-all duration-300 dark:border-white/[0.08] dark:bg-[#0B0C16]/95 dark:shadow-black/70 sm:px-8">
      {/* Fondo con Aura Radial Adaptable a Modo Claro y Oscuro */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 transition-all duration-500"
        style={{
          background: dark
            ? "radial-gradient(circle at 50% 35%, rgba(124, 58, 237, 0.16), transparent 45%), radial-gradient(circle at 70% 70%, rgba(59, 130, 246, 0.12), transparent 45%)"
            : "radial-gradient(circle at 50% 35%, rgba(59, 130, 246, 0.10), transparent 45%), radial-gradient(circle at 70% 70%, rgba(147, 197, 253, 0.15), transparent 45%)",
        }}
      />

      {/* Header Superior: Botón Cerrar y Título NEXXUS IA */}
      <div className="flex items-center justify-between pb-2">
        <button
          type="button"
          onClick={() => {
            release();
            setState("ended");
            onClose();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200/80 bg-white/80 text-gray-700 shadow-sm transition hover:bg-gray-100 hover:scale-105 active:scale-95 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          title="Minimizar o cerrar"
          aria-label="Cerrar llamada"
        >
          <MdKeyboardArrowDown className="h-6 w-6" />
        </button>

        <span className="text-[11px] font-extrabold tracking-[0.24em] text-gray-400 dark:text-white/50">
          NEXXUS IA
        </span>

        <div className="w-9" />
      </div>

      {/* Centro: Mascota con Halos Suaves y Amortiguados */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4">
        <button
          type="button"
          aria-label={state === "idle" ? "Iniciar llamada con Nexxus" : "Interrumpir a Nexxus"}
          disabled={state !== "idle" && state !== "speaking"}
          onClick={() => (state === "idle" ? void start() : window.speechSynthesis.cancel())}
          className="group relative grid h-60 w-60 place-items-center rounded-full transition-transform disabled:cursor-default select-none"
        >
          {/* Resplandor Ambiental Exterior Sutil */}
          <span
            className="absolute inset-0 rounded-full blur-2xl transition-all duration-300 ease-out"
            style={{
              backgroundColor: auraColor,
              opacity: 0.10 + level * 0.20,
              transform: `scale(${1 + level * 0.18})`,
            }}
          />

          {/* Halo 1 - Exterior Concéntrico Amortiguado */}
          <span
            className="absolute inset-2 rounded-full border transition-all duration-300 ease-out"
            style={{
              borderColor: auraColor,
              opacity: 0.18 + level * 0.25,
              transform: `scale(${1 + level * 0.18})`,
            }}
          />

          {/* Halo 2 - Medio Concéntrico */}
          <span
            className="absolute inset-8 rounded-full border transition-all duration-300 ease-out"
            style={{
              borderColor: auraColor,
              opacity: 0.28 + level * 0.20,
              transform: `scale(${1 + level * 0.10})`,
            }}
          />

          {/* Halo 3 - Interior Suave */}
          <span
            className="absolute inset-13 rounded-full border transition-all duration-300 ease-out"
            style={{
              borderColor: auraColor,
              opacity: 0.38 + level * 0.15,
              transform: `scale(${1 + level * 0.06})`,
            }}
          />

          {/* Círculo Central con Mascota 3D con Escalado Suave */}
          <span
            className="grid h-36 w-36 sm:h-38 sm:w-38 place-items-center overflow-hidden rounded-full bg-white/70 shadow-[0_8px_30px_rgba(59,130,246,0.18)] transition-transform duration-300 ease-out dark:bg-white/[0.08]"
            style={{ transform: `scale(${1 + level * 0.05})` }}
          >
            <img
              src={MASCOTA_URL}
              alt="Nexxus IA"
              className="h-28 w-28 sm:h-30 sm:w-30 object-contain filter drop-shadow-md transition-transform group-hover:scale-105"
            />
          </span>
        </button>

        {/* Textos de Estado */}
        <div className="min-h-14 text-center select-none">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-navy-900 dark:text-white">
            {status.title}
          </h1>
          {error || status.subtitle ? (
            <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-white/60">
              {error || status.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {/* Transcripción en Vivo */}
      {transcript.length > 0 && (
        <div className="mx-auto mb-4 max-h-32 w-full max-w-2xl space-y-1.5 overflow-y-auto text-center text-sm leading-6 px-4">
          {transcript[transcript.length - 2]?.text ? (
            <p className="text-xs text-gray-400 dark:text-white/40 italic">
              {transcript[transcript.length - 2]?.text}
            </p>
          ) : null}
          <p className="font-semibold text-brand-600 dark:text-white text-sm sm:text-base animate-fadeIn">
            {transcript[transcript.length - 1]?.text}
          </p>
        </div>
      )}

      {/* Tarjetas de Acciones Sensibles */}
      {actions.length > 0 && (
        <div className="mx-auto mb-4 flex w-full max-w-md flex-col gap-2.5">
          {actions.map((action) => (
            <div
              key={action.id}
              className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm dark:border-white/[0.12] dark:bg-[#181926]"
            >
              <p className="text-xs sm:text-sm font-semibold text-navy-900 dark:text-white">
                Confirmar: {action.titulo}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void resolveAction(action, "aprobada")}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-500 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-600 transition"
                >
                  <FiCheck className="h-3.5 w-3.5" /> Aprobar
                </button>
                <button
                  type="button"
                  onClick={() => void resolveAction(action, "rechazada")}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-red-500 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-600 transition"
                >
                  <FiX className="h-3.5 w-3.5" /> Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dock de Controles Ergonómico (Estilo Mobile) */}
      <div className="flex items-start justify-center gap-8 sm:gap-12 pt-2">
        {/* Botón Teclado / Ir al Texto */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => {
              release();
              setState("ended");
              onClose();
            }}
            aria-label="Ir al chat de texto"
            className="grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-full border border-gray-200/80 bg-white/80 text-gray-700 shadow-md backdrop-blur-md transition hover:bg-gray-100 active:scale-95 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/15"
          >
            <MdKeyboard size={24} />
          </button>
          <span className="text-[11px] font-medium text-gray-500 dark:text-white/60">
            Teclado
          </span>
        </div>

        {/* Botón Silenciar */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            aria-label={muted ? "Activar micrófono" : "Silenciar micrófono"}
            disabled={!active}
            onClick={toggleMute}
            className={`grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-full border transition active:scale-95 disabled:opacity-40 shadow-md ${
              muted
                ? "border-red-500/40 bg-red-500/15 text-red-500 dark:border-red-400/40 dark:bg-red-500/20 dark:text-red-400"
                : "border-gray-200/80 bg-white/80 text-gray-700 hover:bg-gray-100 dark:border-white/[0.12] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/15"
            }`}
          >
            {muted ? <MdMicOff size={24} /> : <MdMic size={24} />}
          </button>
          <span
            className={`text-[11px] font-medium ${
              muted ? "text-red-500 font-bold" : "text-gray-500 dark:text-white/60"
            }`}
          >
            {muted ? "Silenciado" : "Silenciar"}
          </span>
        </div>

        {/* Botón Finalizar Llamada */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            aria-label="Finalizar llamada"
            onClick={() => {
              release();
              setState("ended");
              onClose();
            }}
            className="grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/35 transition hover:bg-red-600 hover:scale-105 active:scale-95"
          >
            <MdCallEnd size={24} />
          </button>
          <span className="text-[11px] font-medium text-gray-500 dark:text-white/60">
            Finalizar
          </span>
        </div>
      </div>

      {/* Botón de Reintentar en Caso de Error */}
      {state === "error" || state === "ended" ? (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => void start()}
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600 active:scale-95"
          >
            <MdRefresh size={18} />
            <span>Reintentar conexión</span>
          </button>
          <button
            type="button"
            onClick={() => {
              release();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-600 hover:bg-gray-50 transition dark:border-white/10 dark:bg-white/5 dark:text-white/70"
          >
            <MdClose size={16} />
            <span>Cerrar</span>
          </button>
        </div>
      ) : null}
    </section>
  );
}
