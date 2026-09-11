import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MdOutlineArrowForward,
  MdOutlineCheckCircle,
  MdOutlineWarningAmber,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import TrendChart from "views/nexxus/components/TrendChart";
import Avatar from "components/nexxus/Avatar";

import { useAuth } from "context/AuthContext";
import { supabase } from "supabaseClient/supabaseConfig";
import {
  subscribeEmpleados,
  subscribeTareas,
  subscribeCheckIns,
  subscribeAuditLogs,
  subscribeSolicitudesAusencia,
  subscribeSolicitudesInternas,
  subscribeSolicitudesExtensionTarea,
  subscribeNotificaciones,
  subscribeAsistenciasHoy,
  subscribeFeedbacks,
  subscribeInboxUnificado,
  subscribeDocumentos,
  subscribePayments,
} from "services/adminRepository";
import { formatoFecha } from "services/saFormat";
import { summarizeTeamCheckIns, teamCareStats } from "services/checkInAnalytics";
import { routeUrl } from "utils/routePath";

const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const hoyISO = () => new Date().toISOString().slice(0, 10);

// Helpers para evaluar estados reales de forma robusta
const esTareaCompletada = (t: any) => {
  const st = String(t.estado || "").toLowerCase().trim();
  return (
    st === "completada" ||
    st === "completado" ||
    st === "terminada" ||
    st === "finalizada" ||
    st === "done" ||
    t.completada === true ||
    t.completado === true
  );
};

const esTareaEnProgreso = (t: any) => {
  const st = String(t.estado || "").toLowerCase().trim();
  return st === "en_progreso" || st === "en progreso" || st === "progreso" || st === "in_progress";
};

const esTareaPendiente = (t: any) => {
  const st = String(t.estado || "").toLowerCase().trim();
  return (
    st === "pendiente" ||
    st === "todo" ||
    st === "abierta" ||
    (!esTareaCompletada(t) && !esTareaEnProgreso(t))
  );
};

const esTareaVencida = (t: any) => {
  if (esTareaCompletada(t)) return false;
  const fecha = t.fechaLimite || t.fecha_limite || t.fecha_vencimiento || t.fecha_entrega || t.dueDate;
  if (!fecha) return false;
  return new Date(fecha).getTime() < Date.now();
};

const esSolicitudPendiente = (s: any) => {
  const st = String(s.estado || "").toLowerCase().trim();
  return (
    st === "pendiente" ||
    st === "pendiente_aprobacion" ||
    st === "en_revision" ||
    st === "solicitada" ||
    st === "pending"
  );
};

const ACTION_TITLES: Record<string, string> = {
  // Solicitudes
  resolucion_solicitud_ausencia: "Resolución de solicitud de ausencia",
  resolucion_de_solicitud_ausencia: "Resolución de solicitud de ausencia",
  resolucion_solicitud_interna: "Resolución de solicitud interna",
  resolucion_de_solicitud_interna: "Resolución de solicitud interna",
  resolucion_solicitud_extension: "Resolución de extensión de tarea",
  resolucion_de_solicitud_extension: "Resolución de extensión de tarea",
  solicitud_ausencia_creada: "Nueva solicitud de ausencia",
  solicitud_interna_creada: "Nueva solicitud interna",
  solicitud_extension_creada: "Nueva solicitud de extensión",
  solicitud_ausencia: "Solicitud de ausencia",
  solicitud_interna: "Solicitud interna",
  solicitud_extension: "Solicitud de extensión",

  // IA
  consulta_ia: "Consulta IA Nexxus",
  consulta_ia_nexxus: "Consulta IA Nexxus",
  consulta_nexxus_ia: "Consulta IA Nexxus",
  interaccion_asistente: "Interacción con Nexxus IA",
  asistente_ia: "Consulta en Asistente IA",

  // Documentos
  subida_documento: "Subida de documento corporativo",
  documento_subido: "Documento corporativo subido",
  eliminacion_documento: "Eliminación de documento",
  descarga_documento: "Descarga de documento",
  documento_compartido: "Documento compartido",

  // Plantilla / Usuarios
  creacion_usuario: "Registro de nuevo colaborador",
  usuario_creado: "Colaborador registrado",
  edicion_usuario: "Actualización de colaborador",
  usuario_actualizado: "Colaborador actualizado",
  baja_usuario: "Baja de colaborador",
  usuario_eliminado: "Colaborador eliminado",

  // Asistencia & Check-in
  checkin: "Registro de check-in emocional",
  check_in: "Registro de check-in emocional",
  entrada_marcada: "Marcación de entrada",
  salida_marcada: "Marcación de salida",
  asistencia_registrada: "Marcación de jornada",

  // Tareas
  tarea_creada: "Creación de tarea",
  tarea_completada: "Tarea completada",
  tarea_actualizada: "Actualización de tarea",

  // Auth & Configuración
  login: "Inicio de sesión",
  logout: "Cierre de sesión",
  cambio_password: "Cambio de contraseña",
  actualizacion_perfil: "Actualización de perfil",
  configuracion_actualizada: "Configuración actualizada",
};

const MODULE_STYLES: Record<string, { label: string; badge: string }> = {
  ia: {
    label: "IA Nexxus",
    badge: "bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300 border border-purple-500/15",
  },
  solicitudes: {
    label: "Solicitudes",
    badge: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300 border border-blue-500/15",
  },
  documentos: {
    label: "Documentos",
    badge: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-500/15",
  },
  usuarios: {
    label: "Usuarios",
    badge: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-300 border border-indigo-500/15",
  },
  plantilla: {
    label: "Plantilla",
    badge: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-300 border border-indigo-500/15",
  },
  asistencia: {
    label: "Asistencia",
    badge: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-500/15",
  },
  nomina: {
    label: "Nómina",
    badge: "bg-teal-500/10 text-teal-600 dark:bg-teal-400/20 dark:text-teal-300 border border-teal-500/15",
  },
  seguridad: {
    label: "Seguridad",
    badge: "bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300 border border-rose-500/15",
  },
  auth: {
    label: "Seguridad",
    badge: "bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300 border border-rose-500/15",
  },
};

function resolveModuleStyle(moduloRaw: string) {
  const key = (moduloRaw || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (MODULE_STYLES[key]) return MODULE_STYLES[key];
  if (key.includes("ia") || key.includes("ai")) return MODULE_STYLES.ia;
  if (key.includes("solicitud")) return MODULE_STYLES.solicitudes;
  if (key.includes("doc")) return MODULE_STYLES.documentos;
  if (key.includes("plantilla") || key.includes("usuario") || key.includes("empleado")) return MODULE_STYLES.usuarios;
  if (key.includes("asistencia") || key.includes("jornada")) return MODULE_STYLES.asistencia;
  if (key.includes("nom")) return MODULE_STYLES.nomina;
  if (key.includes("seg") || key.includes("auth") || key.includes("login")) return MODULE_STYLES.seguridad;

  return {
    label: moduloRaw || "Sistema",
    badge: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70 border border-gray-200/50 dark:border-white/10",
  };
}

function formatearAccionAudit(str: string): string {
  if (!str) return "Operación registrada";
  const normalizedKey = str.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (ACTION_TITLES[normalizedKey]) return ACTION_TITLES[normalizedKey];

  // Clean underscores & dashes
  let cleaned = str.replace(/[_-]+/g, " ").trim();
  // Sentence case: Capitalize first letter, keep rest lowercase
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  // Restore acronyms / proper nouns
  cleaned = cleaned
    .replace(/\bia\b/gi, "IA")
    .replace(/\bnexxus\b/gi, "Nexxus")
    .replace(/\brrhh\b/gi, "RRHH")
    .replace(/\bpdf\b/gi, "PDF")
    .replace(/\bdni\b/gi, "DNI")
    .replace(/\bapi\b/gi, "API");
  return cleaned;
}

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const { empresaId, empresaNombre } = useAuth();
  const [error, setError] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState("todos");
  const [resolviendoId, setResolviendoId] = useState<string | null>(null);

  const [empleados, setEmpleados] = useState<any[] | null>(null);
  const [tareas, setTareas] = useState<any[]>([]);
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [auditoria, setAuditoria] = useState<any[]>([]);
  const [ausencias, setAusencias] = useState<any[]>([]);
  const [internas, setInternas] = useState<any[]>([]);
  const [extensiones, setExtensiones] = useState<any[]>([]);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [asistenciasHoy, setAsistenciasHoy] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [inbox, setInbox] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (!empresaId) return;
    const onErr = (err: any) => setError(err.message || "No se pudo conectar con el servidor.");
    const unsubs = [
      subscribeEmpleados(empresaId, (docs) => setEmpleados(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeTareas(empresaId, (docs) => setTareas(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeCheckIns(empresaId, (docs) => setCheckIns(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeAuditLogs(empresaId, (docs) => setAuditoria(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeSolicitudesAusencia(empresaId, (docs) => setAusencias(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeSolicitudesInternas(empresaId, (docs) => setInternas(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeSolicitudesExtensionTarea(empresaId, (docs) => setExtensiones(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeNotificaciones(empresaId, (docs) => setNotificaciones(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeAsistenciasHoy(empresaId, hoyISO(), (docs) => setAsistenciasHoy(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeFeedbacks(empresaId, (docs) => setFeedbacks(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeInboxUnificado(empresaId, (docs) => setInbox(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeDocumentos(empresaId, (docs) => setDocumentos(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribePayments(empresaId, (docs) => setPayments(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [empresaId]);

  // Resumen y estadísticas reales de Bienestar / Salud del equipo
  const teamSummaries = useMemo(
    () => summarizeTeamCheckIns(checkIns, empleados || []),
    [checkIns, empleados]
  );
  const teamStats = useMemo(() => teamCareStats(teamSummaries), [teamSummaries]);

  const metricas = useMemo(() => {
    const lista = empleados || [];
    const activos = lista.filter(
      (u) => u.activo !== false && u.estado_activo !== false && u.eliminado !== true && u.baneado !== true
    );
    const inactivos = lista.length - activos.length;

    // Métricas de Tareas reales
    const tareasCompletadas = tareas.filter(esTareaCompletada).length;
    const tareasProgreso = tareas.filter(esTareaEnProgreso).length;
    const tareasPendientes = tareas.filter(esTareaPendiente).length;
    const tareasVencidas = tareas.filter(esTareaVencida).length;
    const totalTareas = tareas.length;
    const productividad = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

    // Asistencia de la jornada
    const hoy = hoyISO();
    const asistenciasDelDia = asistenciasHoy.filter(
      (a) => (a.fecha || a.created_at || "").slice(0, 10) === hoy
    );
    const entradasHoy = asistenciasDelDia.filter(
      (a) => a.tipo === "entrada" || a.tipo === "ingreso" || Boolean(a.hora_entrada || a.entrada)
    ).length;
    const salidasHoy = asistenciasDelDia.filter(
      (a) => a.tipo === "salida" || a.tipo === "egreso" || Boolean(a.hora_salida || a.salida)
    ).length;
    const retrasos = asistenciasDelDia.filter(
      (a) => a.tarde === true || a.retraso === true || a.es_tarde === true
    ).length;
    const horasExtra = asistenciasDelDia.reduce((sum, a) => sum + (a.horas_extra || 0), 0);

    // Check-ins hoy
    const checkInsHoy = checkIns.filter(
      (c) => (c.created_at || c.fecha || "").slice(0, 10) === hoy
    ).length;
    const participacion = activos.length > 0 ? Math.round((checkInsHoy / activos.length) * 100) : 0;

    // Métricas reales de Bienestar calculadas sobre el pulso real de cada empleado
    const bienestar = teamStats.avgPulse;
    const enRiesgo = teamStats.atRiskCount;
    const enRiesgoPorcentaje = teamStats.atRiskPercent;
    const estresPromedio = teamStats.avgStress;

    // Auditoría & Solicitudes
    const alertas = auditoria.filter((a) => (a.created_at || "").slice(0, 10) === hoy).length;
    const ausenciasPendientes = ausencias.filter(esSolicitudPendiente).length;
    const internasPendientes = internas.filter(esSolicitudPendiente).length;
    const extensionesPendientes = extensiones.filter(esSolicitudPendiente).length;
    const aprobacionesPendientes = ausenciasPendientes + internasPendientes + extensionesPendientes;

    // Documentos & Feedbacks
    const documentosPendientes = documentos.filter((d) => d.leido === false || d.leido === undefined).length;
    const notificacionesNoLeidas = notificaciones.filter((n) => !n.leido && !n.leida).length;
    const incidenciasAbiertas = feedbacks.filter(
      (f) =>
        (f.categoria === "problema" || f.categoria === "dificultad" || f.tipo === "incidencia") &&
        f.datos?.estado !== "resuelto" &&
        f.estado !== "resuelto"
    ).length;
    const inboxCritico = inbox.filter(
      (i) => i.prioridad === "urgente" || i.prioridad === "alta" || i.critico === true || i.urgente === true
    ).length;

    return {
      totalEmpleados: lista.length,
      activos: activos.length,
      inactivos,
      tareasPendientes,
      tareasProgreso,
      tareasCompletadas,
      tareasVencidas,
      totalTareas,
      productividad,
      checkInsHoy,
      participacion,
      entradasHoy,
      salidasHoy,
      retrasos,
      horasExtra,
      bienestar,
      enRiesgo,
      enRiesgoPorcentaje,
      estresPromedio,
      alertas,
      ausenciasPendientes,
      internasPendientes,
      extensionesPendientes,
      aprobacionesPendientes,
      documentosPendientes,
      notificacionesNoLeidas,
      incidenciasAbiertas,
      inboxCritico,
    };
  }, [
    empleados,
    tareas,
    checkIns,
    asistenciasHoy,
    auditoria,
    ausencias,
    internas,
    extensiones,
    documentos,
    notificaciones,
    feedbacks,
    inbox,
    teamStats,
  ]);

  // Serie de los ultimos 8 dias para el grafico de rendimiento real
  const serieDiaria = useMemo(() => {
    const dias = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dias.push({ key, label: DIAS_CORTOS[d.getDay()] });
    }
    const rendimiento = dias.map(
      ({ key }) =>
        tareas.filter(
          (t) =>
            esTareaCompletada(t) &&
            String(t.fechaCompletada || t.fecha_completada || t.updated_at || t.updatedAt || t.created_at || "").slice(0, 10) === key
        ).length
    );
    return { categorias: dias.map((d) => d.label), rendimiento };
  }, [tareas]);

  const empleadosPorId = useMemo(() => {
    const map = new Map();
    (empleados || []).forEach((u) => map.set(u.id, u));
    return map;
  }, [empleados]);

  // Solicitudes prioritarias unificadas
  const solicitudesPendientes = useMemo(() => {
    const merged = [
      ...ausencias
        .filter(esSolicitudPendiente)
        .map((a) => ({
          ...a,
          tipoItem: "Ausencia",
          detalle: a.tipo || a.motivo || "Permiso solicitado",
          fechaRef: a.fecha_solicitud || a.created_at,
        })),
      ...internas
        .filter(esSolicitudPendiente)
        .map((s) => ({
          ...s,
          tipoItem: "Solicitud Interna",
          detalle: s.titulo || s.tipo || "Solicitud general",
          fechaRef: s.created_at,
        })),
      ...extensiones
        .filter(esSolicitudPendiente)
        .map((s) => ({
          ...s,
          tipoItem: "Extensión de Tarea",
          detalle: s.tarea_titulo || "Extensión solicitada",
          fechaRef: s.created_at,
        })),
    ];
    return merged
      .sort((a, b) => (b.fechaRef || "").localeCompare(a.fechaRef || ""))
      .slice(0, 5);
  }, [ausencias, internas, extensiones]);

  const resolverExtension = async (solicitud: any, aprobar: boolean) => {
    setResolviendoId(solicitud.id);
    try {
      const { error: resolveError } = await supabase.rpc("resolver_solicitud_extension_tarea", {
        p_solicitud_id: solicitud.id,
        p_aprobar: aprobar,
        p_observacion: null,
      });
      if (resolveError) {
        setError("No se pudo resolver la extensión. Inténtalo de nuevo.");
      }
    } catch {
      setError("Error de comunicación al resolver la solicitud.");
    } finally {
      setResolviendoId(null);
    }
  };

  const empleadosSinCheckIn = useMemo(() => {
    const hoy = hoyISO();
    const conCheckIn = new Set(
      checkIns.filter((c) => (c.created_at || c.fecha || "").slice(0, 10) === hoy).map((c) => c.usuario_id || c.userId)
    );
    return (empleados || [])
      .filter((u) => u.activo !== false && u.estado_activo !== false && !conCheckIn.has(u.id))
      .slice(0, 6);
  }, [empleados, checkIns]);

  // Feed de auditoría filtrable con información enriquecida y limpia
  const actividadReciente = useMemo(() => {
    return auditoria
      .filter((a) => {
        if (moduloFiltro === "todos") return true;
        const mod = (a.modulo || "").toLowerCase();
        if (moduloFiltro === "usuarios") {
          return mod.includes("usuario") || mod.includes("plantilla") || mod.includes("empleado");
        }
        if (moduloFiltro === "ia") {
          return mod.includes("ia") || mod.includes("ai");
        }
        if (moduloFiltro === "solicitudes") {
          return mod.includes("solicitud");
        }
        if (moduloFiltro === "documentos") {
          return mod.includes("doc");
        }
        return mod.includes(moduloFiltro);
      })
      .slice(0, 7)
      .map((a) => {
        const actor = empleadosPorId.get(a.actor_id);
        const modStyle = resolveModuleStyle(a.modulo);
        return {
          id: a.id || `${a.created_at}-${a.accion}`,
          accion: formatearAccionAudit(a.accion),
          modulo: modStyle.label,
          badgeClass: modStyle.badge,
          actorNombre: actor?.nombre || a.actor_email || "Usuario del sistema",
          actorFoto: actor?.foto_url || actor?.avatar_url || null,
          fecha: formatoFecha(a.created_at),
        };
      });
  }, [auditoria, moduloFiltro, empleadosPorId]);

  if (!empresaId) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white p-6 shadow-3xl shadow-shadow-500 dark:bg-charcoal dark:border dark:border-charcoal-border">
        <p className="text-base font-semibold text-gray-600 dark:text-white/70">
          Tu cuenta no tiene una empresa asociada actualmente.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Banner de error si surge */}
      {error && (
        <div className="flex items-center justify-between rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
          <div className="flex items-center gap-2">
            <MdOutlineWarningAmber className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-xs font-bold uppercase tracking-wider hover:underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {empleados === null ? (
        <div className="flex h-96 w-full flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500 dark:text-white/60">
            Sincronizando métricas en vivo de la empresa...
          </p>
        </div>
      ) : (
        <>
          {/* Header Superior completamente limpio */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-navy-700 sm:text-3xl dark:text-white">
                Panorama General
              </h2>
              <p className="mt-1 text-xs sm:text-sm font-medium text-gray-400 dark:text-white/50">
                Resumen operativo · {empresaNombre || "Empresa"}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate(routeUrl("/admin", "empresa-plantilla"))}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white px-4 py-2 text-xs font-bold text-navy-700 shadow-xs transition duration-150 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
              >
                <span>Gestionar Plantilla</span>
              </button>
              <button
                type="button"
                onClick={() => navigate(routeUrl("/admin", "empresa-cuidado-equipo"))}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-brand-500/25 transition duration-150 hover:bg-brand-600 active:scale-[0.98]"
              >
                <span>Panel Bienestar</span>
              </button>
            </div>
          </div>

          {/* Bloque Hero & Stack Lateral de 3 Cards (Estructura de Referencia) */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
            {/* Left Hero Card: Productividad & Tareas (7 columnas en desktop) */}
            <div className="lg:col-span-7 flex flex-col">
              <NexxusCard
                extra="p-6 h-full flex flex-col justify-between transition-all duration-200 hover:shadow-md"
                delay={50}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                      Productividad
                    </p>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                      {metricas.productividad}% completitud
                    </span>
                  </div>

                  {/* Número Principal Gigante */}
                  <div className="mt-3">
                    <h3 className="text-4xl sm:text-5xl font-black tracking-tight text-navy-700 dark:text-white">
                      {metricas.productividad}%
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm font-medium text-gray-500 dark:text-white/60">
                      {metricas.tareasCompletadas} tareas hechas de {metricas.totalTareas} totales
                    </p>
                  </div>

                  {/* Barra de progreso de distribución proporcional */}
                  <div className="mt-5">
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                      {metricas.totalTareas > 0 ? (
                        <>
                          <div
                            title={`Completadas: ${metricas.tareasCompletadas} (${Math.round((metricas.tareasCompletadas / metricas.totalTareas) * 100)}%)`}
                            className="bg-emerald-500 transition-all duration-500"
                            style={{ width: `${(metricas.tareasCompletadas / metricas.totalTareas) * 100}%` }}
                          />
                          <div
                            title={`En curso: ${metricas.tareasProgreso} (${Math.round((metricas.tareasProgreso / metricas.totalTareas) * 100)}%)`}
                            className="bg-brand-500 transition-all duration-500"
                            style={{ width: `${(metricas.tareasProgreso / metricas.totalTareas) * 100}%` }}
                          />
                          <div
                            title={`Pendientes: ${metricas.tareasPendientes} (${Math.round((metricas.tareasPendientes / metricas.totalTareas) * 100)}%)`}
                            className="bg-amber-400 transition-all duration-500"
                            style={{ width: `${(metricas.tareasPendientes / metricas.totalTareas) * 100}%` }}
                          />
                          <div
                            title={`Vencidas: ${metricas.tareasVencidas} (${Math.round((metricas.tareasVencidas / metricas.totalTareas) * 100)}%)`}
                            className="bg-rose-500 transition-all duration-500"
                            style={{ width: `${(metricas.tareasVencidas / metricas.totalTareas) * 100}%` }}
                          />
                        </>
                      ) : (
                        <div className="w-full bg-gray-200 dark:bg-white/10" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Desglose con identificación exacta de cada color y su dato */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Completadas</p>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-lg sm:text-xl font-black text-navy-700 dark:text-white">
                        {metricas.tareasCompletadas}
                      </span>
                      <span className="text-[11px] font-medium text-gray-400 dark:text-white/40">
                        ({metricas.totalTareas > 0 ? Math.round((metricas.tareasCompletadas / metricas.totalTareas) * 100) : 0}%)
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                      <p className="text-xs font-semibold text-gray-400 dark:text-white/50">En curso</p>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-lg sm:text-xl font-black text-navy-700 dark:text-white">
                        {metricas.tareasProgreso}
                      </span>
                      <span className="text-[11px] font-medium text-gray-400 dark:text-white/40">
                        ({metricas.totalTareas > 0 ? Math.round((metricas.tareasProgreso / metricas.totalTareas) * 100) : 0}%)
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                      <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Pendientes</p>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-lg sm:text-xl font-black text-navy-700 dark:text-white">
                        {metricas.tareasPendientes}
                      </span>
                      <span className="text-[11px] font-medium text-gray-400 dark:text-white/40">
                        ({metricas.totalTareas > 0 ? Math.round((metricas.tareasPendientes / metricas.totalTareas) * 100) : 0}%)
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                      <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Vencidas</p>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className={`text-lg sm:text-xl font-black ${metricas.tareasVencidas > 0 ? "text-rose-600 dark:text-rose-400" : "text-navy-700 dark:text-white"}`}>
                        {metricas.tareasVencidas}
                      </span>
                      <span className="text-[11px] font-medium text-gray-400 dark:text-white/40">
                        ({metricas.totalTareas > 0 ? Math.round((metricas.tareasVencidas / metricas.totalTareas) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              </NexxusCard>
            </div>

            {/* Right Column: Stack de 3 Cards Métricas Limpias (5 columnas en desktop) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Stat Card 1: Equipo & Plantilla */}
              <NexxusCard
                extra="p-5 flex-1 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                delay={100}
                onClick={() => navigate(routeUrl("/admin", "empresa-plantilla"))}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                    Equipo & Plantilla
                  </p>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {metricas.entradasHoy} presentes
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {metricas.activos}
                  </h4>
                  <span className="text-xs text-gray-400 dark:text-white/40">
                    {metricas.inactivos} inactivos
                  </span>
                </div>
              </NexxusCard>

              {/* Stat Card 2: Índice de Bienestar */}
              <NexxusCard
                extra="p-5 flex-1 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                delay={130}
                onClick={() => navigate(routeUrl("/admin", "empresa-cuidado-equipo"))}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                    Índice de Bienestar
                  </p>
                  <span
                    className={`text-xs font-bold ${
                      metricas.enRiesgo > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {metricas.enRiesgo > 0 ? `${metricas.enRiesgo} en riesgo` : "Clima óptimo"}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {metricas.bienestar > 0 ? `${metricas.bienestar}%` : "—"}
                  </h4>
                  <span className="text-xs text-gray-400 dark:text-white/40">
                    {metricas.checkInsHoy} check-ins hoy
                  </span>
                </div>
              </NexxusCard>

              {/* Stat Card 3: Aprobaciones Pendientes */}
              <NexxusCard
                extra="p-5 flex-1 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                delay={160}
                onClick={() => navigate(routeUrl("/admin", "empresa-solicitudes"))}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                    Aprobaciones Pendientes
                  </p>
                  <span className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1">
                    Resolver <MdOutlineArrowForward className="h-3 w-3" />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {metricas.aprobacionesPendientes}
                  </h4>
                  <span className="text-xs text-gray-400 dark:text-white/40">
                    {metricas.ausenciasPendientes} ausencias
                  </span>
                </div>
              </NexxusCard>
            </div>
          </div>

          {/* Barra de Telemetría Operativa Continua (Sin iconos, números destacados) */}
          <NexxusCard extra="p-0 overflow-hidden shadow-xs" delay={180}>
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-white/[0.08]">
              {/* Telemetría 1: Jornada */}
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Jornada de Hoy</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {metricas.entradasHoy}
                  </span>
                  <span className="text-xs font-medium text-gray-500 dark:text-white/60">
                    entradas / {metricas.salidasHoy} salidas
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
                  {metricas.retrasos > 0 ? `${metricas.retrasos} retrasos registrados` : "Sin retrasos"}
                </p>
              </div>

              {/* Telemetría 2: Documentos */}
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Documentación</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {metricas.documentosPendientes}
                  </span>
                  <span className="text-xs font-medium text-gray-500 dark:text-white/60">
                    pendientes
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
                  {metricas.notificacionesNoLeidas} avisos sin leer
                </p>
              </div>

              {/* Telemetría 3: Auditoría */}
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Auditoría & Logs</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {metricas.alertas}
                  </span>
                  <span className="text-xs font-medium text-gray-500 dark:text-white/60">
                    eventos hoy
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
                  Trazabilidad del sistema
                </p>
              </div>

              {/* Telemetría 4: Incidencias */}
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Incidencias</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {metricas.incidenciasAbiertas}
                  </span>
                  <span className="text-xs font-medium text-gray-500 dark:text-white/60">
                    abiertas
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
                  {metricas.inboxCritico > 0 ? `${metricas.inboxCritico} críticas` : "Sin incidencias críticas"}
                </p>
              </div>
            </div>
          </NexxusCard>

          {/* Sección Media: Gráfico de Tendencias (2/3) + Solicitudes Prioritarias (1/3) */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 items-stretch">
            {/* Gráfico de rendimiento semanal (2 columnas de 3) */}
            <div className="xl:col-span-2 flex flex-col h-full">
              <TrendChart
                title="Rendimiento de Tareas (Últimos 8 días)"
                total={`${metricas.tareasCompletadas} completadas`}
                change={`${metricas.tareasPendientes + metricas.tareasProgreso} en curso`}
                series={[
                  {
                    name: "Tareas completadas",
                    data: serieDiaria.rendimiento,
                    color: "#422AFB",
                  },
                ]}
                categories={serieDiaria.categorias}
                delay={200}
              />
            </div>

            {/* Bandeja de Solicitudes Prioritarias (1 columna de 3) */}
            <div className="xl:col-span-1 flex flex-col h-full">
              <NexxusCard extra="p-6 flex flex-col justify-between h-full" delay={220}>
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 dark:border-white/10">
                    <h4 className="text-sm sm:text-base font-bold text-navy-700 dark:text-white">
                      Solicitudes Prioritarias
                    </h4>
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:bg-amber-400/20 dark:text-amber-400">
                      {solicitudesPendientes.length}
                    </span>
                  </div>

                  {solicitudesPendientes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/20 dark:text-emerald-400">
                        <MdOutlineCheckCircle className="h-6 w-6" />
                      </div>
                      <p className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
                        Todo al día
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-white/60">
                        No hay solicitudes pendientes de aprobación.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-col divide-y divide-gray-100 dark:divide-white/5">
                      {solicitudesPendientes.map((s) => {
                        const emp = empleadosPorId.get(s.usuario_id || s.userId);
                        const esResolviendo = resolviendoId === s.id;

                        return (
                          <div
                            key={s.id}
                            className="flex items-center justify-between py-3 px-1 rounded-xl transition duration-150 hover:bg-gray-50/70 dark:hover:bg-white/5"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar
                                src={emp?.foto_url}
                                name={emp?.nombre || "Empleado"}
                                size={8}
                              />
                              <div className="min-w-0">
                                <p className="truncate text-xs sm:text-sm font-semibold text-navy-700 dark:text-white">
                                  {emp?.nombre || "Colaborador"}
                                </p>
                                <p className="truncate text-[11px] text-gray-400 dark:text-white/50">
                                  {s.tipoItem} • {s.detalle}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 pl-2">
                              {s.tipoItem === "Extensión de Tarea" ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={esResolviendo}
                                    onClick={() => resolverExtension(s, false)}
                                    className="rounded-lg bg-red-500/10 px-2 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-500/20 active:scale-95 dark:text-red-300"
                                  >
                                    Rechazar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={esResolviendo}
                                    onClick={() => resolverExtension(s, true)}
                                    className="rounded-lg bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-600 transition hover:bg-emerald-500/20 active:scale-95 dark:text-emerald-300"
                                  >
                                    {esResolviendo ? "..." : "Aprobar"}
                                  </button>
                                </div>
                              ) : (
                                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-400/20 dark:text-amber-400">
                                  Pendiente
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
                  <Link
                    to={routeUrl("/admin", "empresa-solicitudes")}
                    className="flex items-center justify-center gap-1.5 text-xs font-bold text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    <span>Ver centro completo de solicitudes</span>
                    <MdOutlineArrowForward className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </NexxusCard>
            </div>
          </div>

          {/* Sección Inferior: Feed de Actividad (2/3) + Sin Check-in Hoy (1/3) */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 items-stretch">
            {/* Feed de Actividad Reciente (2 columnas de 3) */}
            <div className="xl:col-span-2 flex flex-col h-full">
              <NexxusCard extra="p-6 flex flex-col justify-between h-full" delay={240}>
                <div>
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-gray-100 pb-4 dark:border-white/10">
                    <h4 className="text-sm sm:text-base font-bold text-navy-700 dark:text-white">
                      Actividad Reciente del Sistema
                    </h4>

                    {/* Segmented Pill Filter Controls */}
                    <div className="flex flex-wrap items-center gap-1 rounded-xl bg-gray-100/80 p-1 dark:bg-white/5">
                      {[
                        { id: "todos", label: "Todos" },
                        { id: "solicitudes", label: "Solicitudes" },
                        { id: "ia", label: "IA Nexxus" },
                        { id: "documentos", label: "Documentos" },
                        { id: "usuarios", label: "Usuarios" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setModuloFiltro(tab.id)}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all duration-150 ${
                            moduloFiltro === tab.id
                              ? "bg-white text-brand-500 shadow-xs font-bold dark:bg-charcoal dark:text-white"
                              : "text-gray-500 hover:text-navy-700 dark:text-white/60 dark:hover:text-white"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {actividadReciente.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                      <p className="text-sm font-medium">No se registraron actividades en este filtro.</p>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-col gap-2.5">
                      {actividadReciente.map((item) => (
                        <div
                          key={item.id}
                          className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-100/80 bg-white/70 p-3 shadow-xs transition-all duration-200 hover:border-gray-200 hover:bg-white hover:shadow-sm dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-white/10 dark:hover:bg-white/[0.04]"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <Avatar
                              src={item.actorFoto}
                              name={item.actorNombre}
                              size={8}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-xs sm:text-sm font-bold text-navy-700 dark:text-white">
                                {item.accion}
                              </p>
                              <p className="truncate text-[11px] font-medium text-gray-400 dark:text-white/50">
                                Por <span className="font-semibold text-gray-600 dark:text-gray-300">{item.actorNombre}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 pl-2">
                            <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${item.badgeClass}`}>
                              {item.modulo}
                            </span>
                            <span className="mt-1 text-[11px] font-medium text-gray-400 dark:text-white/40">
                              {item.fecha}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </NexxusCard>
            </div>

            {/* Monitoreo de Personal sin Check-in Hoy (1 columna de 3) */}
            <div className="xl:col-span-1 flex flex-col h-full">
              <NexxusCard extra="p-6 flex flex-col justify-between h-full" delay={260}>
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 dark:border-white/10">
                    <h4 className="text-sm sm:text-base font-bold text-navy-700 dark:text-white">
                      Sin Check-in Hoy
                    </h4>
                    <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:bg-rose-400/20 dark:text-rose-400">
                      {empleadosSinCheckIn.length}
                    </span>
                  </div>

                  {empleadosSinCheckIn.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/20 dark:text-emerald-400">
                        <MdOutlineCheckCircle className="h-6 w-6" />
                      </div>
                      <p className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
                        100% Participación
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-white/60">
                        Todo el equipo activo registró su check-in hoy.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-col divide-y divide-gray-100 dark:divide-white/5">
                      {empleadosSinCheckIn.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between py-3 px-1 rounded-xl transition duration-150 hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar src={u.foto_url} name={u.nombre || "Empleado"} size={8} />
                            <div className="min-w-0">
                              <p className="truncate text-xs sm:text-sm font-semibold text-navy-700 dark:text-white">
                                {u.nombre}
                              </p>
                              <p className="truncate text-[11px] text-gray-400 dark:text-white/50">
                                {u.departamento || u.cargo || "Colaborador"}
                              </p>
                            </div>
                          </div>
                          <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" title="Check-in pendiente hoy" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
                  <Link
                    to={routeUrl("/admin", "empresa-cuidado-equipo")}
                    className="flex items-center justify-center gap-1.5 text-xs font-bold text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    <span>Ver seguimiento en Bienestar</span>
                    <MdOutlineArrowForward className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </NexxusCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
