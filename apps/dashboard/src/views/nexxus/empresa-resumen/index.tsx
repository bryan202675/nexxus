import { useEffect, useMemo, useState } from "react";
import {
  MdOutlinePeople,
  MdOutlineTrendingUp,
  MdOutlinePriorityHigh,
  MdOutlineHowToReg,
  MdOutlineWarningAmber,
  MdOutlineDescription,
  MdOutlineNotificationsActive,
} from "react-icons/md";

import NexxusWidget from "views/nexxus/components/NexxusWidget";
import NexxusCard from "views/nexxus/components/NexxusCard";
import TrendChart from "views/nexxus/components/TrendChart";
import DataTable from "views/nexxus/components/DataTable";

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
import { estresDeCheckIn } from "services/checkInAnalytics";

const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const hoyISO = () => new Date().toISOString().slice(0, 10);

const columnsRecientes = [
  { Header: "ACCIÓN", accessor: "accion" },
  { Header: "MÓDULO", accessor: "modulo" },
  { Header: "USUARIO", accessor: "usuario" },
  { Header: "FECHA", accessor: "fecha" },
];

export default function DashboardAdmin() {
  const { empresaId } = useAuth();
  const [error, setError] = useState("");

  const [empleados, setEmpleados] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [ausencias, setAusencias] = useState([]);
  const [internas, setInternas] = useState([]);
  const [extensiones, setExtensiones] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [asistenciasHoy, setAsistenciasHoy] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    if (!empresaId) return;
    const onErr = (err) => setError(err.message || "No se pudo conectar con Firestore.");
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

  const metricas = useMemo(() => {
    const lista = empleados || [];
    const activos = lista.filter((u) => u.activo !== false && u.estado_activo !== false);
    const inactivos = lista.length - activos.length;

    const tareasPendientes = tareas.filter((t) => t.estado === "pendiente").length;
    const tareasProgreso = tareas.filter((t) => t.estado === "en_progreso").length;
    const tareasCompletadas = tareas.filter((t) => t.estado === "completada").length;
    const tareasVencidas = tareas.filter((t) => t.fechaLimite && new Date(t.fechaLimite) < new Date() && t.estado !== "completada").length;
    const totalTareas = tareas.length;
    const productividad = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

    const costoMensual = payments.reduce((sum, p) => sum + (p.salario_bruto || p.salario_neto || 0), 0);

    const hoy = hoyISO();
    const checkInsHoy = checkIns.filter((c) => (c.created_at || "").slice(0, 10) === hoy).length;
    const participacion = activos.length > 0 ? Math.round((checkInsHoy / activos.length) * 100) : 0;

    const entradasHoy = asistenciasHoy.filter((a) => a.tipo === "entrada").length;
    const salidasHoy = asistenciasHoy.filter((a) => a.tipo === "salida").length;
    const retrasos = asistenciasHoy.filter((a) => a.tarde).length;
    const horasExtra = asistenciasHoy.reduce((sum, a) => sum + (a.horas_extra || 0), 0);

    const checkInsHoyLista = checkIns.filter((c) => (c.created_at || "").slice(0, 10) === hoy);
    const estresValores = checkInsHoyLista.map(estresDeCheckIn).filter((v) => v !== null);
    const estresPromedio = estresValores.length
      ? estresValores.reduce((sum, v) => sum + v, 0) / estresValores.length
      : 0;
    const bienestar = Math.max(0, Math.min(100, Math.round(((5 - estresPromedio) / 5) * 100)));
    const riesgo = 100 - bienestar;

    // audit_logs no tiene columna de severidad/estado, asi que "Alertas de auditoria" se
    // repurpone como el total de eventos de auditoria registrados hoy.
    const alertas = auditoria.filter((a) => (a.created_at || "").slice(0, 10) === hoy).length;
    const ausenciasPendientes = ausencias.filter((a) => a.estado === "pendiente").length;
    const internasPendientes = internas.filter((s) => s.estado === "pendiente" || s.estado === "pendiente_aprobacion").length;
    const extensionesPendientes = extensiones.filter((s) => s.estado === "pendiente").length;
    const aprobacionesPendientes = ausenciasPendientes + internasPendientes + extensionesPendientes;

    const documentosPendientes = documentos.filter((d) => !d.leido).length;
    const notificacionesNoLeidas = notificaciones.filter((n) => !n.leido && !n.leida).length;
    const incidenciasAbiertas = feedbacks.filter(
      (f) => (f.categoria === "problema" || f.categoria === "dificultad") && f.datos?.estado !== "resuelto"
    ).length;
    const inboxCritico = inbox.filter((i) => i.prioridad === "urgente" || i.critico === true).length;

    return {
      activos: activos.length, inactivos, tareasPendientes, tareasProgreso, tareasCompletadas, tareasVencidas,
      productividad, costoMensual, checkInsHoy, participacion, entradasHoy, salidasHoy, retrasos, horasExtra,
      bienestar, riesgo, alertas, ausenciasPendientes, internasPendientes, extensionesPendientes, aprobacionesPendientes,
      documentosPendientes, notificacionesNoLeidas, incidenciasAbiertas, inboxCritico,
    };
  }, [empleados, tareas, payments, checkIns, asistenciasHoy, auditoria, ausencias, internas, extensiones, documentos, notificaciones, feedbacks, inbox]);

  // Serie de los ultimos 8 dias: tareas completadas ese dia vs check-ins con estres alto.
  const serieDiaria = useMemo(() => {
    const dias = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dias.push({ key, label: DIAS_CORTOS[d.getDay()] });
    }
    const rendimiento = dias.map(({ key }) =>
      tareas.filter((t) => t.estado === "completada" && (t.fechaCompletada || t.updatedAt || "").slice(0, 10) === key).length
    );
    const carga = dias.map(({ key }) => checkIns.filter((c) => (c.fecha || "").slice(0, 10) === key).length);
    return { categorias: dias.map((d) => d.label), rendimiento, carga };
  }, [tareas, checkIns]);

  const empleadosPorId = useMemo(() => {
    const map = new Map();
    (empleados || []).forEach((u) => map.set(u.id, u));
    return map;
  }, [empleados]);

  const solicitudesPendientes = useMemo(() => {
    const merged = [
      ...ausencias.filter((a) => a.estado === "pendiente").map((a) => ({ ...a, tipoItem: "Ausencia" })),
      ...internas.filter((s) => s.estado === "pendiente" || s.estado === "pendiente_aprobacion").map((s) => ({ ...s, tipoItem: "Solicitud interna" })),
      ...extensiones.filter((s) => s.estado === "pendiente").map((s) => ({ ...s, tipoItem: "Extensión de tarea", tipo: s.tarea_titulo || "Tarea", timestamp: s.created_at })),
    ];
    return merged
      .sort((a, b) => (b.fecha_solicitud || b.timestamp || "").localeCompare(a.fecha_solicitud || a.timestamp || ""))
      .slice(0, 5);
  }, [ausencias, internas, extensiones]);

  const resolverExtension = async (solicitud, aprobar) => {
    const { error: resolveError } = await supabase.rpc("resolver_solicitud_extension_tarea", { p_solicitud_id: solicitud.id, p_aprobar: aprobar, p_observacion: null });
    if (resolveError) setError("No se pudo resolver la extensión. Inténtalo de nuevo.");
  };

  const empleadosSinCheckIn = useMemo(() => {
    const hoy = hoyISO();
    const conCheckIn = new Set(checkIns.filter((c) => (c.created_at || "").slice(0, 10) === hoy).map((c) => c.usuario_id));
    return (empleados || [])
      .filter((u) => u.activo !== false && !conCheckIn.has(u.id))
      .slice(0, 5);
  }, [empleados, checkIns]);

  const actividadFilas = useMemo(
    () =>
      auditoria.slice(0, 8).map((a) => ({
        accion: a.accion,
        modulo: a.modulo,
        usuario: empleadosPorId.get(a.actor_id)?.nombre || "—",
        fecha: formatoFecha(a.created_at),
      })),
    [auditoria, empleadosPorId]
  );

  const widgets = [
    { icon: MdOutlinePeople, title: "Equipo activo", subtitle: String(metricas.activos) },
    { icon: MdOutlineTrendingUp, title: "Productividad", subtitle: `${metricas.productividad}%` },
    { icon: MdOutlinePriorityHigh, title: "Prioridades", subtitle: `${metricas.riesgo}%` },
    { icon: MdOutlineHowToReg, title: "Check-ins hoy", subtitle: `${metricas.checkInsHoy} (${metricas.participacion}%)` },
    { icon: MdOutlineWarningAmber, title: "Eventos de auditoría hoy", subtitle: String(metricas.alertas) },
    { icon: MdOutlineNotificationsActive, title: "Aprobaciones pendientes", subtitle: String(metricas.aprobacionesPendientes) },
  ];

  if (!empresaId) {
    return (
      <p className="text-sm font-medium text-gray-600 dark:text-white/70">
        Tu cuenta no tiene una empresa asociada.
      </p>
    );
  }

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {empleados === null ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando datos de la empresa...</p>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-6">
            {widgets.map((w, i) => (
              <NexxusWidget key={w.title} {...w} delay={i * 100} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <TrendChart
              title="Tareas completadas (8 días)"
              total={String(metricas.tareasCompletadas)}
              change={`${metricas.tareasPendientes} pendientes`}
              series={[{ name: "Completadas", data: serieDiaria.rendimiento, color: "#422AFB" }]}
              categories={serieDiaria.categorias}
              delay={100}
            />
            <NexxusCard extra="p-4" delay={150}>
              <h4 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">Solicitudes pendientes</h4>
              {solicitudesPendientes.length === 0 ? (
                <p className="text-sm font-medium text-gray-600 dark:text-white/70">No hay solicitudes pendientes.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {solicitudesPendientes.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-charcoal-light">
                      <div>
                        <p className="text-sm font-bold text-navy-700 dark:text-white">
                          {empleadosPorId.get(s.usuario_id || s.userId)?.nombre || "Empleado"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-white/50">{s.tipoItem} — {s.tipo || "solicitud"}</p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
                        Pendiente
                      </span>
                      {s.tipoItem === "Extensión de tarea" ? <span className="flex gap-2"><button onClick={() => resolverExtension(s, true)} className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-300">Aprobar</button><button onClick={() => resolverExtension(s, false)} className="rounded-lg bg-red-500/10 px-2 py-1 text-xs font-bold text-red-600 dark:text-red-300">Rechazar</button></span> : null}
                    </div>
                  ))}
                </div>
              )}
            </NexxusCard>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <DataTable title="Actividad reciente" columnsData={columnsRecientes} tableData={actividadFilas} readOnly delay={100} />
            <NexxusCard extra="p-4" delay={150}>
              <h4 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">Sin check-in hoy</h4>
              {empleadosSinCheckIn.length === 0 ? (
                <p className="text-sm font-medium text-gray-600 dark:text-white/70">Todo el equipo activo ya hizo check-in.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {empleadosSinCheckIn.map((u) => (
                    <div key={u.id} className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-charcoal-light">
                      <p className="text-sm font-bold text-navy-700 dark:text-white">{u.nombre}</p>
                      <p className="text-xs text-gray-500 dark:text-white/50">{u.departamento || "—"}</p>
                    </div>
                  ))}
                </div>
              )}
            </NexxusCard>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <NexxusCard extra="p-4" delay={100}>
              <p className="text-sm font-medium text-gray-600 dark:text-white/70">Entradas / salidas hoy</p>
              <p className="mt-1 text-xl font-bold text-navy-700 dark:text-white">
                {metricas.entradasHoy} / {metricas.salidasHoy}
              </p>
            </NexxusCard>
            <NexxusCard extra="p-4" delay={150}>
              <p className="text-sm font-medium text-gray-600 dark:text-white/70">Retrasos hoy</p>
              <p className="mt-1 text-xl font-bold text-navy-700 dark:text-white">{metricas.retrasos}</p>
            </NexxusCard>
            <NexxusCard extra="p-4" delay={200}>
              <p className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-white/70">
                <MdOutlineDescription /> Documentos sin leer
              </p>
              <p className="mt-1 text-xl font-bold text-navy-700 dark:text-white">{metricas.documentosPendientes}</p>
            </NexxusCard>
            <NexxusCard extra="p-4" delay={250}>
              <p className="text-sm font-medium text-gray-600 dark:text-white/70">Incidencias / bandeja crítica</p>
              <p className="mt-1 text-xl font-bold text-navy-700 dark:text-white">
                {metricas.incidenciasAbiertas} / {metricas.inboxCritico}
              </p>
            </NexxusCard>
          </div>
        </div>
      )}
    </div>
  );
}
