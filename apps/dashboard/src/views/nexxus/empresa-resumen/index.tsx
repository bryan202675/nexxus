import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MdOutlinePeople,
  MdOutlineTrendingUp,
  MdOutlineFavorite,
  MdOutlineNotificationsActive,
  MdOutlineAccessTime,
  MdOutlineDescription,
  MdOutlineHistory,
  MdOutlineArrowForward,
  MdOutlineCheckCircle,
  MdOutlineHourglassEmpty,
  MdOutlineWarningAmber,
  MdOutlineFactCheck,
  MdOutlineForum,
  MdOutlineShield,
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

  // Feed de auditoría filtrable con información enriquecida
  const actividadReciente = useMemo(() => {
    return auditoria
      .filter((a) => {
        if (moduloFiltro === "todos") return true;
        return (a.modulo || "").toLowerCase().includes(moduloFiltro);
      })
      .slice(0, 7)
      .map((a) => {
        const actor = empleadosPorId.get(a.actor_id);
        return {
          id: a.id || `${a.created_at}-${a.accion}`,
          accion: a.accion || "Operación registrada",
          modulo: a.modulo || "Sistema",
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
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
                Panorama General
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-500 dark:text-white/60">
                Métricas operativas, cumplimiento de equipo y bienestar de {empresaNombre || "la empresa"}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(routeUrl("/admin", "empresa-plantilla"))}
                className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-navy-700 shadow-sm transition hover:bg-gray-50 dark:bg-charcoal dark:border dark:border-charcoal-border dark:text-white dark:hover:bg-white/5"
              >
                <MdOutlinePeople className="h-4 w-4 text-brand-500" />
                <span>Gestionar Plantilla</span>
              </button>
              <button
                type="button"
                onClick={() => navigate(routeUrl("/admin", "empresa-cuidado-equipo"))}
                className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95"
              >
                <MdOutlineFavorite className="h-4 w-4" />
                <span>Panel Bienestar</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {/* KPI 1: Capital Humano */}
            <NexxusCard
              extra="p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              onClick={() => navigate(routeUrl("/admin", "empresa-plantilla"))}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                    Equipo & Plantilla
                  </p>
                  <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                    {metricas.activos}
                    <span className="ml-1 text-sm font-semibold text-gray-500 dark:text-white/60">
                      activos
                    </span>
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
                  <MdOutlinePeople className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {metricas.entradasHoy} presentes hoy
                </span>
                <span>{metricas.inactivos} inactivos</span>
              </div>
            </NexxusCard>

            {/* KPI 2: Productividad */}
            <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                    Productividad
                  </p>
                  <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                    {metricas.productividad}%
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                  <MdOutlineTrendingUp className="h-6 w-6" />
                </div>
              </div>

              {/* Barra de progreso de productividad */}
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, metricas.productividad))}%` }}
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-white/60">
                <span>{metricas.tareasCompletadas} de {metricas.totalTareas} hechas</span>
                <span>{metricas.tareasPendientes + metricas.tareasProgreso} pendientes</span>
              </div>
            </NexxusCard>

            {/* KPI 3: Bienestar del Equipo (Métrica Real) */}
            <NexxusCard
              extra="p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              onClick={() => navigate(routeUrl("/admin", "empresa-cuidado-equipo"))}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                    Índice de Bienestar
                  </p>
                  <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                    {metricas.bienestar > 0 ? `${metricas.bienestar}%` : "—"}
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 dark:bg-rose-400/20 dark:text-rose-300">
                  <MdOutlineFavorite className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
                <span className="flex items-center gap-1">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      metricas.bienestar >= 75
                        ? "bg-emerald-500"
                        : metricas.bienestar >= 50
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                  />
                  {metricas.enRiesgo > 0 ? `${metricas.enRiesgo} en riesgo` : "Clima óptimo"}
                </span>
                <span>{metricas.checkInsHoy} check-ins hoy</span>
              </div>
            </NexxusCard>

            {/* KPI 4: Aprobaciones Pendientes */}
            <NexxusCard
              extra="p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              onClick={() => navigate(routeUrl("/admin", "empresa-solicitudes"))}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                    Aprobaciones Pendientes
                  </p>
                  <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                    {metricas.aprobacionesPendientes}
                    <span className="ml-1 text-sm font-semibold text-gray-500 dark:text-white/60">
                      solicitudes
                    </span>
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300">
                  <MdOutlineNotificationsActive className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
                <span>{metricas.ausenciasPendientes} ausencias</span>
                <span className="flex items-center gap-1 text-brand-500 font-bold hover:underline">
                  Resolver <MdOutlineArrowForward className="h-3.5 w-3.5" />
                </span>
              </div>
            </NexxusCard>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-sm transition dark:bg-charcoal dark:border dark:border-charcoal-border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
                <MdOutlineAccessTime className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-gray-500 dark:text-white/60">
                  Jornada de hoy
                </p>
                <p className="text-base font-bold text-navy-700 dark:text-white">
                  {metricas.entradasHoy} entradas <span className="font-normal text-xs text-gray-400">/ {metricas.salidasHoy} salidas</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-sm transition dark:bg-charcoal dark:border dark:border-charcoal-border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                <MdOutlineDescription className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-gray-500 dark:text-white/60">
                  Documentos por revisar
                </p>
                <p className="text-base font-bold text-navy-700 dark:text-white">
                  {metricas.documentosPendientes}{" "}
                  <span className="font-normal text-xs text-gray-400">pendientes</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-sm transition dark:bg-charcoal dark:border dark:border-charcoal-border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                <MdOutlineShield className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-gray-500 dark:text-white/60">
                  Eventos de auditoría
                </p>
                <p className="text-base font-bold text-navy-700 dark:text-white">
                  {metricas.alertas} <span className="font-normal text-xs text-gray-400">hoy</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-sm transition dark:bg-charcoal dark:border dark:border-charcoal-border">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300">
                <MdOutlineForum className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-gray-500 dark:text-white/60">
                  Incidencias / Mensajes
                </p>
                <p className="text-base font-bold text-navy-700 dark:text-white">
                  {metricas.incidenciasAbiertas}{" "}
                  <span className="font-normal text-xs text-gray-400">incidencias</span>
                </p>
              </div>
            </div>
          </div>

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
                delay={100}
              />
            </div>

            {/* Bandeja de Solicitudes Pendientes (1 columna de 3) */}
            <div className="xl:col-span-1 flex flex-col h-full">
              <NexxusCard extra="p-6 flex flex-col justify-between h-full" delay={150}>
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <MdOutlineFactCheck className="h-5 w-5 text-brand-500" />
                      <h4 className="text-base font-bold text-navy-700 dark:text-white">
                        Solicitudes Prioritarias
                      </h4>
                    </div>
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 dark:bg-amber-400/20 dark:text-amber-400">
                      {solicitudesPendientes.length}
                    </span>
                  </div>

                  {solicitudesPendientes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
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
                    <div className="mt-4 flex flex-col gap-3">
                      {solicitudesPendientes.map((s) => {
                        const emp = empleadosPorId.get(s.usuario_id || s.userId);
                        const esResolviendo = resolviendoId === s.id;

                        return (
                          <div
                            key={s.id}
                            className="flex flex-col gap-2 rounded-xl border border-gray-100 p-3 transition hover:bg-gray-50/70 dark:border-white/5 dark:hover:bg-white/5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar
                                  src={emp?.foto_url}
                                  name={emp?.nombre || "Empleado"}
                                  size={8}
                                />
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-bold text-navy-700 dark:text-white">
                                    {emp?.nombre || "Colaborador"}
                                  </p>
                                  <p className="truncate text-[11px] text-gray-400 dark:text-white/50">
                                    {s.tipoItem} • {s.detalle}
                                  </p>
                                </div>
                              </div>
                              <span className="shrink-0 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-400/20 dark:text-amber-400">
                                Pendiente
                              </span>
                            </div>

                            {s.tipoItem === "Extensión de Tarea" && (
                              <div className="mt-1 flex items-center justify-end gap-2 pt-1 border-t border-gray-100 dark:border-white/5">
                                <button
                                  type="button"
                                  disabled={esResolviendo}
                                  onClick={() => resolverExtension(s, false)}
                                  className="rounded-lg bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-500/20 dark:text-red-300"
                                >
                                  Rechazar
                                </button>
                                <button
                                  type="button"
                                  disabled={esResolviendo}
                                  onClick={() => resolverExtension(s, true)}
                                  className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-300"
                                >
                                  {esResolviendo ? "Procesando..." : "Aprobar"}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
                  <Link
                    to={routeUrl("/admin", "empresa-solicitudes")}
                    className="flex items-center justify-center gap-1 text-xs font-bold text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Ver centro completo de solicitudes <MdOutlineArrowForward className="h-4 w-4" />
                  </Link>
                </div>
              </NexxusCard>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 items-stretch">
            {/* Feed de Actividad Reciente (2 columnas de 3) */}
            <div className="xl:col-span-2 flex flex-col h-full">
              <NexxusCard extra="p-6 flex flex-col justify-between h-full" delay={200}>
                <div>
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-gray-100 pb-4 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <MdOutlineHistory className="h-5 w-5 text-brand-500" />
                      <h4 className="text-base font-bold text-navy-700 dark:text-white">
                        Actividad Reciente del Sistema
                      </h4>
                    </div>

                    {/* Filtro rápido por módulo */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { id: "todos", label: "Todos" },
                        { id: "ia", label: "IA Nexxus" },
                        { id: "documentos", label: "Documentos" },
                        { id: "usuarios", label: "Usuarios" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setModuloFiltro(tab.id)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                            moduloFiltro === tab.id
                              ? "bg-brand-500 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
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
                    <div className="mt-4 flex flex-col divide-y divide-gray-100 dark:divide-white/5">
                      {actividadReciente.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 hover:bg-gray-50/50 px-2 rounded-lg transition dark:hover:bg-white/5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                              src={item.actorFoto}
                              name={item.actorNombre}
                              size={9}
                            />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-navy-700 dark:text-white">
                                {item.accion}
                              </p>
                              <p className="truncate text-[11px] text-gray-500 dark:text-white/60">
                                Por <span className="font-semibold text-gray-700 dark:text-gray-300">{item.actorNombre}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 pl-3">
                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-white/10 dark:text-white/70 uppercase">
                              {item.modulo}
                            </span>
                            <span className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
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
              <NexxusCard extra="p-6 flex flex-col justify-between h-full" delay={250}>
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <MdOutlineHourglassEmpty className="h-5 w-5 text-rose-500" />
                      <h4 className="text-base font-bold text-navy-700 dark:text-white">
                        Sin Check-in Hoy
                      </h4>
                    </div>
                    <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600 dark:bg-rose-400/20 dark:text-rose-400">
                      {empleadosSinCheckIn.length}
                    </span>
                  </div>

                  {empleadosSinCheckIn.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
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
                    <div className="mt-4 flex flex-col gap-2.5">
                      {empleadosSinCheckIn.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between rounded-xl border border-gray-100 p-2.5 transition hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar src={u.foto_url} name={u.nombre || "Empleado"} size={8} />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-navy-700 dark:text-white">
                                {u.nombre}
                              </p>
                              <p className="truncate text-[11px] text-gray-400 dark:text-white/50">
                                {u.departamento || u.cargo || "Colaborador"}
                              </p>
                            </div>
                          </div>
                          <span className="h-2 w-2 rounded-full bg-rose-500" title="Pendiente" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
                  <Link
                    to={routeUrl("/admin", "empresa-cuidado-equipo")}
                    className="flex items-center justify-center gap-1 text-xs font-bold text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Ver seguimiento en Bienestar <MdOutlineArrowForward className="h-4 w-4" />
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
