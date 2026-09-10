import { useEffect, useMemo, useState } from "react";
import { supabase } from "supabaseClient/supabaseConfig";
import {
  MdOutlineInventory2,
  MdOutlineAssignmentInd,
  MdOutlineCheckCircle,
  MdOutlineReportProblem,
  MdOutlineSearch,
  MdOutlineAdd,
  MdOutlineLaptop,
  MdOutlineChair,
  MdOutlineDirectionsCar,
  MdOutlineConstruction,
  MdOutlineVisibility,
  MdOutlineSwapHoriz,
  MdOutlineWarningAmber,
  MdOutlineCheck,
  MdOutlineClose,
  MdOutlineEdit,
  MdOutlineDelete,
  MdOutlineLocationOn,
  MdOutlineQrCode,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import Modal from "components/nexxus/Modal";
import Avatar from "components/nexxus/Avatar";
import { useAuth } from "context/AuthContext";
import {
  subscribeInventario,
  subscribeIncidencias,
  subscribeEmpleados,
  subscribeCargos,
  subscribeDepartamentos,
} from "services/adminRepository";
import { formatoFecha, formatoFechaHora } from "services/saFormat";

function mapActivoRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre || "Activo sin nombre",
    categoria: row.categoria || "General",
    codigo: row.datos?.codigo || row.codigo || `ACT-${String(row.id || "").slice(0, 6).toUpperCase()}`,
    serie: row.datos?.serie || row.serie || "",
    ubicacion: row.datos?.ubicacion || row.ubicacion || "Oficina Central",
    notas: row.datos?.notas || row.notas || "",
    estado: row.estado || "disponible",
    asignadoA: row.asignado_a || null,
    fechaCreacion: row.created_at,
    datosRaw: row,
  };
}

function mapIncidenciaRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    activoId: row.datos?.activoId || row.activo_id || "",
    activoNombre: row.datos?.activoNombre || row.activo_nombre || "Activo",
    descripcion: row.descripcion || row.titulo || "Sin descripción",
    prioridad: (row.datos?.prioridad || row.prioridad || "media").toLowerCase(),
    estado: row.estado || "abierta",
    reportadoPor: row.reportado_por || null,
    reportadoNombre: row.datos?.reportadoNombre || "Colaborador",
    fechaCreacion: row.created_at,
    datosRaw: row,
  };
}

const CATEGORIA_ICONS: Record<string, any> = {
  computo: MdOutlineLaptop,
  computadora: MdOutlineLaptop,
  laptop: MdOutlineLaptop,
  tecnologia: MdOutlineLaptop,
  mobiliario: MdOutlineChair,
  muebles: MdOutlineChair,
  vehiculo: MdOutlineDirectionsCar,
  vehiculos: MdOutlineDirectionsCar,
  transporte: MdOutlineDirectionsCar,
  herramienta: MdOutlineConstruction,
  herramientas: MdOutlineConstruction,
};

function getCategoriaIcon(categoria: string) {
  const cat = (categoria || "").toLowerCase().trim();
  for (const [key, icon] of Object.entries(CATEGORIA_ICONS)) {
    if (cat.includes(key)) return icon;
  }
  return MdOutlineInventory2;
}

const ESTADO_ACTIVO_BADGE: Record<string, { label: string; cls: string; dot: string }> = {
  disponible: {
    label: "Disponible",
    cls: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-400/20 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  asignado: {
    label: "Asignado",
    cls: "bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-400/20 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  mantenimiento: {
    label: "Mantenimiento",
    cls: "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-400/20 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  retirado: {
    label: "De Baja",
    cls: "bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:bg-rose-400/20 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

const ESTADO_INCIDENCIA_BADGE: Record<string, { label: string; cls: string }> = {
  abierta: { label: "Abierta", cls: "bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:bg-rose-400/20 dark:text-rose-300" },
  en_revision: { label: "En Revisión", cls: "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-400/20 dark:text-amber-300" },
  resuelta: { label: "Resuelta", cls: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-400/20 dark:text-emerald-300" },
};

const PRIORIDAD_BADGE: Record<string, { label: string; cls: string }> = {
  baja: { label: "Baja", cls: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60" },
  media: { label: "Media", cls: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300" },
  alta: { label: "Alta", cls: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300" },
  urgente: { label: "Urgente", cls: "bg-rose-500/10 text-rose-600 font-bold dark:bg-rose-400/20 dark:text-rose-300" },
};

const PAGE_SIZE = 8;

export default function GestionInventario() {
  const { user, perfil, empresaId } = useAuth();
  const actorNombre = perfil?.nombre || user?.email || "Admin";

  const [activos, setActivos] = useState<any[] | null>(null);
  const [incidencias, setIncidencias] = useState<any[] | null>(null);
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [error, setError] = useState("");

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [paginaActivos, setPaginaActivos] = useState(1);

  // Estados de carga de acciones
  const [busyId, setBusyId] = useState("");

  // Modales
  const [showCrearActivo, setShowCrearActivo] = useState(false);
  const [formActivo, setFormActivo] = useState({
    nombre: "",
    categoria: "Cómputo",
    codigo: "",
    serie: "",
    ubicacion: "Oficina Central",
    asignadoA: "",
    notas: "",
  });
  const [creando, setCreando] = useState(false);
  const [crearError, setCrearError] = useState("");

  const [showReportarIncidencia, setShowReportarIncidencia] = useState(false);
  const [formIncidencia, setFormIncidencia] = useState({ activoId: "", descripcion: "", prioridad: "media" });
  const [reportando, setReportando] = useState(false);
  const [reportarError, setReportarError] = useState("");

  const [selectedActivo, setSelectedActivo] = useState<any | null>(null);
  const [selectedIncidencia, setSelectedIncidencia] = useState<any | null>(null);

  useEffect(() => {
    if (!empresaId) return undefined;
    const onErr = (err: any) => {
      setError(err?.message || "No se pudo conectar con Supabase.");
      setActivos((prev) => prev ?? []);
      setIncidencias((prev) => prev ?? []);
      setEmpleados((prev) => prev ?? []);
    };
    const unsubs = [
      subscribeInventario(empresaId, (docs) => setActivos(docs.map((d) => mapActivoRow(d.data())).filter(Boolean)), onErr),
      subscribeIncidencias(empresaId, (docs) => setIncidencias(docs.map((d) => mapIncidenciaRow(d.data())).filter(Boolean)), onErr),
      subscribeEmpleados(empresaId, (docs) => setEmpleados(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeCargos(empresaId, (docs) => setCargos(docs.map((d) => ({ id: d.id, ...d.data() }))), () => {}),
      subscribeDepartamentos(empresaId, (docs) => setDepartamentos(docs.map((d) => ({ id: d.id, ...d.data() }))), () => {}),
    ];
    return () => unsubs.forEach((fn) => fn && fn());
  }, [empresaId]);

  const empleadosPorId = useMemo(() => {
    const map = new Map<string, any>();
    const cargoMap = Object.fromEntries(cargos.map((c) => [c.id, c.nombre || c.titulo]));
    const deptoMap = Object.fromEntries(departamentos.map((d) => [d.id, d.nombre]));

    empleados.forEach((e) => {
      map.set(e.id, {
        ...e,
        cargoLabel: cargoMap[e.cargo_id] || e.cargo || "Especialista",
        departamentoLabel: deptoMap[e.departamento_id] || e.departamento || "General",
      });
    });
    return map;
  }, [empleados, cargos, departamentos]);

  const categoriasDisponibles = useMemo(() => {
    const set = new Set<string>((activos || []).map((a) => a.categoria).filter(Boolean));
    return Array.from(set);
  }, [activos]);

  const kpis = useMemo(() => {
    const lista = activos || [];
    return {
      total: lista.length,
      asignados: lista.filter((a) => a.estado === "asignado").length,
      disponibles: lista.filter((a) => a.estado === "disponible").length,
      incidenciasAbiertas: (incidencias || []).filter((i) => i.estado === "abierta").length,
    };
  }, [activos, incidencias]);

  // Filtrado de Activos
  const activosFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return (activos || []).filter((a) => {
      if (filtroEstado !== "todos" && a.estado !== filtroEstado) return false;
      if (filtroCategoria !== "todas" && a.categoria?.toLowerCase() !== filtroCategoria.toLowerCase()) return false;

      if (!q) return true;
      const emp = empleadosPorId.get(a.asignadoA);
      const campos = [a.nombre, a.categoria, a.codigo, a.serie, a.ubicacion, emp?.nombre, emp?.usuario_interno];
      return campos.some((c) => (c || "").toLowerCase().includes(q));
    });
  }, [activos, busqueda, filtroEstado, filtroCategoria, empleadosPorId]);

  const totalPaginasActivos = Math.max(1, Math.ceil(activosFiltrados.length / PAGE_SIZE));
  const activosPaginados = useMemo(() => {
    const start = (paginaActivos - 1) * PAGE_SIZE;
    return activosFiltrados.slice(start, start + PAGE_SIZE);
  }, [activosFiltrados, paginaActivos]);

  useEffect(() => {
    setPaginaActivos(1);
  }, [busqueda, filtroEstado, filtroCategoria]);

  async function registrarMovimiento(activoId: string, tipo: string, detalle?: string) {
    try {
      await supabase.from("inventario_movimientos").insert({
        empresa_id: empresaId,
        activo_id: activoId,
        tipo,
        realizado_por: user?.id || null,
        detalles: detalle || null,
      });
    } catch {
      // Movimiento auxiliar
    }
  }

  // Crear Activo
  async function handleCrearActivo(e: any) {
    e.preventDefault();
    if (!formActivo.nombre.trim() || !formActivo.codigo.trim()) {
      setCrearError("El nombre y el código de inventario son obligatorios.");
      return;
    }
    setCreando(true);
    setCrearError("");
    try {
      const estado = formActivo.asignadoA ? "asignado" : "disponible";
      const { data, error: insertError } = await supabase
        .from("inventario_activos")
        .insert({
          empresa_id: empresaId,
          nombre: formActivo.nombre.trim(),
          categoria: formActivo.categoria.trim() || "General",
          estado,
          asignado_a: formActivo.asignadoA || null,
          datos: {
            codigo: formActivo.codigo.trim(),
            serie: formActivo.serie.trim() || null,
            ubicacion: formActivo.ubicacion.trim() || "Oficina Central",
            notas: formActivo.notas.trim() || null,
          },
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      await registrarMovimiento(data.id, "alta", `Alta de activo ${formActivo.nombre.trim()}`);
      setFormActivo({
        nombre: "",
        categoria: "Cómputo",
        codigo: "",
        serie: "",
        ubicacion: "Oficina Central",
        asignadoA: "",
        notas: "",
      });
      setShowCrearActivo(false);
    } catch (err: any) {
      setCrearError(err.message || "No se pudo registrar el activo.");
    } finally {
      setCreando(false);
    }
  }

  // Asignar Activo a Colaborador
  async function handleAsignarActivo(activoId: string, empleadoId: string) {
    setBusyId(activoId);
    setError("");
    try {
      const emp = empleadosPorId.get(empleadoId);
      const { error: updateError } = await supabase
        .from("inventario_activos")
        .update({ estado: "asignado", asignado_a: empleadoId })
        .eq("id", activoId);
      if (updateError) throw updateError;
      await registrarMovimiento(activoId, "asignacion", `Asignado a ${emp?.nombre || empleadoId}`);
      if (selectedActivo?.id === activoId) setSelectedActivo(null);
    } catch (err: any) {
      setError(err.message || "No se pudo asignar el activo.");
    } finally {
      setBusyId("");
    }
  }

  // Devolver Activo al Almacén
  async function handleDevolverActivo(activoId: string) {
    setBusyId(activoId);
    setError("");
    try {
      const { error: updateError } = await supabase
        .from("inventario_activos")
        .update({ estado: "disponible", asignado_a: null })
        .eq("id", activoId);
      if (updateError) throw updateError;
      await registrarMovimiento(activoId, "devolucion", "Devuelto a almacén general");
      if (selectedActivo?.id === activoId) setSelectedActivo(null);
    } catch (err: any) {
      setError(err.message || "No se pudo devolver el activo.");
    } finally {
      setBusyId("");
    }
  }

  // Reportar Incidencia
  async function handleReportarIncidencia(e: any) {
    e.preventDefault();
    if (!formIncidencia.activoId || !formIncidencia.descripcion.trim()) {
      setReportarError("Selecciona un activo y describe la incidencia.");
      return;
    }
    const activo = (activos || []).find((a) => a.id === formIncidencia.activoId);
    setReportando(true);
    setReportarError("");
    try {
      const { error: insertError } = await supabase.from("incidencias").insert({
        empresa_id: empresaId,
        reportado_por: user?.id || null,
        titulo: formIncidencia.descripcion.trim().slice(0, 120),
        descripcion: formIncidencia.descripcion.trim(),
        estado: "abierta",
        datos: {
          activoId: formIncidencia.activoId,
          activoNombre: activo?.nombre || "Activo",
          prioridad: formIncidencia.prioridad,
          reportadoNombre: actorNombre,
        },
      });
      if (insertError) throw insertError;
      await registrarMovimiento(formIncidencia.activoId, "incidencia", formIncidencia.descripcion.trim());
      setFormIncidencia({ activoId: "", descripcion: "", prioridad: "media" });
      setShowReportarIncidencia(false);
    } catch (err: any) {
      setReportarError(err.message || "No se pudo reportar la incidencia.");
    } finally {
      setReportando(false);
    }
  }

  // Resolver Incidencia
  async function handleResolverIncidencia(incidencia: any) {
    setBusyId(incidencia.id);
    setError("");
    try {
      const { error: updateError } = await supabase
        .from("incidencias")
        .update({ estado: "resuelta" })
        .eq("id", incidencia.id);
      if (updateError) throw updateError;
      await registrarMovimiento(incidencia.activoId, "incidencia_resuelta", "Incidencia resuelta por admin");
    } catch (err: any) {
      setError(err.message || "No se pudo resolver la incidencia.");
    } finally {
      setBusyId("");
    }
  }

  const cargando = activos === null || incidencias === null;

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
    <div className="flex flex-col gap-5 pb-6">
      {/* Banner de error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Toolbar / Subtítulo Superior (sin duplicar el título del Navbar) */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs font-medium text-gray-500 dark:text-white/60">
          Custodia de activos, asignación a colaboradores, trazabilidad y reporte de incidencias.
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowReportarIncidencia(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 active:scale-95 dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-300"
          >
            <MdOutlineReportProblem className="h-4 w-4" />
            <span>Reportar Incidencia</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCrearActivo(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-600 active:scale-95"
          >
            <MdOutlineAdd className="h-4 w-4" />
            <span>Registrar Activo</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Activos */}
        <NexxusCard extra="p-5 flex flex-col justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-white/60">
              Total de Activos
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
              <MdOutlineInventory2 className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
              {kpis.total}
            </h3>
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 text-xs text-gray-400 dark:border-white/10 dark:text-white/40">
              <span>Bienes registrados</span>
              <span className="inline-flex items-center rounded-md bg-brand-500/10 px-2 py-0.5 text-[11px] font-semibold text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                {categoriasDisponibles.length} categorías
              </span>
            </div>
          </div>
        </NexxusCard>

        {/* Asignados */}
        <NexxusCard extra="p-5 flex flex-col justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-white/60">
              Activos Asignados
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
              <MdOutlineAssignmentInd className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
              {kpis.asignados}
            </h3>
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 text-xs text-gray-400 dark:border-white/10 dark:text-white/40">
              <span>En posesión del equipo</span>
              <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                {kpis.total > 0 ? `${Math.round((kpis.asignados / kpis.total) * 100)}% ocupación` : "0%"}
              </span>
            </div>
          </div>
        </NexxusCard>

        {/* Disponibles */}
        <NexxusCard extra="p-5 flex flex-col justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-white/60">
              Disponibles en Almacén
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
              <MdOutlineCheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
              {kpis.disponibles}
            </h3>
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 text-xs text-gray-400 dark:border-white/10 dark:text-white/40">
              <span>Listos para entrega</span>
              <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                En stock
              </span>
            </div>
          </div>
        </NexxusCard>

        {/* Incidencias Abiertas */}
        <NexxusCard extra="p-5 flex flex-col justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-white/60">
              Incidencias Abiertas
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300">
              <MdOutlineReportProblem className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
              {kpis.incidenciasAbiertas}
            </h3>
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 text-xs text-gray-400 dark:border-white/10 dark:text-white/40">
              <span>Fallas o reparaciones</span>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                  kpis.incidenciasAbiertas > 0
                    ? "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
                    : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/40"
                }`}
              >
                {kpis.incidenciasAbiertas > 0 ? "Atención requerida" : "Sin averías"}
              </span>
            </div>
          </div>
        </NexxusCard>
      </div>

      <NexxusCard extra="p-5 sm:p-6 flex flex-col gap-5" delay={100}>
        {/* Barra superior de filtrado y tabs segmentados */}
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
          {/* Segmented Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-gray-100/80 p-1 dark:bg-charcoal">
            <button
              type="button"
              onClick={() => setFiltroEstado("todos")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filtroEstado === "todos"
                  ? "bg-navy-700 text-white shadow-sm dark:bg-white dark:text-navy-700"
                  : "text-gray-600 hover:text-navy-700 hover:bg-white/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
              }`}
            >
              <span>Todos</span>
              <span
                className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                  filtroEstado === "todos"
                    ? "bg-white/20 text-white dark:bg-navy-700/20 dark:text-navy-700"
                    : "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70"
                }`}
              >
                {activos?.length || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroEstado("disponible")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filtroEstado === "disponible"
                  ? "bg-navy-700 text-white shadow-sm dark:bg-white dark:text-navy-700"
                  : "text-gray-600 hover:text-navy-700 hover:bg-white/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
              }`}
            >
              <span>Disponibles</span>
              <span
                className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                  filtroEstado === "disponible"
                    ? "bg-white/20 text-white dark:bg-navy-700/20 dark:text-navy-700"
                    : "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70"
                }`}
              >
                {kpis.disponibles}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroEstado("asignado")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filtroEstado === "asignado"
                  ? "bg-navy-700 text-white shadow-sm dark:bg-white dark:text-navy-700"
                  : "text-gray-600 hover:text-navy-700 hover:bg-white/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
              }`}
            >
              <span>Asignados</span>
              <span
                className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                  filtroEstado === "asignado"
                    ? "bg-white/20 text-white dark:bg-navy-700/20 dark:text-navy-700"
                    : "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white/70"
                }`}
              >
                {kpis.asignados}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroEstado("mantenimiento")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filtroEstado === "mantenimiento"
                  ? "bg-navy-700 text-white shadow-sm dark:bg-white dark:text-navy-700"
                  : "text-gray-600 hover:text-navy-700 hover:bg-white/60 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
              }`}
            >
              <span>En Mantenimiento</span>
            </button>
          </div>

          {/* Buscador & Categoría */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <MdOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/40" />
              <input
                type="text"
                placeholder="Buscar activo, serie, código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-9 pr-8 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  title="Limpiar búsqueda"
                >
                  <MdOutlineClose className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="h-10 rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
            >
              <option value="todas">Todas las categorías</option>
              {categoriasDisponibles.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla */}
        {cargando ? (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
            <div className="h-9 w-9 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
            <p className="text-xs font-medium text-gray-500 dark:text-white/60">
              Cargando inventario...
            </p>
          </div>
        ) : activosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-14 text-center dark:border-white/10">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/40">
              <MdOutlineInventory2 className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
              No se encontraron activos
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-white/50 max-w-sm">
              {busqueda || filtroEstado !== "todos" || filtroCategoria !== "todas"
                ? "Prueba con otros términos de búsqueda o filtros."
                : "Comienza registrando tu primer activo con el botón 'Registrar Activo'."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/5">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 dark:border-white/10 dark:bg-white/[0.02]">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Activo / Equipo
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Código & Serie
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Custodio / Asignado
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {activosPaginados.map((activo) => {
                  const Icon = getCategoriaIcon(activo.categoria);
                  const estadoInfo = ESTADO_ACTIVO_BADGE[activo.estado] || ESTADO_ACTIVO_BADGE.disponible;
                  const emp = empleadosPorId.get(activo.asignadoA);
                  const isBusy = busyId === activo.id;

                  return (
                    <tr
                      key={activo.id}
                      onClick={() => setSelectedActivo(activo)}
                      className="group cursor-pointer transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                    >
                      {/* Activo */}
                      <td className="min-w-[200px] px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-navy-700 group-hover:text-brand-600 transition dark:text-white dark:group-hover:text-brand-300">
                              {activo.nombre}
                            </p>
                            <p className="truncate text-[11px] text-gray-400 dark:text-white/50">
                              {activo.ubicacion || "Oficina Central"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-white/10 dark:text-white/80">
                          {activo.categoria}
                        </span>
                      </td>

                      {/* Código & Serie */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold text-navy-700 dark:text-white">
                            {activo.codigo}
                          </span>
                          {activo.serie && (
                            <span className="font-mono text-[10px] text-gray-400 dark:text-white/40">
                              S/N: {activo.serie}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${estadoInfo.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${estadoInfo.dot}`} />
                          {estadoInfo.label}
                        </span>
                      </td>

                      {/* Custodio */}
                      <td className="min-w-[170px] px-4 py-3.5">
                        {emp ? (
                          <div className="flex items-center gap-2">
                            <Avatar src={emp.foto_perfil || emp.foto} name={emp.nombre} size={7} />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-navy-700 dark:text-white">{emp.nombre}</p>
                              <p className="truncate text-[10px] text-gray-400 dark:text-white/40">{emp.cargoLabel}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-white/5 dark:text-white/40">
                            En Almacén
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {activo.estado === "asignado" ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleDevolverActivo(activo.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 active:scale-95 disabled:opacity-50 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-300"
                            >
                              <MdOutlineSwapHoriz className="h-3.5 w-3.5" />
                              <span>Devolver</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedActivo(activo)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-700 shadow-sm transition hover:bg-gray-50 hover:border-gray-300 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
                            >
                              <MdOutlineVisibility className="h-3.5 w-3.5" />
                              <span>Gestionar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginador */}
        {activosFiltrados.length > PAGE_SIZE && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row dark:border-white/10">
            <p className="text-xs font-medium text-gray-500 dark:text-white/60">
              Página {paginaActivos} de {totalPaginasActivos} · {activosFiltrados.length} activos en total
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={paginaActivos <= 1}
                onClick={() => setPaginaActivos((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:bg-charcoal dark:text-white"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={paginaActivos >= totalPaginasActivos}
                onClick={() => setPaginaActivos((p) => Math.min(totalPaginasActivos, p + 1))}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:bg-charcoal dark:text-white"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </NexxusCard>

      <NexxusCard extra="p-6 flex flex-col gap-4" delay={150}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold tracking-tight text-navy-700 dark:text-white">
              Incidencias & Mantenimiento
            </h4>
            <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-white/60">
              Reportes de fallas, daños y solicitudes de reparación de equipamiento.
            </p>
          </div>
        </div>

        {(incidencias || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-10 text-center dark:border-white/10">
            <MdOutlineCheckCircle className="h-8 w-8 text-emerald-500" />
            <p className="mt-2 text-xs font-bold text-navy-700 dark:text-white">
              Sin incidencias reportadas
            </p>
            <p className="text-[11px] text-gray-400 dark:text-white/50">
              Todos los activos operan en condiciones óptimas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/5">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 dark:border-white/10 dark:bg-white/[0.02]">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">Activo Afectado</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">Descripción de Incidencia</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">Prioridad</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">Estado</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">Fecha</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {(incidencias || []).map((inc) => {
                  const prioridadInfo = PRIORIDAD_BADGE[inc.prioridad] || PRIORIDAD_BADGE.media;
                  const estadoInfo = ESTADO_INCIDENCIA_BADGE[inc.estado] || ESTADO_INCIDENCIA_BADGE.abierta;
                  const isBusy = busyId === inc.id;

                  return (
                    <tr key={inc.id} className="transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-4 py-3 text-xs font-bold text-navy-700 dark:text-white">
                        {inc.activoNombre}
                      </td>
                      <td className="min-w-[200px] px-4 py-3 text-xs text-gray-600 dark:text-white/80">
                        {inc.descripcion}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${prioridadInfo.cls}`}>
                          {prioridadInfo.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${estadoInfo.cls}`}>
                          {estadoInfo.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400 dark:text-white/50">
                        {formatoFecha(inc.fechaCreacion)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {inc.estado !== "resuelta" ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleResolverIncidencia(inc)}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 transition hover:bg-emerald-500/20 disabled:opacity-50 dark:bg-emerald-400/20 dark:text-emerald-300"
                          >
                            <MdOutlineCheck className="h-3 w-3" />
                            <span>Resolver</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-white/40">Resuelta</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </NexxusCard>

      <Modal
        isOpen={showCrearActivo}
        onClose={() => setShowCrearActivo(false)}
        title="Registrar Nuevo Activo"
        width="max-w-lg"
      >
        <div className="py-2">
          <form onSubmit={handleCrearActivo} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="activo-nombre">
                  Nombre del Activo *
                </label>
                <input
                  id="activo-nombre"
                  type="text"
                  placeholder="Ej. MacBook Pro 16"
                  value={formActivo.nombre}
                  onChange={(e) => setFormActivo((prev) => ({ ...prev, nombre: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="activo-categoria">
                  Categoría *
                </label>
                <select
                  id="activo-categoria"
                  value={formActivo.categoria}
                  onChange={(e) => setFormActivo((prev) => ({ ...prev, categoria: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
                >
                  <option value="Cómputo">Cómputo & Laptops</option>
                  <option value="Mobiliario">Mobiliario de Oficina</option>
                  <option value="Vehículos">Vehículos & Transporte</option>
                  <option value="Herramientas">Herramientas & Dispositivos</option>
                  <option value="Accesorios">Accesorios & Periféricos</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="activo-codigo">
                  Código de Inventario *
                </label>
                <input
                  id="activo-codigo"
                  type="text"
                  placeholder="Ej. INV-MB-001"
                  value={formActivo.codigo}
                  onChange={(e) => setFormActivo((prev) => ({ ...prev, codigo: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="activo-serie">
                  Número de Serie (opcional)
                </label>
                <input
                  id="activo-serie"
                  type="text"
                  placeholder="Ej. C02G789XMD6T"
                  value={formActivo.serie}
                  onChange={(e) => setFormActivo((prev) => ({ ...prev, serie: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="activo-ubicacion">
                  Ubicación / Sede
                </label>
                <input
                  id="activo-ubicacion"
                  type="text"
                  placeholder="Ej. Oficina Central / Almacén"
                  value={formActivo.ubicacion}
                  onChange={(e) => setFormActivo((prev) => ({ ...prev, ubicacion: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="activo-asignado">
                  Asignar a Colaborador
                </label>
                <select
                  id="activo-asignado"
                  value={formActivo.asignadoA}
                  onChange={(e) => setFormActivo((prev) => ({ ...prev, asignadoA: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
                >
                  <option value="">Dejar en Almacén (Disponible)</option>
                  {empleados.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="activo-notas">
                Notas / Especificaciones (opcional)
              </label>
              <textarea
                id="activo-notas"
                rows={2}
                placeholder="Detalles sobre el estado del activo o garantía..."
                value={formActivo.notas}
                onChange={(e) => setFormActivo((prev) => ({ ...prev, notas: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-xs font-semibold text-navy-700 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
              />
            </div>

            {crearError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                {crearError}
              </div>
            )}

            <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-3.5 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowCrearActivo(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-100 active:scale-95 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creando}
                className="rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95 disabled:opacity-50"
              >
                {creando ? "Guardando..." : "Guardar Activo"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={showReportarIncidencia}
        onClose={() => setShowReportarIncidencia(false)}
        title="Reportar Incidencia de Activo"
        width="max-w-lg"
      >
        <div className="py-2">
          <form onSubmit={handleReportarIncidencia} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="incidencia-activo">
                Activo Afectado *
              </label>
              <select
                id="incidencia-activo"
                value={formIncidencia.activoId}
                onChange={(e) => setFormIncidencia((prev) => ({ ...prev, activoId: e.target.value }))}
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
              >
                <option value="">Selecciona un activo...</option>
                {(activos || []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} ({a.codigo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="incidencia-prioridad">
                Gravedad / Prioridad
              </label>
              <select
                id="incidencia-prioridad"
                value={formIncidencia.prioridad}
                onChange={(e) => setFormIncidencia((prev) => ({ ...prev, prioridad: e.target.value }))}
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
              >
                <option value="baja">Baja - Mantenimiento rutinario</option>
                <option value="media">Media - Falla parcial o daño menor</option>
                <option value="alta">Alta - Activo inoperativo</option>
                <option value="urgente">Urgente - Pérdida, robo o riesgo</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50" htmlFor="incidencia-descripcion">
                Descripción de la Falla o Daño *
              </label>
              <textarea
                id="incidencia-descripcion"
                rows={3}
                placeholder="Describe el problema presentado en el equipo..."
                value={formIncidencia.descripcion}
                onChange={(e) => setFormIncidencia((prev) => ({ ...prev, descripcion: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-xs font-semibold text-navy-700 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-charcoal dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-400 dark:focus:bg-[#1B254B]"
              />
            </div>

            {reportarError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                {reportarError}
              </div>
            )}

            <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-3.5 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowReportarIncidencia(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-100 active:scale-95 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={reportando}
                className="rounded-xl bg-rose-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-rose-500/20 transition hover:bg-rose-600 active:scale-95 disabled:opacity-50"
              >
                {reportando ? "Enviando..." : "Reportar Incidencia"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedActivo}
        onClose={() => setSelectedActivo(null)}
        title="Ficha del Activo"
        width="max-w-md"
      >
        {selectedActivo ? (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center justify-between rounded-2xl bg-brand-500/[0.06] p-4 dark:bg-brand-500/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/20">
                  <MdOutlineInventory2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-navy-700 dark:text-white">
                    {selectedActivo.nombre}
                  </p>
                  <p className="text-xs font-mono text-gray-500 dark:text-white/60">
                    {selectedActivo.codigo}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  (ESTADO_ACTIVO_BADGE[selectedActivo.estado] || ESTADO_ACTIVO_BADGE.disponible).cls
                }`}
              >
                {(ESTADO_ACTIVO_BADGE[selectedActivo.estado] || ESTADO_ACTIVO_BADGE.disponible).label}
              </span>
            </div>

            {/* Asignación actual o cambio de custodio */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-white/5 dark:bg-charcoal">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-2">
                Asignación / Custodio
              </p>
              {selectedActivo.asignadoA ? (
                (() => {
                  const emp = empleadosPorId.get(selectedActivo.asignadoA);
                  return (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={emp?.foto_perfil || emp?.foto} name={emp?.nombre || "Colaborador"} size={8} />
                        <div>
                          <p className="text-xs font-bold text-navy-700 dark:text-white">{emp?.nombre}</p>
                          <p className="text-[10px] text-gray-400 dark:text-white/40">{emp?.cargoLabel}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDevolverActivo(selectedActivo.id)}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-300"
                      >
                        Devolver a Almacén
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-gray-500 dark:text-white/60">Actualmente disponible en almacén.</p>
                  <div className="flex items-center gap-2">
                    <select
                      id="asignar-modal-emp"
                      className="h-10 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-navy-900 dark:text-white"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) handleAsignarActivo(selectedActivo.id, e.target.value);
                      }}
                    >
                      <option value="">Asignar a un colaborador...</option>
                      {empleados.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSelectedActivo(null)}
                className="rounded-xl bg-gray-100 px-5 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200 active:scale-95 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
