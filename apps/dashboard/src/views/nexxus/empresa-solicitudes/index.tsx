import { useEffect, useMemo, useState } from "react";
import {
  MdOutlinePendingActions,
  MdOutlineCheckCircle,
  MdOutlinePriorityHigh,
  MdOutlineFactCheck,
  MdOutlineSearch,
  MdOutlineAdd,
  MdOutlineCheck,
  MdOutlineClose,
  MdOutlineVisibility,
  MdOutlineCalendarToday,
  MdOutlineAttachMoney,
  MdOutlineBeachAccess,
  MdOutlineShoppingBag,
  MdOutlineDevices,
  MdOutlineDescription,
  MdOutlineWarningAmber,
} from "react-icons/md";
import { supabase } from "supabaseClient/supabaseConfig";

import NexxusCard from "views/nexxus/components/NexxusCard";
import Modal from "components/nexxus/Modal";
import Avatar from "components/nexxus/Avatar";
import { useAuth } from "context/AuthContext";
import { useEmpresaPlan, tieneFeature } from "services/planEnforcement";
import {
  subscribeSolicitudesAusencia,
  subscribeSolicitudesInternas,
  subscribeReportes,
  subscribeEmpleados,
  subscribeCargos,
  subscribeDepartamentos,
} from "services/adminRepository";
import { formatoFecha, formatoFechaHora } from "services/saFormat";

const textValue = (value: any, fallback = "") =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;

const PRIORIDADES = ["baja", "media", "alta", "urgente"];
const priorityValue = (value: any) => {
  const p = textValue(value, "media").toLowerCase();
  return PRIORIDADES.includes(p) ? p : "media";
};

const ESTADOS = ["pendiente", "aprobada", "rechazada", "resuelto", "registrado"];
const normalizeEstado = (estado: any) => {
  const value = textValue(estado, "pendiente").toLowerCase();
  if (value === "aprobado") return "aprobada";
  if (value === "rechazado") return "rechazada";
  return ESTADOS.includes(value) ? value : "pendiente";
};

const normalizeAusencia = (id: string, data: any) => {
  const d = data || {};
  return {
    id,
    source: "solicitud_ausencia",
    sourceCollection: "solicitudes_ausencia",
    empresaId: textValue(d.empresa_id),
    empleadoId: textValue(d.usuario_id || d.empleado_id),
    empleadoNombreFallback: textValue(d.datos?.usuario_nombre || d.empleado_nombre, "Colaborador"),
    tipo: textValue(d.tipo, "ausencia"),
    titulo: textValue(d.datos?.asunto || d.asunto, textValue(d.tipo, "Solicitud de ausencia")),
    descripcion: textValue(d.motivo || d.datos?.motivo, "Sin detalle especificado"),
    estado: normalizeEstado(d.estado),
    prioridad: priorityValue(d.datos?.prioridad || d.prioridad),
    fechaCreacion: textValue(d.created_at, new Date().toISOString()),
    datosRaw: d,
  };
};

const normalizeInterna = (id: string, data: any) => {
  const d = data || {};
  return {
    id,
    source: "solicitud_interna",
    sourceCollection: "solicitudes_internas",
    empresaId: textValue(d.empresa_id),
    empleadoId: textValue(d.usuario_id || d.empleado_id),
    empleadoNombreFallback: textValue(d.datos?.usuario_nombre || d.empleado_nombre, "Colaborador"),
    tipo: textValue(d.tipo, "solicitud"),
    titulo: textValue(d.datos?.titulo || d.titulo, textValue(d.tipo, "Solicitud interna")),
    descripcion: textValue(d.detalle || d.datos?.detalle, "Sin detalle especificado"),
    estado: normalizeEstado(d.estado),
    prioridad: priorityValue(d.datos?.prioridad || d.prioridad),
    fechaCreacion: textValue(d.created_at, new Date().toISOString()),
    datosRaw: d,
  };
};

const normalizeReporte = (id: string, data: any) => {
  const d = data || {};
  return {
    id,
    source: "reporte",
    sourceCollection: "reportes",
    empresaId: textValue(d.empresa_id),
    empleadoId: textValue(d.empleado_id || d.usuario_id),
    empleadoNombreFallback: textValue(d.datos?.empleadoNombre || d.empleado_nombre, "Colaborador"),
    tipo: textValue(d.datos?.tipo || d.tipo, "reporte"),
    titulo: textValue(d.titulo, "Reporte disciplinario"),
    descripcion: textValue(d.datos?.detalle || d.detalle, "Sin detalle especificado"),
    estado: normalizeEstado(d.datos?.estado || d.estado || "registrado"),
    prioridad: priorityValue(d.datos?.gravedad || d.gravedad),
    fechaCreacion: textValue(d.created_at, new Date().toISOString()),
    datosRaw: d,
  };
};

const TIPO_CONFIG: Record<string, { label: string; badge: string; icon: any }> = {
  adelanto: {
    label: "Adelanto de Salario",
    badge: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-400/20 dark:text-emerald-300",
    icon: MdOutlineAttachMoney,
  },
  vacaciones: {
    label: "Vacaciones",
    badge: "bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 dark:bg-cyan-400/20 dark:text-cyan-300",
    icon: MdOutlineBeachAccess,
  },
  permiso: {
    label: "Permiso Especial",
    badge: "bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-400/20 dark:text-blue-300",
    icon: MdOutlineCalendarToday,
  },
  compra: {
    label: "Solicitud de Compra",
    badge: "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-400/20 dark:text-amber-300",
    icon: MdOutlineShoppingBag,
  },
  equipo: {
    label: "Equipo de Trabajo",
    badge: "bg-purple-500/10 text-purple-600 border border-purple-500/20 dark:bg-purple-400/20 dark:text-purple-300",
    icon: MdOutlineDevices,
  },
  disciplinario: {
    label: "Disciplinario",
    badge: "bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:bg-rose-400/20 dark:text-rose-300",
    icon: MdOutlineWarningAmber,
  },
  reporte: {
    label: "Reporte",
    badge: "bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:bg-rose-400/20 dark:text-rose-300",
    icon: MdOutlineFactCheck,
  },
};

function getTipoStyle(tipoRaw: string) {
  const key = (tipoRaw || "").trim().toLowerCase();
  if (TIPO_CONFIG[key]) return TIPO_CONFIG[key];
  if (key.includes("adelanto")) return TIPO_CONFIG.adelanto;
  if (key.includes("vaca")) return TIPO_CONFIG.vacaciones;
  if (key.includes("perm")) return TIPO_CONFIG.permiso;
  if (key.includes("comp")) return TIPO_CONFIG.compra;
  if (key.includes("equip")) return TIPO_CONFIG.equipo;
  if (key.includes("disc") || key.includes("report")) return TIPO_CONFIG.disciplinario;

  return {
    label: tipoRaw || "General",
    badge: "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-white/10 dark:text-white/70 dark:border-white/10",
    icon: MdOutlineDescription,
  };
}

const ESTADO_BADGE: Record<string, { label: string; cls: string; dot: string }> = {
  pendiente: {
    label: "Pendiente",
    cls: "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-400/20 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  aprobada: {
    label: "Aprobada",
    cls: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-400/20 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  rechazada: {
    label: "Rechazada",
    cls: "bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:bg-rose-400/20 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  resuelto: {
    label: "Resuelto",
    cls: "bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-400/20 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  registrado: {
    label: "Registrado",
    cls: "bg-purple-500/10 text-purple-600 border border-purple-500/20 dark:bg-purple-400/20 dark:text-purple-300",
    dot: "bg-purple-500",
  },
};

const PRIORIDAD_BADGE: Record<string, { label: string; cls: string }> = {
  baja: { label: "Baja", cls: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70" },
  media: { label: "Media", cls: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300" },
  alta: { label: "Alta", cls: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300" },
  urgente: { label: "Urgente", cls: "bg-rose-500/10 text-rose-600 font-black dark:bg-rose-400/20 dark:text-rose-300" },
};

const PAGE_SIZE = 10;

const INITIAL_REPORT_FORM = {
  empleadoId: "",
  tipo: "disciplinario",
  titulo: "",
  descripcion: "",
  prioridad: "media",
};

export default function CentroReportesSolicitudes() {
  const { user, perfil, empresaId } = useAuth();
  const { planFeatures } = useEmpresaPlan();
  const tieneReportes = tieneFeature(planFeatures, "reports");

  const [ausencias, setAusencias] = useState<any[] | null>(null);
  const [internas, setInternas] = useState<any[] | null>(null);
  const [reportes, setReportes] = useState<any[] | null>(null);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [pagina, setPagina] = useState(1);

  const [accionandoId, setAccionandoId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [resolucionNotas, setResolucionNotas] = useState("");
  const [resolviendo, setResolviendo] = useState(false);

  // Modal crear reporte
  const [showCreateReporte, setShowCreateReporte] = useState(false);
  const [reportForm, setReportForm] = useState(INITIAL_REPORT_FORM);
  const [creandoReporte, setCreandoReporte] = useState(false);
  const [reporteError, setReporteError] = useState("");

  useEffect(() => {
    if (!empresaId) return undefined;
    const onErr = (err: any) => {
      setError(err?.message || "No se pudo conectar con Supabase.");
      setAusencias((prev) => prev ?? []);
      setInternas((prev) => prev ?? []);
      setReportes((prev) => prev ?? []);
      setEmpleados((prev) => prev ?? []);
    };
    const unsubs = [
      subscribeSolicitudesAusencia(empresaId, (docs) => setAusencias(docs.map((d) => normalizeAusencia(d.id, d.data()))), onErr),
      subscribeSolicitudesInternas(empresaId, (docs) => setInternas(docs.map((d) => normalizeInterna(d.id, d.data()))), onErr),
      subscribeReportes(empresaId, (docs) => setReportes(docs.map((d) => normalizeReporte(d.id, d.data()))), onErr),
      subscribeEmpleados(empresaId, (docs) => setEmpleados(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeCargos(empresaId, (docs) => setCargos(docs.map((d) => ({ id: d.id, ...d.data() }))), () => {}),
      subscribeDepartamentos(empresaId, (docs) => setDepartamentos(docs.map((d) => ({ id: d.id, ...d.data() }))), () => {}),
    ];
    return () => unsubs.forEach((fn) => fn && fn());
  }, [empresaId]);

  const cargando = ausencias === null || internas === null || reportes === null;

  const empleadosPorId = useMemo(() => {
    const map = new Map<string, any>();
    const cargoMap = Object.fromEntries(cargos.map((c) => [c.id, c.nombre || c.titulo]));
    const deptoMap = Object.fromEntries(departamentos.map((d) => [d.id, d.nombre]));

    (empleados || []).forEach((u) => {
      map.set(u.id, {
        ...u,
        cargoLabel: cargoMap[u.cargo_id] || u.cargo || "Especialista",
        departamentoLabel: deptoMap[u.departamento_id] || u.departamento || "General",
      });
    });
    return map;
  }, [empleados, cargos, departamentos]);

  // Lista combinada y enriquecida con datos reales del empleado
  const items = useMemo(() => {
    if (cargando) return [];
    const reportesVisibles = tieneReportes ? reportes || [] : [];
    const todos = [...(ausencias || []), ...(internas || []), ...reportesVisibles];

    return todos
      .map((item) => {
        const emp = empleadosPorId.get(item.empleadoId);
        const empleadoNombre = emp?.nombre || item.empleadoNombreFallback;
        const cargo = emp?.cargoLabel || "Colaborador";
        const depto = emp?.departamentoLabel || "General";
        const foto = emp?.foto_perfil || emp?.foto;

        return {
          ...item,
          empleadoNombre,
          cargo,
          depto,
          foto,
        };
      })
      .sort((a, b) => Date.parse(b.fechaCreacion) - Date.parse(a.fechaCreacion));
  }, [ausencias, internas, reportes, cargando, tieneReportes, empleadosPorId]);

  // KPIs
  const metricas = useMemo(() => {
    const pendientes = items.filter((i) => i.estado === "pendiente").length;
    const aprobadas = items.filter((i) => i.estado === "aprobada").length;
    const urgentes = items.filter((i) => i.prioridad === "urgente").length;
    const reportesCount = items.filter((i) => i.source === "reporte").length;

    return { pendientes, aprobadas, urgentes, reportesCount };
  }, [items]);

  // Filtrado
  const itemsFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return items.filter((item) => {
      if (filtroEstado !== "todos" && item.estado !== filtroEstado) return false;
      if (filtroTipo !== "todos") {
        const t = (item.tipo || "").toLowerCase();
        if (filtroTipo === "adelanto" && !t.includes("adelanto")) return false;
        if (filtroTipo === "vacaciones" && !t.includes("vaca") && !t.includes("perm")) return false;
        if (filtroTipo === "compra" && !t.includes("comp") && !t.includes("equip")) return false;
        if (filtroTipo === "reporte" && item.source !== "reporte") return false;
      }

      if (!q) return true;
      const campos = [item.empleadoNombre, item.cargo, item.depto, item.titulo, item.descripcion, item.tipo];
      return campos.some((c) => (c || "").toLowerCase().includes(q));
    });
  }, [items, busqueda, filtroTipo, filtroEstado]);

  const totalPaginas = Math.max(1, Math.ceil(itemsFiltrados.length / PAGE_SIZE));
  const itemsPaginados = useMemo(() => {
    const start = (pagina - 1) * PAGE_SIZE;
    return itemsFiltrados.slice(start, start + PAGE_SIZE);
  }, [itemsFiltrados, pagina]);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroTipo, filtroEstado]);

  const nombreActor = textValue(perfil?.nombre, textValue(user?.email, "Administrador"));

  // Resolver Solicitud
  const handleResolve = async (item: any, nuevoEstado: string, customNotas?: string) => {
    const notas = customNotas !== undefined ? customNotas : (window.prompt(`Notas de resolución (opcional) al ${nuevoEstado === "aprobada" ? "aprobar" : "rechazar"} "${item.titulo}":`, "") ?? null);
    if (notas === null) return;

    setAccionandoId(item.id);
    setResolviendo(true);
    setError("");
    try {
      const resueltoEn = new Date().toISOString();
      const { data: current } = await supabase.from(item.sourceCollection).select("datos").eq("id", item.id).maybeSingle();
      const { error: updateError } = await supabase
        .from(item.sourceCollection)
        .update({
          estado: nuevoEstado,
          resolved_at: resueltoEn,
          resuelto_por: user?.id,
          datos: { ...(current?.datos || {}), comentario_resolucion: notas.trim() || `Resuelto desde Solicitudes por ${nombreActor}` },
        })
        .eq("id", item.id);
      if (updateError) throw updateError;

      await supabase.from("audit_logs").insert({
        empresa_id: empresaId,
        actor_id: user?.id,
        accion: `Resolución de ${item.source}`,
        modulo: "Solicitudes",
        detalles: `${item.titulo} · ${nuevoEstado}`,
        target_id: item.id,
      });

      if (selectedItem?.id === item.id) {
        setSelectedItem(null);
      }
    } catch (err: any) {
      setError(err.message || "No se pudo resolver la solicitud.");
    } finally {
      setAccionandoId(null);
      setResolviendo(false);
    }
  };

  // Crear Reporte Disciplinario
  const handleCrearReporte = async (e: any) => {
    e.preventDefault();
    setReporteError("");
    if (!tieneReportes) {
      setReporteError("Los reportes disciplinarios están disponibles desde el plan Business.");
      return;
    }
    const emp = empleados.find((u) => u.id === reportForm.empleadoId);
    if (!emp || !reportForm.descripcion.trim()) {
      setReporteError("Selecciona un colaborador y describe la incidencia.");
      return;
    }

    setCreandoReporte(true);
    try {
      const empleadoNombre = textValue(emp.nombre, "Colaborador");
      const titulo = reportForm.titulo.trim() || `Reporte ${reportForm.tipo.replace(/_/g, " ")}`;

      const { data: rep, error: insertError } = await supabase
        .from("reportes")
        .insert({
          empresa_id: empresaId,
          empleado_id: emp.id,
          creado_por: user?.id,
          titulo,
          datos: {
            empleadoNombre,
            tipo: reportForm.tipo,
            detalle: reportForm.descripcion.trim(),
            gravedad: reportForm.prioridad,
            estado: "registrado",
            creadorNombre: nombreActor,
          },
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      await supabase.from("audit_logs").insert({
        empresa_id: empresaId,
        actor_id: user?.id,
        accion: "Creación de reporte",
        modulo: "Solicitudes",
        detalles: `${empleadoNombre} · ${reportForm.tipo}`,
        target_id: rep.id,
      });

      setReportForm(INITIAL_REPORT_FORM);
      setShowCreateReporte(false);
    } catch (err: any) {
      setReporteError(err.message || "No se pudo crear el reporte.");
    } finally {
      setCreandoReporte(false);
    }
  };

  if (!empresaId) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white p-6 shadow-3xl shadow-shadow-500 dark:bg-charcoal dark:border dark:border-charcoal-border">
        <p className="text-base font-semibold text-gray-600 dark:text-white/70">
          No se pudo determinar la empresa asociada a este usuario.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Banner de error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
            Bandeja Unificada de Solicitudes & Reportes
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-white/60">
            Aprobación ágil de adelantos, permisos, vacaciones, compras y reportes disciplinarios.
          </p>
        </div>

        {tieneReportes ? (
          <button
            type="button"
            onClick={() => setShowCreateReporte(true)}
            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95 dark:bg-brand-400"
          >
            <MdOutlineAdd className="h-4 w-4" />
            <span>Crear Reporte Disciplinario</span>
          </button>
        ) : (
          <span
            title="Los reportes disciplinarios están disponibles desde el plan Business."
            className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2.5 text-xs font-bold text-gray-400 dark:bg-white/5 dark:text-white/30"
          >
            <span>Crear Reporte (Business+)</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Solicitudes Pendientes */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Pendientes de Revisión
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                {metricas.pendientes}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300">
              <MdOutlinePendingActions className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Requieren tu acción</span>
            <span className={metricas.pendientes > 0 ? "font-bold text-amber-600" : "font-bold text-emerald-600"}>
              {metricas.pendientes > 0 ? "Atención requerida" : "Bandeja al día"}
            </span>
          </div>
        </NexxusCard>

        {/* Aprobadas */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Solicitudes Aprobadas
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {metricas.aprobadas}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
              <MdOutlineCheckCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Tramitadas con éxito</span>
            <span className="font-bold text-emerald-600">Procesadas</span>
          </div>
        </NexxusCard>

        {/* Urgentes */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Alta Prioridad / Urgentes
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                {metricas.urgentes}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300">
              <MdOutlinePriorityHigh className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Prioridad crítica</span>
            <span className={metricas.urgentes > 0 ? "font-bold text-rose-600" : "font-bold text-gray-400"}>
              {metricas.urgentes > 0 ? "Prioritario" : "Sin urgencias"}
            </span>
          </div>
        </NexxusCard>

        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Reportes Disciplinarios
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                {metricas.reportesCount}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
              <MdOutlineFactCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Incidencias registradas</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">Expedientes</span>
          </div>
        </NexxusCard>
      </div>

      <NexxusCard extra="p-6 flex flex-col gap-5" delay={100}>
        {/* Barra superior de filtrado y búsqueda */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h4 className="text-xl font-bold tracking-tight text-navy-700 dark:text-white">
              Bandeja de Solicitudes y Novedades
            </h4>
            <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-white/60">
              Mostrando {itemsFiltrados.length} solicitudes registradas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <MdOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/40" />
              <input
                type="text"
                placeholder="Buscar por colaborador, título o tipo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
              />
            </div>
          </div>
        </div>

        {/* Pestañas de Filtro Rápido */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltroTipo("todos")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filtroTipo === "todos"
                  ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70"
              }`}
            >
              Todos ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo("adelanto")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filtroTipo === "adelanto"
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70"
              }`}
            >
              Adelantos
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo("vacaciones")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filtroTipo === "vacaciones"
                  ? "bg-cyan-500 text-white shadow-sm shadow-cyan-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70"
              }`}
            >
              Vacaciones & Permisos
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo("compra")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                filtroTipo === "compra"
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70"
              }`}
            >
              Compras & Equipo
            </button>
            {tieneReportes && (
              <button
                type="button"
                onClick={() => setFiltroTipo("reporte")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  filtroTipo === "reporte"
                    ? "bg-purple-500 text-white shadow-sm shadow-purple-500/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-white/70"
                }`}
              >
                Reportes Disciplinarios
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="h-8 rounded-xl border border-gray-200 bg-gray-50/50 px-2.5 text-xs font-semibold text-navy-700 outline-none dark:border-white/10 dark:bg-charcoal dark:text-white"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobada">Aprobadas</option>
              <option value="rechazada">Rechazadas</option>
              <option value="resuelto">Resueltas</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        {cargando ? (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="text-sm font-medium text-gray-500 dark:text-white/60">
              Cargando solicitudes...
            </p>
          </div>
        ) : itemsFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-white/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/40">
              <MdOutlinePendingActions className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
              No se encontraron solicitudes
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-white/50">
              {busqueda || filtroTipo !== "todos" || filtroEstado !== "todos"
                ? "Prueba a cambiar los filtros o el término de búsqueda."
                : "No hay solicitudes pendientes en la bandeja."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/5">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 dark:border-white/10 dark:bg-white/[0.02]">
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Colaborador
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Tipo
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Título / Detalle
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Prioridad
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Estado
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Fecha
                  </th>
                  <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {itemsPaginados.map((item) => {
                  const tipoStyle = getTipoStyle(item.tipo);
                  const TipoIcon = tipoStyle.icon;
                  const estadoInfo = ESTADO_BADGE[item.estado] || ESTADO_BADGE.pendiente;
                  const prioridadInfo = PRIORIDAD_BADGE[item.prioridad] || PRIORIDAD_BADGE.media;
                  const isBusy = accionandoId === item.id;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="cursor-pointer transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                    >
                      {/* Colaborador */}
                      <td className="min-w-[190px] px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar src={item.foto} name={item.empleadoNombre} size={8} />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-navy-700 dark:text-white">
                              {item.empleadoNombre}
                            </p>
                            <p className="truncate text-[10.5px] text-gray-400 dark:text-white/50">
                              {item.cargo} · {item.depto}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tipoStyle.badge}`}>
                            <TipoIcon className="h-3 w-3" />
                            {tipoStyle.label}
                          </span>
                        </div>
                      </td>

                      {/* Título / Descripción */}
                      <td className="min-w-[220px] max-w-sm px-4 py-3.5">
                        <p className="truncate text-xs font-bold text-navy-700 dark:text-white">
                          {item.titulo}
                        </p>
                        <p className="truncate text-[11px] text-gray-400 dark:text-white/50">
                          {item.descripcion}
                        </p>
                      </td>

                      {/* Prioridad */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10.5px] font-bold capitalize ${prioridadInfo.cls}`}>
                          {prioridadInfo.label}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${estadoInfo.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${estadoInfo.dot}`} />
                          {estadoInfo.label}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-gray-500 dark:text-white/60">
                        {formatoFecha(item.fechaCreacion)}
                      </td>

                      {/* Acciones */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        {item.estado === "pendiente" && item.source !== "reporte" ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleResolve(item, "aprobada")}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-100 active:scale-95 disabled:opacity-50 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/30"
                            >
                              <MdOutlineCheck className="h-3.5 w-3.5" />
                              <span>Aprobar</span>
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleResolve(item, "rechazada")}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 shadow-sm transition hover:bg-rose-100 active:scale-95 disabled:opacity-50 dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/30"
                            >
                              <MdOutlineClose className="h-3.5 w-3.5" />
                              <span>Rechazar</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedItem(item)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-100 active:scale-95 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30"
                          >
                            <MdOutlineVisibility className="h-3.5 w-3.5" />
                            <span>Detalle</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginador */}
        {itemsFiltrados.length > PAGE_SIZE && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row dark:border-white/10">
            <p className="text-xs font-medium text-gray-500 dark:text-white/60">
              Página {pagina} de {totalPaginas} · {itemsFiltrados.length} solicitudes en total
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-navy-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:bg-charcoal dark:text-white"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-navy-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:bg-charcoal dark:text-white"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </NexxusCard>

      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Detalle de Solicitud"
        width="max-w-xl"
      >
        {selectedItem ? (
          <div className="flex flex-col gap-4 py-2">
            {/* Header del colaborador */}
            <div className="flex items-center justify-between rounded-2xl bg-brand-500/[0.06] p-4 dark:bg-brand-500/10">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={selectedItem.foto} name={selectedItem.empleadoNombre} size={10} />
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-navy-700 dark:text-white">
                    {selectedItem.empleadoNombre}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/60">
                    {selectedItem.cargo} · {selectedItem.depto}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  (ESTADO_BADGE[selectedItem.estado] || ESTADO_BADGE.pendiente).cls
                }`}
              >
                {(ESTADO_BADGE[selectedItem.estado] || ESTADO_BADGE.pendiente).label}
              </span>
            </div>

            {/* Asunto y Descripción */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-white/5 dark:bg-charcoal">
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${getTipoStyle(selectedItem.tipo).badge}`}>
                  {getTipoStyle(selectedItem.tipo).label}
                </span>
                <span className="text-xs text-gray-400 dark:text-white/40 font-medium">
                  {formatoFechaHora(selectedItem.fechaCreacion)}
                </span>
              </div>
              <h4 className="text-sm font-black text-navy-700 dark:text-white mb-1">
                {selectedItem.titulo}
              </h4>
              <p className="text-xs leading-relaxed text-gray-600 dark:text-white/80 font-medium whitespace-pre-wrap">
                {selectedItem.descripcion}
              </p>
            </div>

            {/* Acciones de resolución si está pendiente */}
            {selectedItem.estado === "pendiente" && selectedItem.source !== "reporte" && (
              <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 p-4 dark:border-white/10">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="notas-resolucion">
                  Comentario de Resolución (opcional)
                </label>
                <input
                  id="notas-resolucion"
                  type="text"
                  placeholder="Ej. Aprobado según políticas de la empresa..."
                  value={resolucionNotas}
                  onChange={(e) => setResolucionNotas(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                />

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    disabled={resolviendo}
                    onClick={() => handleResolve(selectedItem, "rechazada", resolucionNotas)}
                    className="inline-flex items-center gap-1 rounded-xl bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    <MdOutlineClose className="h-4 w-4" />
                    <span>Rechazar Solicitud</span>
                  </button>
                  <button
                    type="button"
                    disabled={resolviendo}
                    onClick={() => handleResolve(selectedItem, "aprobada", resolucionNotas)}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <MdOutlineCheck className="h-4 w-4" />
                    <span>Aprobar Solicitud</span>
                  </button>
                </div>
              </div>
            )}

            {/* Botón Cerrar */}
            <div className="flex justify-end border-t border-gray-100 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-xl bg-gray-100 px-5 py-2 text-xs font-bold text-gray-700 dark:bg-white/10 dark:text-white"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={showCreateReporte}
        onClose={() => setShowCreateReporte(false)}
        title="Crear Reporte Disciplinario"
        width="max-w-lg"
      >
        <div className="py-2">
          <form onSubmit={handleCrearReporte} className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="reporte-empleado">
                Colaborador Implicado *
              </label>
              <select
                id="reporte-empleado"
                value={reportForm.empleadoId}
                onChange={(e) => setReportForm((f) => ({ ...f, empleadoId: e.target.value }))}
                className="mt-1 flex h-10 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
              >
                <option value="">Selecciona un colaborador...</option>
                {empleados.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} ({emp.usuario_interno ? `@${emp.usuario_interno}` : emp.correo})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="reporte-tipo">
                  Tipo de Incidencia
                </label>
                <select
                  id="reporte-tipo"
                  value={reportForm.tipo}
                  onChange={(e) => setReportForm((f) => ({ ...f, tipo: e.target.value }))}
                  className="mt-1 flex h-10 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                >
                  <option value="disciplinario">Disciplinario</option>
                  <option value="llegada_tarde">Llegada Tarde Reiterada</option>
                  <option value="ausencia">Ausencia Injustificada</option>
                  <option value="desempeno">Bajo Desempeño</option>
                  <option value="incidencia">Incidencia Operativa</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="reporte-prioridad">
                  Gravedad / Prioridad
                </label>
                <select
                  id="reporte-prioridad"
                  value={reportForm.prioridad}
                  onChange={(e) => setReportForm((f) => ({ ...f, prioridad: e.target.value }))}
                  className="mt-1 flex h-10 w-full items-center rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente / Crítica</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="reporte-titulo">
                Título del Reporte
              </label>
              <input
                id="reporte-titulo"
                type="text"
                placeholder="Ej. Incumplimiento de horario en turno matutino"
                value={reportForm.titulo}
                onChange={(e) => setReportForm((f) => ({ ...f, titulo: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="reporte-descripcion">
                Descripción Detallada *
              </label>
              <textarea
                id="reporte-descripcion"
                rows={3}
                placeholder="Describe los hechos ocurridos..."
                value={reportForm.descripcion}
                onChange={(e) => setReportForm((f) => ({ ...f, descripcion: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-xs font-semibold text-navy-700 outline-none focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
              />
            </div>

            {reporteError && <p className="text-xs font-bold text-red-500">{reporteError}</p>}

            <div className="flex justify-end gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowCreateReporte(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-gray-700 dark:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creandoReporte}
                className="rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 disabled:opacity-50"
              >
                {creandoReporte ? "Guardando..." : "Registrar Reporte"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
