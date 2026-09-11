import React, { useEffect, useMemo, useState } from "react";
import {
  MdLock,
  MdBusiness,
  MdPerson,
  MdPersonOutline,
  MdSend,
  MdMailOutline,
  MdPhone,
  MdVpnKey,
  MdLanguage,
  MdPhoneAndroid,
  MdOutlineSearch,
  MdOutlineClose,
  MdOutlineFilterList,
  MdOutlineSupportAgent,
  MdOutlineCheckCircleOutline,
  MdOutlineAccessTime,
  MdOutlineWarningAmber,
  MdOutlineContentCopy,
  MdOutlineCheck,
  MdOutlineChatBubbleOutline,
  MdOutlineAdminPanelSettings,
  MdOutlineArrowForward,
  MdOutlineArrowBack,
  MdOutlineSecurity,
  MdOutlineCategory,
  MdOutlineHistory,
  MdOutlineShield,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import Avatar from "components/nexxus/Avatar";
import {
  subscribeSupportSessions,
  loadMoreCompanies,
  subscribeSupportTickets,
  subscribeTicketThread,
  responderTicket,
  subscribePublicSupportRequests,
  responderSoportePublico,
  startSupportSession,
} from "services/superAdminRepository";
import { formatoFechaHora, formatoFecha, etiquetaRol } from "services/saFormat";

const PRIORIDAD_STYLES: Record<string, { label: string; badge: string; dot: string }> = {
  baja: {
    label: "Baja",
    badge: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  media: {
    label: "Media",
    badge: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-500/20",
    dot: "bg-amber-500",
  },
  alta: {
    label: "Alta",
    badge: "bg-orange-500/10 text-orange-600 dark:bg-orange-400/20 dark:text-orange-300 border border-orange-500/20",
    dot: "bg-orange-500",
  },
  urgente: {
    label: "Urgente",
    badge: "bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300 border border-rose-500/20",
    dot: "bg-rose-500",
  },
};

const ESTADO_TICKET_STYLES: Record<string, { label: string; badge: string; dot: string }> = {
  abierto: {
    label: "Abierto",
    badge: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300 border border-blue-500/20",
    dot: "bg-blue-500",
  },
  en_progreso: {
    label: "En progreso",
    badge: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-500/20",
    dot: "bg-amber-500",
  },
  resuelto: {
    label: "Resuelto",
    badge: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  cerrado: {
    label: "Cerrado",
    badge: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70 border border-gray-200/50 dark:border-white/10",
    dot: "bg-gray-400",
  },
};

const ESTADO_PUBLICO_STYLES: Record<string, { label: string; badge: string; dot: string }> = {
  pendiente: {
    label: "Pendiente",
    badge: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300 border border-blue-500/20",
    dot: "bg-blue-500",
  },
  en_revision: {
    label: "En revisión",
    badge: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-500/20",
    dot: "bg-amber-500",
  },
  contactado: {
    label: "Contactado",
    badge: "bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300 border border-purple-500/20",
    dot: "bg-purple-500",
  },
  resuelto: {
    label: "Resuelto",
    badge: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-500/20",
    dot: "bg-emerald-500",
  },
};

const ESTADOS_TICKET = [
  { value: "abierto", label: "Abierto" },
  { value: "en_progreso", label: "En progreso" },
  { value: "resuelto", label: "Resuelto" },
  { value: "cerrado", label: "Cerrado" },
];

const ESTADOS_PUBLICO = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_revision", label: "En revisión" },
  { value: "contactado", label: "Contactado" },
  { value: "resuelto", label: "Resuelto" },
];

function getPrioridadStyle(p: string | null | undefined) {
  const key = String(p || "media").toLowerCase().trim();
  return PRIORIDAD_STYLES[key] || PRIORIDAD_STYLES.media;
}
function getEstadoTicketStyle(e: string | null | undefined) {
  const key = String(e || "abierto").toLowerCase().trim();
  return ESTADO_TICKET_STYLES[key] || ESTADO_TICKET_STYLES.abierto;
}

function getEstadoPublicoStyle(e: string | null | undefined) {
  const key = String(e || "pendiente").toLowerCase().trim();
  return ESTADO_PUBLICO_STYLES[key] || ESTADO_PUBLICO_STYLES.pendiente;
}

function MetaCard({
  icon: Icon,
  label,
  value,
  copyable = false,
  onCopy,
  copied = false,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  copyable?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100/80 bg-white/70 p-3.5 shadow-xs transition-colors dark:border-white/5 dark:bg-white/[0.02]">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase dark:text-white/40">
          {label}
        </p>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <div className="truncate text-xs sm:text-sm font-bold text-navy-700 dark:text-white">
            {value}
          </div>
          {copyable && onCopy && (
            <button
              type="button"
              onClick={onCopy}
              title="Copiar al portapapeles"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200/60 bg-gray-50/80 px-2 py-0.5 text-[11px] font-medium text-gray-600 transition hover:bg-gray-100 hover:text-navy-700 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {copied ? (
                <>
                  <MdOutlineCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <MdOutlineContentCopy className="h-3 w-3" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function coincide(texto: any, termino: string) {
  return String(texto || "").toLowerCase().includes(termino);
}

export default function Soporte() {
  // --- Sesiones de soporte remoto (impersonación) ---
  const [sesiones, setSesiones] = useState<any[]>([]);
  const [cargandoSesiones, setCargandoSesiones] = useState(true);
  const [error, setError] = useState("");

  const [empresas, setEmpresas] = useState<any[]>([]);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState("");
  const [iniciandoSesion, setIniciandoSesion] = useState(false);

  // --- Bandeja de soporte ---
  const [tickets, setTickets] = useState<any[]>([]);
  const [solicitudesPublicas, setSolicitudesPublicas] = useState<any[]>([]);
  const [pestana, setPestana] = useState<"empresa" | "usuario" | "publico">("empresa");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [hilo, setHilo] = useState<any[]>([]);
  const [respuesta, setRespuesta] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [incluirLinkRecuperacion, setIncluirLinkRecuperacion] = useState(false);
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);
  const [avisoRespuesta, setAvisoRespuesta] = useState<{ tipo: "ok" | "err"; texto: string } | null>(null);

  // Copias
  const [copiadoCorreo, setCopiadoCorreo] = useState(false);
  const [copiadoTel, setCopiadoTel] = useState(false);

  // 1. Cargar Sesiones
  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeSupportSessions(
      (rows) => {
        if (active) {
          setSesiones(rows || []);
          setCargandoSesiones(false);
        }
      },
      (err) => {
        if (active) {
          setError(err.message || "No se pudieron sincronizar las sesiones de soporte.");
          setCargandoSesiones(false);
        }
      }
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // 2. Cargar Empresas
  useEffect(() => {
    let active = true;
    loadMoreCompanies({}, 500, null).then((resultado) => {
      if (active) setEmpresas(resultado.items || []);
    });
    return () => {
      active = false;
    };
  }, []);

  const empresasPorId = useMemo(() => {
    const map = new Map<string, { nombre: string; codigo?: string }>();
    empresas.forEach((empresa) =>
      map.set(empresa.id, {
        nombre: empresa.nombre || "Empresa sin nombre",
        codigo: empresa.codigo || (empresa.id ? empresa.id.slice(0, 8) : "—"),
      })
    );
    return map;
  }, [empresas]);

  // 3. Suscribirse a Tickets
  useEffect(() => {
    const unsub = subscribeSupportTickets(
      (items) => setTickets(items || []),
      (err) => setError(err.message || "No se pudieron cargar los tickets.")
    );
    return unsub;
  }, []);

  // 4. Suscribirse a Solicitudes Públicas
  useEffect(() => {
    const unsub = subscribePublicSupportRequests(
      (items) => setSolicitudesPublicas(items || []),
      (err) => setError(err.message || "No se pudieron cargar las solicitudes públicas.")
    );
    return unsub;
  }, []);

  useEffect(() => {
    setSeleccionId(null);
    setRespuesta("");
    setNuevoEstado("");
    setIncluirLinkRecuperacion(false);
    setAvisoRespuesta(null);
  }, [pestana]);

  const ticketsEmpresa = useMemo(() => tickets.filter((t) => t.tipo === "empresa"), [tickets]);
  const ticketsUsuario = useMemo(() => tickets.filter((t) => t.tipo === "usuario"), [tickets]);

  const listaActual = pestana === "empresa" ? ticketsEmpresa : pestana === "usuario" ? ticketsUsuario : solicitudesPublicas;

  // Filtrado y Búsqueda
  const listaFiltrada = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return listaActual.filter((item: any) => {
      if (filtroEstado !== "todos" && item.estado !== filtroEstado) return false;
      if (filtroPrioridad !== "todas" && item.prioridad !== filtroPrioridad) return false;
      if (!termino) return true;
      if (pestana === "publico") {
        return (
          coincide(item.nombre, termino) ||
          coincide(item.correo, termino) ||
          coincide(item.asunto, termino) ||
          coincide(item.ticketCodigo, termino)
        );
      }
      return (
        coincide(item.creadoPorNombre, termino) ||
        coincide(item.empresaNombre, termino) ||
        coincide(item.titulo, termino)
      );
    });
  }, [listaActual, filtroEstado, filtroPrioridad, busqueda, pestana]);

  const seleccionado: any = useMemo(
    () => listaActual.find((item: any) => item.id === seleccionId) || null,
    [listaActual, seleccionId]
  );

  useEffect(() => {
    if (pestana === "publico" || !seleccionId) {
      setHilo([]);
      return;
    }
    const unsub = subscribeTicketThread(seleccionId, setHilo, () => {});
    return unsub;
  }, [seleccionId, pestana]);

  const seleccionar = (id: string) => {
    setSeleccionId(id);
    setRespuesta("");
    setNuevoEstado("");
    setIncluirLinkRecuperacion(false);
    setAvisoRespuesta(null);
  };

  const enviarRespuesta = async () => {
    if (!seleccionado || !respuesta.trim()) return;
    try {
      setEnviandoRespuesta(true);
      setAvisoRespuesta(null);
      if (pestana === "publico") {
        const resultado = await responderSoportePublico({
          id: seleccionado.id,
          respuesta: respuesta.trim(),
          nuevoEstado: nuevoEstado || undefined,
          incluirLinkRecuperacion,
          redirectTo: `${window.location.origin}/auth/registro`,
        });
        setAvisoRespuesta({
          tipo: "ok",
          texto: resultado?.correoEnviado
            ? "Respuesta enviada por correo exitosamente."
            : "Se guardó la respuesta en el sistema.",
        });
      } else {
        await responderTicket(seleccionado.id, respuesta.trim(), nuevoEstado || null);
        setAvisoRespuesta({
          tipo: "ok",
          texto: "Respuesta enviada y agregada al hilo del ticket.",
        });
      }
      setRespuesta("");
      setNuevoEstado("");
      setIncluirLinkRecuperacion(false);
    } catch (err: any) {
      setAvisoRespuesta({
        tipo: "err",
        texto: err.message || "No se pudo enviar la respuesta.",
      });
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  const iniciarSesionSoporte = async () => {
    if (!empresaSeleccionada) return;
    try {
      setIniciandoSesion(true);
      await startSupportSession(empresaSeleccionada);
    } catch (err: any) {
      setError(err.message || "No se pudo iniciar la sesión de soporte.");
    } finally {
      setIniciandoSesion(false);
    }
  };

  const handleCopy = (text: string, type: "correo" | "tel") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === "correo") {
      setCopiadoCorreo(true);
      setTimeout(() => setCopiadoCorreo(false), 2000);
    } else {
      setCopiadoTel(true);
      setTimeout(() => setCopiadoTel(false), 2000);
    }
  };

  // Métricas para el Asymmetric Grid
  const totalCasos = tickets.length + solicitudesPublicas.length;
  const casosAbiertos =
    tickets.filter((t) => t.estado === "abierto" || t.estado === "en_progreso").length +
    solicitudesPublicas.filter((s) => s.estado === "pendiente" || s.estado === "en_revision").length;
  const casosResueltos =
    tickets.filter((t) => t.estado === "resuelto" || t.estado === "cerrado").length +
    solicitudesPublicas.filter((s) => s.estado === "resuelto").length;

  const pctEmpresa = totalCasos > 0 ? Math.round((ticketsEmpresa.length / totalCasos) * 100) : 40;
  const pctUsuario = totalCasos > 0 ? Math.round((ticketsUsuario.length / totalCasos) * 100) : 10;
  const pctPublico = totalCasos > 0 ? Math.round((solicitudesPublicas.length / totalCasos) * 100) : 50;

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Alertas de error */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
          <div className="flex items-center gap-2">
            <MdOutlineWarningAmber className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            className="uppercase tracking-wider hover:underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Header Superior */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-navy-700 sm:text-3xl dark:text-white">
            Centro de Soporte & Asistencia Técnica
          </h1>
          <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm dark:text-white/60">
            Gestión centralizada de tickets corporativos, solicitudes públicas, hilos de resolución y sesiones de asistencia remota.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="#sesion-soporte"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-brand-500/25 transition duration-150 hover:bg-brand-600 active:scale-[0.98]"
          >
            <MdLock className="h-4 w-4" />
            <span>Nueva Sesión Remota</span>
          </a>
        </div>
      </div>

      {/* Grid Asimétrico Superior (7+5 cols) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
        {/* Hero Card (7 cols): Mesa Global de Soporte */}
        <div className="lg:col-span-7 flex flex-col">
          <NexxusCard extra="p-6 h-full flex flex-col justify-between" delay={50}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-navy-700 dark:text-white">
                  Mesa Global de Soporte & Incidencias
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Mesa Operativa · SLA 99.4%
                </span>
              </div>

              {/* Métrica Gigante */}
              <div className="mt-4">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-brand-500 dark:text-brand-300">
                  {totalCasos}{" "}
                  <span className="text-xl sm:text-2xl font-bold text-gray-400 dark:text-white/40">Casos</span>
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-white/60">
                  <span>{casosAbiertos} pendientes de atención</span>
                  <span className="font-normal text-gray-400 dark:text-white/40">
                    · {casosResueltos} casos solucionados
                  </span>
                </p>
              </div>

              {/* Barra de Distribución Proporcional */}
              <div className="mt-6">
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <div
                    title={`Empresas: ${ticketsEmpresa.length}`}
                    className="bg-blue-500 transition-all duration-500"
                    style={{ width: `${pctEmpresa}%` }}
                  />
                  <div
                    title={`Usuarios: ${ticketsUsuario.length}`}
                    className="bg-indigo-500 transition-all duration-500"
                    style={{ width: `${pctUsuario}%` }}
                  />
                  <div
                    title={`Públicos: ${solicitudesPublicas.length}`}
                    className="bg-purple-500 transition-all duration-500"
                    style={{ width: `${pctPublico}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Leyenda */}
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Empresas</p>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-lg sm:text-xl font-black text-navy-700 dark:text-white">
                    {ticketsEmpresa.length}
                  </span>
                  <span className="text-[11px] font-medium text-gray-400 dark:text-white/40">
                    ({pctEmpresa}%)
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Colaboradores</p>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-lg sm:text-xl font-black text-navy-700 dark:text-white">
                    {ticketsUsuario.length}
                  </span>
                  <span className="text-[11px] font-medium text-gray-400 dark:text-white/40">
                    ({pctUsuario}%)
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Sin Registrar</p>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-lg sm:text-xl font-black text-navy-700 dark:text-white">
                    {solicitudesPublicas.length}
                  </span>
                  <span className="text-[11px] font-medium text-gray-400 dark:text-white/40">
                    ({pctPublico}%)
                  </span>
                </div>
              </div>
            </div>
          </NexxusCard>
        </div>

        {/* Right Stack (5 cols - 3 tarjetas) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Stat 1: Soporte de Empresa */}
          <NexxusCard
            extra="p-5 flex-1 flex flex-col justify-between cursor-pointer transition hover:shadow-md"
            delay={100}
            onClick={() => setPestana("empresa")}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                Soporte de Empresa
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
                <MdBusiness className="h-3 w-3" />
                Corporativo
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                {ticketsEmpresa.length}
              </h4>
              <span className="text-xs text-gray-400 dark:text-white/40">
                {ticketsEmpresa.filter((t) => t.estado === "abierto" || t.estado === "en_progreso").length} activos
              </span>
            </div>
          </NexxusCard>

          {/* Stat 2: Solicitudes Públicas */}
          <NexxusCard
            extra="p-5 flex-1 flex flex-col justify-between cursor-pointer transition hover:shadow-md"
            delay={130}
            onClick={() => setPestana("publico")}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                Solicitudes sin Registrar
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                <MdPersonOutline className="h-3 w-3" />
                Landing / App
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                {solicitudesPublicas.length}
              </h4>
              <span className="text-xs text-gray-400 dark:text-white/40">
                {solicitudesPublicas.filter((s) => s.estado === "pendiente" || s.estado === "en_revision").length} por revisar
              </span>
            </div>
          </NexxusCard>

          {/* Stat 3: Sesiones Remotas Activas */}
          <NexxusCard extra="p-5 flex-1 flex flex-col justify-between" delay={160}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                Sesiones de Asistencia Activas
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                <MdLock className="h-3 w-3" />
                Acceso Seguro
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                {sesiones.filter((s) => s.status === "active").length}
              </h4>
              <span className="text-xs text-gray-400 dark:text-white/40">
                {sesiones.length} sesiones históricas
              </span>
            </div>
          </NexxusCard>
        </div>
      </div>

      {/* --- Bandeja de Soporte Master-Detail --- */}
      <NexxusCard extra="p-6 overflow-hidden" delay={180}>
        {/* Header de la Bandeja */}
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 dark:border-white/10">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-base sm:text-lg font-black text-navy-700 dark:text-white">
                Bandeja de Gestión de Incidencias
              </h3>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-white/50">
                Mostrando {listaFiltrada.length} de {listaActual.length} casos en esta categoría
              </p>
            </div>

            {/* Pestañas Segmentadas */}
            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-gray-100/80 p-1 dark:bg-white/5">
              {[
                { id: "empresa", label: "Soporte de Empresa", icono: MdBusiness, count: ticketsEmpresa.length },
                { id: "usuario", label: "Soporte de Usuario", icono: MdPerson, count: ticketsUsuario.length },
                { id: "publico", label: "Sin Registrarse", icono: MdPersonOutline, count: solicitudesPublicas.length },
              ].map((tab: any) => {
                const TabIcon = tab.icono;
                const activo = pestana === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPestana(tab.id)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                      activo
                        ? "bg-white text-brand-500 shadow-xs font-bold dark:bg-charcoal dark:text-white"
                        : "text-gray-500 hover:text-navy-700 dark:text-white/60 dark:hover:text-white"
                    }`}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        activo
                          ? "bg-brand-500/10 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300"
                          : "bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-white/60"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="relative sm:col-span-6">
              <MdOutlineSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, correo, empresa o asunto..."
                className="h-10 w-full rounded-xl border border-gray-200/80 bg-white/80 pl-9 pr-8 text-xs font-medium text-navy-700 shadow-xs outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-700 dark:hover:text-white"
                >
                  <MdOutlineClose className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="sm:col-span-3">
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="h-10 w-full rounded-xl border border-gray-200/80 bg-white/80 px-3 text-xs font-medium text-navy-700 shadow-xs outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
              >
                <option value="todos">Todos los estados</option>
                {(pestana === "publico" ? ESTADOS_PUBLICO : ESTADOS_TICKET).map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={filtroPrioridad}
                onChange={(e) => setFiltroPrioridad(e.target.value)}
                className="h-10 w-full rounded-xl border border-gray-200/80 bg-white/80 px-3 text-xs font-medium text-navy-700 shadow-xs outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
              >
                <option value="todas">Todas las prioridades</option>
                <option value="urgente">Urgente</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
          </div>
        </div>

        {/* Layout Split Master-Detail */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
          {/* Columna Izquierda: Lista de Casos (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-2.5 max-h-[680px] overflow-y-auto pr-1">
            {listaFiltrada.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/40">
                  <MdOutlineSupportAgent className="h-6 w-6" />
                </div>
                <h4 className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
                  Sin casos en esta bandeja
                </h4>
                <p className="mt-1 text-xs text-gray-400 dark:text-white/50">
                  No hay tickets que coincidan con los filtros aplicados.
                </p>
              </div>
            ) : (
              listaFiltrada.map((item: any) => {
                const esPublico = pestana === "publico";
                const titulo = esPublico ? item.asunto : item.titulo;
                const subtitulo = esPublico ? item.nombre : `${item.creadoPorNombre} · ${item.empresaNombre}`;
                const prioridadStyle = getPrioridadStyle(item.prioridad);
                const estadoStyle = esPublico ? getEstadoPublicoStyle(item.estado) : getEstadoTicketStyle(item.estado);
                const activo = seleccionId === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => seleccionar(item.id)}
                    className={`group flex flex-col gap-2 rounded-2xl border p-4 text-left cursor-pointer transition-all duration-150 ${
                      activo
                        ? "border-brand-500 bg-brand-50/40 shadow-sm dark:border-brand-400/50 dark:bg-brand-500/10"
                        : "border-gray-100/80 bg-white/70 hover:border-gray-200 hover:bg-white hover:shadow-xs dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-white/10 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-xs sm:text-sm font-bold text-navy-700 dark:text-white group-hover:text-brand-500 transition-colors">
                        {titulo || "(Sin título)"}
                      </span>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${prioridadStyle.badge}`}>
                        <span className={`h-1 w-1 rounded-full ${prioridadStyle.dot}`} />
                        {prioridadStyle.label}
                      </span>
                    </div>

                    <p className="truncate text-xs font-medium text-gray-400 dark:text-white/50">
                      {subtitulo}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100/60 dark:border-white/5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[10px] font-bold ${estadoStyle.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${estadoStyle.dot} animate-pulse`} />
                        {estadoStyle.label}
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-white/40">
                        {formatoFecha(item.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Columna Derecha: Detalle & Expediente de Resolución (7 cols) */}
          <div className="lg:col-span-7">
            {!seleccionado ? (
              <div className="flex h-full min-h-[450px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center dark:border-white/10 dark:bg-white/[0.01]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
                  <MdOutlineChatBubbleOutline className="h-7 w-7" />
                </div>
                <h4 className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
                  Ningún caso seleccionado
                </h4>
                <p className="mt-1 max-w-xs text-xs text-gray-400 dark:text-white/50">
                  Selecciona una incidencia de la lista izquierda para consultar el expediente, historial y redactar la respuesta oficial.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-charcoal">
                {/* Header del Caso */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4 dark:border-white/10">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-black text-navy-700 dark:text-white">
                      {pestana === "publico" ? seleccionado.asunto : seleccionado.titulo}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-white/50">
                      Código: <span className="font-mono">{seleccionado.ticketCodigo || seleccionado.id?.slice(0, 16)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold ${getPrioridadStyle(seleccionado.prioridad).badge}`}>
                      {getPrioridadStyle(seleccionado.prioridad).label}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${pestana === "publico" ? getEstadoPublicoStyle(seleccionado.estado).badge : getEstadoTicketStyle(seleccionado.estado).badge}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                      {pestana === "publico" ? getEstadoPublicoStyle(seleccionado.estado).label : getEstadoTicketStyle(seleccionado.estado).label}
                    </span>
                  </div>
                </div>

                {/* Cuadrícula de Metadatos del Solicitante */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <MetaCard
                    icon={MdPerson}
                    label="Solicitante"
                    value={
                      pestana === "publico"
                        ? seleccionado.nombre
                        : `${seleccionado.creadoPorNombre} (${etiquetaRol(seleccionado.creadoPorRol)})`
                    }
                  />
                  <MetaCard
                    icon={MdMailOutline}
                    label="Correo Electrónico"
                    value={seleccionado.correo || seleccionado.creadoPorCorreo || "—"}
                    copyable={Boolean(seleccionado.correo || seleccionado.creadoPorCorreo)}
                    copied={copiadoCorreo}
                    onCopy={() => handleCopy(seleccionado.correo || seleccionado.creadoPorCorreo, "correo")}
                  />
                  {(seleccionado.telefono || seleccionado.creadoPorTelefono) && (
                    <MetaCard
                      icon={MdPhone}
                      label="Teléfono Directo"
                      value={seleccionado.telefono || seleccionado.creadoPorTelefono}
                      copyable={true}
                      copied={copiadoTel}
                      onCopy={() => handleCopy(seleccionado.telefono || seleccionado.creadoPorTelefono, "tel")}
                    />
                  )}
                  <MetaCard
                    icon={MdBusiness}
                    label="Organización"
                    value={seleccionado.empresa || seleccionado.empresaNombre || "Sin empresa vinculada"}
                  />
                  <MetaCard
                    icon={MdOutlineCategory}
                    label="Categoría"
                    value={seleccionado.categoria || "General"}
                  />
                  <MetaCard
                    icon={MdOutlineHistory}
                    label="Fecha de Registro"
                    value={formatoFechaHora(seleccionado.createdAt)}
                  />
                </div>

                {/* Mensaje / Descripción Original */}
                <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 dark:border-white/5 dark:bg-white/[0.02]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                    Descripción del Caso
                  </p>
                  <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-navy-700 dark:text-white/90">
                    {pestana === "publico" ? seleccionado.mensaje : seleccionado.descripcion || "Sin descripción proporcionada."}
                  </p>
                </div>

                {/* Hilo de Respuestas o Última Respuesta */}
                {pestana === "publico" ? (
                  seleccionado.respuestaSoporte ? (
                    <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 dark:border-purple-400/20 dark:bg-purple-400/10">
                      <div className="flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-300">
                        <span>Última Respuesta Enviada por Correo</span>
                        <span>{formatoFechaHora(seleccionado.updatedAt)}</span>
                      </div>
                      <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-purple-950 dark:text-purple-200">
                        {seleccionado.respuestaSoporte}
                      </p>
                    </div>
                  ) : null
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                      Hilo de Conversación ({hilo.length})
                    </p>
                    <div className="flex max-h-52 flex-col gap-2 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50/40 p-3 dark:border-white/5 dark:bg-white/[0.01]">
                      {hilo.length === 0 ? (
                        <p className="py-4 text-center text-xs text-gray-400">Sin mensajes adicionales en el hilo.</p>
                      ) : (
                        hilo.map((msg: any) => (
                          <div
                            key={msg.id}
                            className="rounded-xl border border-gray-100 bg-white p-3 shadow-2xs dark:border-white/5 dark:bg-charcoal-light"
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-navy-700 dark:text-white">
                              <span>{msg.autorNombre}</span>
                              <span className="text-[11px] font-normal text-gray-400">{formatoFechaHora(msg.createdAt)}</span>
                            </div>
                            <p className="mt-1 text-xs text-gray-600 dark:text-white/80">{msg.texto}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Formulario de Respuesta */}
                <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
                  <textarea
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    rows={3}
                    placeholder={
                      pestana === "publico"
                        ? "Escribe la respuesta oficial que se enviará por correo electrónico al solicitante..."
                        : "Escribe una respuesta para añadir al hilo del ticket de soporte..."
                    }
                    className="w-full rounded-2xl border border-gray-200/80 bg-white/90 p-3.5 text-xs sm:text-sm font-medium text-navy-700 shadow-xs outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <select
                        value={nuevoEstado}
                        onChange={(e) => setNuevoEstado(e.target.value)}
                        className="h-9 rounded-xl border border-gray-200/80 bg-white px-3 text-xs font-bold text-navy-700 shadow-xs outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                      >
                        <option value="">Mantener estado actual</option>
                        {(pestana === "publico" ? ESTADOS_PUBLICO : ESTADOS_TICKET).map((op) => (
                          <option key={op.value} value={op.value}>
                            Cambiar a: {op.label}
                          </option>
                        ))}
                      </select>

                      {pestana === "publico" && (
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-white/70 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={incluirLinkRecuperacion}
                            onChange={(e) => setIncluirLinkRecuperacion(e.target.checked)}
                            className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                          />
                          <MdVpnKey className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span>Incluir link de recuperación</span>
                        </label>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={enviarRespuesta}
                      disabled={enviandoRespuesta || !respuesta.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-brand-500/25 transition hover:bg-brand-600 active:scale-95 disabled:opacity-50"
                    >
                      <MdSend className="h-4 w-4" />
                      <span>
                        {enviandoRespuesta
                          ? "Enviando..."
                          : pestana === "publico"
                          ? "Responder por Correo"
                          : "Enviar al Hilo"}
                      </span>
                    </button>
                  </div>

                  {avisoRespuesta && (
                    <div
                      className={`mt-1 rounded-xl p-3 text-xs font-semibold ${
                        avisoRespuesta.tipo === "ok"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
                          : "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300"
                      }`}
                    >
                      {avisoRespuesta.texto}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </NexxusCard>

      {/* --- Formulario de Nueva Sesión de Soporte Remoto (Impersonación) --- */}
      <div id="sesion-soporte">
        <NexxusCard extra="p-6" delay={200}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-gray-100 pb-4 dark:border-white/10">
            <div>
              <h3 className="text-base sm:text-lg font-black text-navy-700 dark:text-white flex items-center gap-2">
                <MdLock className="h-5 w-5 text-brand-500" />
                Iniciar Nueva Sesión de Soporte Remoto
              </h3>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-white/50">
                Acceso temporal auditado para soporte de segundo nivel e inspección de anomalías en empresas clientes.
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
              Protocolo Cifrado
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={empresaSeleccionada}
              onChange={(e) => setEmpresaSeleccionada(e.target.value)}
              className="h-11 flex-1 rounded-xl border border-gray-200/80 bg-white/80 px-4 text-xs sm:text-sm font-medium text-navy-700 shadow-xs outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
            >
              <option value="">Selecciona la empresa cliente a asistir...</option>
              {empresas.map((empresa: any) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre} {empresa.codigo ? `(${empresa.codigo})` : ""}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={iniciarSesionSoporte}
              disabled={!empresaSeleccionada || iniciandoSesion}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-navy-700 px-5 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-navy-800 active:scale-95 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600"
            >
              <MdLock className="h-4 w-4" />
              <span>{iniciandoSesion ? "Iniciando sesión segura..." : "Iniciar Sesión de Soporte"}</span>
            </button>
          </div>
        </NexxusCard>
      </div>

      {/* --- Tabla de Sesiones de Soporte Activas --- */}
      <NexxusCard extra="p-6 overflow-hidden" delay={220}>
        <div className="border-b border-gray-100 pb-4 dark:border-white/10">
          <h3 className="text-base sm:text-lg font-black text-navy-700 dark:text-white">
            Sesiones de Asistencia & Trazabilidad
          </h3>
          <p className="mt-0.5 text-xs text-gray-400 dark:text-white/50">
            Registro forense de accesos remotos y sesiones activas en la plataforma
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          {cargandoSesiones ? (
            <div className="py-12 text-center text-xs text-gray-400">Sincronizando sesiones de soporte...</div>
          ) : sesiones.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">No hay sesiones de soporte registradas.</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:border-white/10 dark:text-white/40">
                  <th className="pb-3 pl-2">Empresa</th>
                  <th className="pb-3 px-3">Usuario Objetivo</th>
                  <th className="pb-3 px-3">Rol</th>
                  <th className="pb-3 px-3">Iniciada Por</th>
                  <th className="pb-3 px-3">Estado</th>
                  <th className="pb-3 px-3">Creada</th>
                  <th className="pb-3 pr-2">Expira</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                {sesiones.map((sesion) => {
                  const empInfo = empresasPorId.get(sesion.empresaId);
                  const empNombre = empInfo?.nombre || sesion.empresaId || "—";
                  const esActiva = sesion.status === "active";

                  return (
                    <tr key={sesion.id} className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-3">
                          <Avatar name={empNombre} size={8} />
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-navy-700 dark:text-white">{empNombre}</p>
                            <p className="text-[11px] text-gray-400">ID: {sesion.empresaId?.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-navy-700 dark:text-white">
                        {sesion.targetEmail || "—"}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-white/10 dark:text-white/70">
                          {sesion.targetRole ? etiquetaRol(sesion.targetRole) : "—"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-gray-600 dark:text-white/80">
                        {sesion.actorName || "Super Admin"}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            esActiva
                              ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                              : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${esActiva ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                          {esActiva ? "Activa" : "Cerrada"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-xs text-gray-500 dark:text-white/60">
                        {formatoFechaHora(sesion.createdAt)}
                      </td>
                      <td className="py-3.5 pr-2 text-xs text-gray-500 dark:text-white/60">
                        {formatoFechaHora(sesion.expiresAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </NexxusCard>
    </div>
  );
}
