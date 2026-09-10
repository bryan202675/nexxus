import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdAdd,
  MdClose,
  MdDeleteOutline,
  MdArrowForward,
  MdArrowUpward,
  MdAssignment,
  MdWarning,
  MdInsights,
  MdAltRoute,
  MdFavorite,
  MdDoneAll,
  MdTrendingUp,
  MdOutlineAccessTime,
} from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";

import NexxusCard from "views/nexxus/components/NexxusCard";
import RenderMarkdownWeb from "components/nexxus/RenderMarkdownWeb";
import { useAuth } from "context/AuthContext";
import { askNexxusAI } from "services/aiAssistant";
import { useEmpresaPlan, contarUsoMensualIA, limiteAlcanzado } from "services/planEnforcement";

const MASCOTA_URL = "/nexxusIA.png";

const SUGERENCIAS_RAPIDAS = [
  {
    label: "Métricas de mi empresa",
    Icon: MdInsights,
    texto: "Dame un resumen ejecutivo con las métricas clave de mi empresa (asistencia, plantilla, incidencias y tareas).",
  },
  {
    label: "Rendimiento del equipo",
    Icon: MdTrendingUp,
    texto: "¿Cómo va el rendimiento, cumplimiento de metas y tareas de los departamentos esta semana?",
  },
  {
    label: "Asistencia y ausencias",
    Icon: MdOutlineAccessTime,
    texto: "¿Cuál es el balance de asistencia de hoy y qué ausencias o permisos están pendientes de aprobación?",
  },
  {
    label: "Alertas e incidencias",
    Icon: MdWarning,
    texto: "¿Cuáles son las incidencias activas, alertas urgentes y estado de equipos/activos en la empresa?",
  },
  {
    label: "Bienestar y clima laboral",
    Icon: MdFavorite,
    texto: "¿Cómo están los registros de bienestar del equipo, estado anímico general y qué acciones recomiendas?",
  },
  {
    label: "Prioridades estratégicas",
    Icon: MdAltRoute,
    texto: "Ayúdame a identificar y priorizar las metas y focos estratégicos de la organización para esta semana.",
  },
];

function IconoOndasVoz({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="4" y="9" width="2" height="6" rx="1" />
      <rect x="9" y="4" width="2.2" height="16" rx="1.1" />
      <rect x="14" y="7" width="2.2" height="10" rx="1.1" />
      <rect x="19" y="10" width="2" height="4" rx="1" />
    </svg>
  );
}

interface MensajeChat {
  id: string;
  rol: "ia" | "usuario";
  texto: string;
  hora: string;
  redirect?: { path: string; etiqueta: string } | null;
}

interface NexxusAiChatPanelProps {
  title?: string;
  subtitle?: string;
  onOpenVoice?: () => void;
}

export default function NexxusAiChatPanel({
  title = "Nexxus IA",
  subtitle = "Copiloto Operativo Inteligente",
  onOpenVoice,
}: NexxusAiChatPanelProps = {}) {
  const navigate = useNavigate();
  const { user, perfil, empresaId } = useAuth();
  const { plan, planLimits } = useEmpresaPlan();

  const callerId = user?.uid || user?.id || "guest";
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [usoMensual, setUsoMensual] = useState<number | null>(null);
  const [menuOpcionesVisible, setMenuOpcionesVisible] = useState(false);
  const [modalBorrarVisible, setModalBorrarVisible] = useState(false);
  const [saludoIndex, setSaludoIndex] = useState(0);
  const finRef = useRef<HTMLDivElement | null>(null);

  const primerNombre = useMemo(() => {
    if (!perfil?.nombre && !user?.email) return "Colega";
    const base = perfil?.nombre || user?.email?.split("@")[0] || "Colega";
    return base.trim().split(" ")[0];
  }, [perfil?.nombre, user?.email]);

  const listaSaludos = useMemo(() => {
    const hora = new Date().getHours();
    let momento = "hoy";
    if (hora >= 5 && hora < 12) momento = "esta mañana";
    else if (hora >= 12 && hora < 19) momento = "esta tarde";
    else momento = "esta noche";

    return [
      { prefix: "¿Cómo impulsamos tu empresa, ", highlight: primerNombre, suffix: "?" },
      { prefix: "¿Qué métricas analizamos " + momento + ", ", highlight: primerNombre, suffix: "?" },
      { prefix: "¿Qué optimizamos en tu organización, ", highlight: primerNombre, suffix: "?" },
      { prefix: "¿En qué te apoyo con la gestión " + momento + ", ", highlight: primerNombre, suffix: "?" },
      { prefix: "¿Listo para liderar tu equipo, ", highlight: primerNombre, suffix: "?" },
      { prefix: "¿Qué objetivos revisamos hoy, ", highlight: primerNombre, suffix: "?" },
    ];
  }, [primerNombre]);

  useEffect(() => {
    setSaludoIndex(Math.floor(Math.random() * listaSaludos.length));
  }, [listaSaludos.length]);

  const saludoActual = listaSaludos[saludoIndex % listaSaludos.length] || listaSaludos[0];

  const formatearHora = () =>
    new Date().toLocaleTimeString("es-SV", { hour: "numeric", minute: "2-digit", hour12: true });

  // Cargar historial persistente limpio
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(`nexxus_ai_chat_web_${callerId}`);
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed)) {
          const validos = parsed.filter((m: any) => m.id !== "0" && m.id !== "bienvenida");
          setMensajes(validos);
        }
      }
    } catch {
      // ignore
    }
  }, [callerId]);

  // Guardar historial
  const guardarMensajes = (actualizador: MensajeChat[] | ((prev: MensajeChat[]) => MensajeChat[])) => {
    setMensajes((prev) => {
      const next = typeof actualizador === "function" ? actualizador(prev) : actualizador;
      try {
        localStorage.setItem(`nexxus_ai_chat_web_${callerId}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const limpiarHistorial = () => {
    try {
      localStorage.removeItem(`nexxus_ai_chat_web_${callerId}`);
    } catch {
      // ignore
    }
    setMensajes([]);
    setMenuOpcionesVisible(false);
    setModalBorrarVisible(false);
    setSaludoIndex((prev) => prev + 1);
  };

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, enviando]);

  useEffect(() => {
    if (!empresaId) return;
    contarUsoMensualIA(empresaId).then(setUsoMensual).catch(() => setUsoMensual(null));
  }, [empresaId]);

  const limiteIaAlcanzado = limiteAlcanzado(usoMensual ?? 0, planLimits.aiRequestsMonthly);

  const enviarMensaje = async (mensajeTexto?: string) => {
    const prompt = (mensajeTexto || texto).trim();
    if (!prompt || enviando) return;
    if (limiteIaAlcanzado) {
      setError(`Alcanzaste el límite de ${planLimits.aiRequestsMonthly} consultas mensuales de Nexxus IA del plan ${plan}.`);
      return;
    }
    setError("");
    setMenuOpcionesVisible(false);

    const mensajeUsuario: MensajeChat = {
      id: Date.now().toString(),
      rol: "usuario",
      texto: prompt,
      hora: formatearHora(),
    };

    guardarMensajes((prev) => [...prev, mensajeUsuario]);
    setTexto("");
    setEnviando(true);

    try {
      const historyForApi = mensajes.slice(-10).map((m) => ({ rol: m.rol, texto: m.texto }));
      const respuesta = await askNexxusAI({ prompt, history: historyForApi });

      const mensajeIA: MensajeChat = {
        id: (Date.now() + 1).toString(),
        rol: "ia",
        texto: respuesta.respuesta,
        hora: formatearHora(),
        redirect: respuesta.redirect || null,
      };

      guardarMensajes((prev) => [...prev, mensajeIA]);
      setUsoMensual((actual) => (actual ?? 0) + 1);
    } catch (err: any) {
      setError(err?.message || "No se pudo consultar a Nexxus IA.");
      guardarMensajes((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          rol: "ia",
          texto: "No pude procesar esa consulta en este momento. Intenta de nuevo.",
          hora: formatearHora(),
        },
      ]);
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  if (!empresaId) {
    return (
      <p className="text-sm font-medium text-gray-600 dark:text-white/70">
        Tu cuenta no tiene una empresa asociada.
      </p>
    );
  }

  return (
    <div className="relative w-full">
      {error ? (
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-medium text-red-500 dark:text-red-400">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-300">
            <MdClose className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <NexxusCard extra="flex h-[calc(100vh-125px)] min-h-[580px] flex-col p-4 sm:p-6 relative overflow-hidden bg-white/90 dark:bg-charcoal border border-gray-200/80 dark:border-white/[0.08] shadow-2xl rounded-3xl">
        {/* Header Superior Corporativo */}
        <div className="mb-3 flex items-center justify-between border-b border-gray-100/80 pb-3.5 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 dark:bg-white/5 border border-brand-500/20 dark:border-white/10 shadow-inner">
              <img src={MASCOTA_URL} alt="Nexxus IA" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-bold text-navy-700 dark:text-white tracking-tight">{title}</p>
              <p className="text-xs text-gray-500 dark:text-white/50">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mensajes.length > 0 && (
              <button
                type="button"
                onClick={() => setModalBorrarVisible(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:scale-105 active:scale-95 transition dark:border-red-500/30 dark:text-red-400"
                title="Borrar conversación"
                aria-label="Borrar conversación"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Cuerpo Principal: Hero Gemini / Historial de Conversación */}
        <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 scroll-smooth">
          {mensajes.length === 0 ? (
            /* Estado Inicial de Bienvenida (Estilo Gemini con Mascota Nexxus IA y Saludo Dinámico) */
            <div className="flex h-full flex-col items-center justify-center py-6 px-4 text-center select-none animate-fadeIn max-w-2xl mx-auto">
              <button
                type="button"
                aria-label="Cambiar saludo"
                className="group relative mb-4 cursor-pointer"
                onClick={() => setSaludoIndex((prev) => prev + 1)}
              >
                <div className="absolute -inset-4 rounded-full bg-brand-500/15 blur-xl dark:bg-brand-400/10 pointer-events-none" />
                <img
                  src={MASCOTA_URL}
                  alt="Nexxus IA"
                  className="relative h-20 w-20 sm:h-24 sm:w-24 object-contain filter drop-shadow-lg transition-transform group-hover:scale-110 duration-300"
                />
              </button>

              <h2 className="mb-6 text-2xl sm:text-3xl font-semibold tracking-tight text-navy-700 dark:text-white transition-all duration-300">
                {saludoActual.prefix}
                <span className="text-brand-500 dark:text-brand-400">{saludoActual.highlight}</span>
                {saludoActual.suffix}
              </h2>

              {/* Chips de sugerencias rápidas centradas */}
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {SUGERENCIAS_RAPIDAS.map(({ label, Icon, texto: sugerenciaTexto }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => enviarMensaje(sugerenciaTexto)}
                    className="group inline-flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/90 px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-all hover:border-brand-500/40 hover:bg-brand-500/5 hover:text-brand-600 hover:scale-105 active:scale-95 dark:border-white/[0.08] dark:bg-[#181926] dark:text-white/80 dark:hover:border-brand-400/40 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    <Icon className="h-4 w-4 text-brand-500 dark:text-brand-400 transition-transform group-hover:scale-110" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Historial de Mensajes con Animaciones Suaves */
            <div className="flex flex-col gap-4 py-2 max-w-3xl mx-auto w-full">
              {mensajes.map((m) => {
                const esUsuario = m.rol === "usuario";

                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 transition-all duration-300 ${
                      esUsuario ? "flex-row-reverse self-end max-w-[85%]" : "self-start max-w-[85%]"
                    }`}
                  >
                    {!esUsuario ? (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/10 dark:bg-white/10 mt-1 shadow-sm">
                        <img src={MASCOTA_URL} alt="IA" className="h-6 w-6 object-contain" />
                      </div>
                    ) : null}

                    <div
                      className={`relative rounded-2xl px-4 py-3 text-sm shadow-sm transition-all ${
                        esUsuario
                          ? "bg-navy-900 text-white dark:bg-brand-500 rounded-br-xs"
                          : "bg-white text-navy-700 border border-gray-100 dark:bg-[#181926] dark:border-white/[0.08] dark:text-white rounded-tl-xs shadow-sm"
                      }`}
                    >
                      {!esUsuario ? (
                        <div>
                          <RenderMarkdownWeb texto={m.texto} />
                          {m.redirect ? (
                            <button
                              type="button"
                              onClick={() => navigate(m.redirect.path)}
                              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-brand-600 active:scale-95 shadow-md shadow-brand-500/20 dark:bg-brand-400 dark:text-navy-900"
                            >
                              <span>{m.redirect.etiqueta}</span>
                              <MdArrowForward className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                          <div className="mt-2 flex items-center justify-start text-[10.5px] font-medium text-gray-400 dark:text-white/40">
                            <span>{m.hora}</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="whitespace-pre-wrap leading-relaxed">{m.texto}</p>
                          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] font-medium text-white/70">
                            <span>{m.hora}</span>
                            <MdDoneAll className="h-3.5 w-3.5 text-white/80" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Indicador Escribiendo */}
              {enviando && (
                <div className="flex items-center gap-3 self-start animate-pulse">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/10 dark:bg-white/10 shadow-sm">
                    <img src={MASCOTA_URL} alt="IA" className="h-6 w-6 object-contain" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-medium text-gray-500 border border-gray-100 dark:bg-[#181926] dark:border-white/[0.08] dark:text-white/70 shadow-sm">
                    <span>Nexxus IA pensando</span>
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={finRef} />
            </div>
          )}
        </div>

        {/* Contenedor Inferior Centrado estilo Cápsula Gemini */}
        <div className="mt-2 relative max-w-3xl mx-auto w-full">
          {/* Panel Desplegable Animado del '+' */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-out origin-bottom ${
              menuOpcionesVisible
                ? "max-h-96 opacity-100 mb-2.5 scale-100 pointer-events-auto"
                : "max-h-0 opacity-0 mb-0 scale-95 pointer-events-none"
            }`}
          >
            <div className="rounded-2xl border border-gray-200/80 bg-white/95 p-3.5 shadow-2xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#181926]/95">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                  Opciones rápidas
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpcionesVisible(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
                >
                  <MdClose className="h-4 w-4" />
                </button>
              </div>

              {/* Sugerencias en el menú */}
              <div className="flex flex-wrap gap-2 mb-3">
                {SUGERENCIAS_RAPIDAS.map(({ label, Icon, texto: sugerenciaTexto }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => enviarMensaje(sugerenciaTexto)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50/80 px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-brand-500/10 hover:text-brand-600 transition dark:border-white/[0.08] dark:bg-white/5 dark:text-white/80 dark:hover:text-white dark:hover:bg-white/10"
                  >
                    <Icon className="h-3.5 w-3.5 text-brand-500 dark:text-brand-400" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Acciones utilitarias */}
              <div className="flex items-center gap-2 border-t border-gray-100 pt-2.5 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpcionesVisible(false);
                    setModalBorrarVisible(true);
                  }}
                  disabled={mensajes.length === 0}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed dark:border-red-500/30 dark:text-red-400"
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                  <span>Borrar conversación</span>
                </button>

                {onOpenVoice && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpcionesVisible(false);
                      onOpenVoice();
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-xs font-bold text-brand-600 hover:bg-brand-500/20 transition dark:border-brand-400/30 dark:text-brand-300"
                  >
                    <IconoOndasVoz size={14} className="text-brand-500 dark:text-brand-300" />
                    <span>Nexxus Voice</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Barra de Entrada Flotante estilo Cápsula Gemini */}
          <div className="flex items-center gap-2.5 rounded-full border border-gray-200/80 bg-white/95 px-3 py-2 shadow-xl backdrop-blur-xl transition-all dark:border-white/[0.08] dark:bg-[#181926] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] focus-within:border-brand-500/40 dark:focus-within:border-brand-400/30">
            {/* Botón '+' con Rotación Suave */}
            <button
              type="button"
              onClick={() => setMenuOpcionesVisible((prev) => !prev)}
              aria-label="Opciones adicionales"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-navy-700 transition-all active:scale-95 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <MdAdd
                className={`h-5 w-5 transition-transform duration-300 ease-out ${
                  menuOpcionesVisible ? "rotate-45 text-brand-500 dark:text-brand-400" : "rotate-0"
                }`}
              />
            </button>

            {/* Input Central 100% Integrado */}
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={limiteIaAlcanzado ? "Límite mensual de consultas alcanzado" : "Pregunta a Nexxus IA..."}
              disabled={enviando || limiteIaAlcanzado}
              style={{ backgroundColor: "transparent" }}
              className="h-10 flex-1 bg-transparent px-2 text-sm text-navy-700 placeholder:text-gray-400 outline-none border-0 ring-0 focus:ring-0 focus:outline-none dark:text-white dark:placeholder:text-white/40 caret-brand-500 dark:caret-brand-400"
            />

            {/* Botón Dinámico Derecha: Voz u Enviar */}
            <div className="shrink-0">
              {texto.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={() => enviarMensaje()}
                  disabled={enviando || limiteIaAlcanzado}
                  aria-label="Enviar mensaje"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900 text-white shadow-md transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 dark:bg-white dark:text-[#0B0C1E]"
                >
                  <MdArrowUpward className="h-5 w-5" />
                </button>
              ) : onOpenVoice ? (
                <button
                  type="button"
                  onClick={onOpenVoice}
                  aria-label="Hablar con Nexxus IA por voz"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white shadow-md shadow-brand-500/25 transition-all duration-200 hover:scale-105 hover:bg-brand-600 active:scale-95 dark:bg-brand-500 dark:hover:bg-brand-400"
                >
                  <IconoOndasVoz size={17} className="text-white" />
                </button>
              ) : null}
            </div>
          </div>

          {usoMensual !== null && planLimits.aiRequestsMonthly ? (
            <p className="mt-2 px-3 text-[11px] text-gray-400 dark:text-white/40 text-center">
              {usoMensual} / {planLimits.aiRequestsMonthly} consultas usadas este mes (plan {plan}).
            </p>
          ) : null}
        </div>
      </NexxusCard>

      {/* Modal de Confirmación para Borrar Conversación */}
      {modalBorrarVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#181926] text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500 dark:border dark:border-red-500/20">
              <MdDeleteOutline className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-navy-700 dark:text-white">
              ¿Borrar conversación?
            </h3>
            <p className="mb-6 text-xs text-gray-500 dark:text-white/60 leading-relaxed">
              ¿Deseas eliminar todo el historial de esta conversación con Nexxus IA? Esta acción restablecerá el chat al estado inicial.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setModalBorrarVisible(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition dark:border-white/10 dark:text-white dark:hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={limpiarHistorial}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-xs font-bold text-white shadow-md shadow-red-500/30 hover:bg-red-600 transition active:scale-95"
              >
                Borrar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
