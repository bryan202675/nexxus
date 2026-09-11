import { useEffect, useMemo, useState } from "react";
import {
  MdOutlineFactCheck,
  MdOutlineToday,
  MdOutlineCategory,
  MdOutlinePeopleAlt,
  MdOutlineSearch,
  MdOutlineDownload,
  MdOutlineSmartToy,
  MdOutlineDescription,
  MdOutlinePeople,
  MdOutlineAccountTree,
  MdOutlineSecurity,
  MdOutlineVisibility,
  MdOutlineAccessTime,
  MdOutlineHistory,
  MdOutlineAlternateEmail,
  MdOutlineAssignment,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import Modal from "components/nexxus/Modal";
import Avatar from "components/nexxus/Avatar";
import { useAuth } from "context/AuthContext";
import { useEmpresaPlan, tieneFeature } from "services/planEnforcement";
import { subscribeAuditLogs, subscribeEmpleados } from "services/adminRepository";
import { formatoFechaHora } from "services/saFormat";

const hoyISO = () => new Date().toISOString().slice(0, 10);

const MODULE_STYLES: Record<string, { label: string; badge: string; icon: any }> = {
  ia: {
    label: "IA",
    badge: "bg-purple-500/10 text-purple-700 dark:bg-purple-400/20 dark:text-purple-300",
    icon: MdOutlineSmartToy,
  },
  documentos: {
    label: "Documentos",
    badge: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300",
    icon: MdOutlineDescription,
  },
  plantilla: {
    label: "Plantilla",
    badge: "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-400/20 dark:text-indigo-300",
    icon: MdOutlinePeople,
  },
  estructura: {
    label: "Estructura",
    badge: "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-400/20 dark:text-cyan-300",
    icon: MdOutlineAccountTree,
  },
  nomina: {
    label: "Nómina",
    badge: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300",
    icon: MdOutlineAssignment,
  },
  seguridad: {
    label: "Seguridad",
    badge: "bg-rose-500/10 text-rose-700 dark:bg-rose-400/20 dark:text-rose-300",
    icon: MdOutlineSecurity,
  },
  auth: {
    label: "Auth",
    badge: "bg-rose-500/10 text-rose-700 dark:bg-rose-400/20 dark:text-rose-300",
    icon: MdOutlineSecurity,
  },
  comunicacion: {
    label: "Comunicación",
    badge: "bg-blue-500/10 text-blue-700 dark:bg-blue-400/20 dark:text-blue-300",
    icon: MdOutlineFactCheck,
  },
  superadmin: {
    label: "Super Admin",
    badge: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300",
    icon: MdOutlineSecurity,
  },
};

function getModuleStyle(moduloRaw: string) {
  const key = (moduloRaw || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (MODULE_STYLES[key]) return MODULE_STYLES[key];
  if (key.includes("ia") || key.includes("ai")) return MODULE_STYLES.ia;
  if (key.includes("doc")) return MODULE_STYLES.documentos;
  if (key.includes("plantilla") || key.includes("usuario") || key.includes("empleado")) return MODULE_STYLES.plantilla;
  if (key.includes("estructura") || key.includes("depto")) return MODULE_STYLES.estructura;
  if (key.includes("nom")) return MODULE_STYLES.nomina;
  if (key.includes("auth") || key.includes("login") || key.includes("sesion")) return MODULE_STYLES.auth;
  if (key.includes("seg")) return MODULE_STYLES.seguridad;
  if (key.includes("comunic") || key.includes("anuncio") || key.includes("mensaj")) return MODULE_STYLES.comunicacion;
  if (key.includes("super")) return MODULE_STYLES.superadmin;

  return {
    label: moduloRaw || "General",
    badge: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70",
    icon: MdOutlineHistory,
  };
}

function formatAuditDetail(detalles: string) {
  if (!detalles) return "";
  const trimmed = detalles.trim();
  if (/^\d+\s*caracteres$/i.test(trimmed)) {
    return "Consulta procesada por Nexxus IA";
  }
  if (trimmed.startsWith("Usuario interno ")) {
    return `Usuario: @${trimmed.replace("Usuario interno ", "")}`;
  }
  if (trimmed.startsWith("Anuncio enviado a ")) {
    return trimmed.replace("colaborador(es) (todos)", "colaboradores");
  }
  return trimmed;
}

function csvEscape(value: any) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

const PAGE_SIZE = 10;

export default function AuditoriaAdmin() {
  const { empresaId } = useAuth();
  const { planFeatures } = useEmpresaPlan();
  const tieneExportar = tieneFeature(planFeatures, "exports");

  const [registros, setRegistros] = useState<any[] | null>(null);
  const [usuarios, setUsuarios] = useState<any[] | null>(null);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState("");
  const [pagina, setPagina] = useState(1);
  const [selectedRegistro, setSelectedRegistro] = useState<any | null>(null);

  useEffect(() => {
    if (!empresaId) return undefined;
    const unsubscribe = subscribeAuditLogs(
      empresaId,
      (docs) => setRegistros(docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err: any) => setError(err.message || "No se pudo conectar con el servidor.")
    );
    return () => unsubscribe();
  }, [empresaId]);

  useEffect(() => {
    if (!empresaId) return undefined;
    const unsubscribe = subscribeEmpleados(
      empresaId,
      (docs) => setUsuarios(docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err: any) => setError(err.message || "No se pudo conectar con el servidor.")
    );
    return () => unsubscribe();
  }, [empresaId]);

  const usuariosPorId = useMemo(() => {
    const map = new Map<string, any>();
    (usuarios || []).forEach((u) => map.set(u.id, u));
    return map;
  }, [usuarios]);

  const modulosDisponibles = useMemo<string[]>(() => {
    const set = new Set<string>((registros || []).map((r) => String(r.modulo || "")).filter(Boolean));
    return Array.from(set).sort();
  }, [registros]);

  const registrosFiltrados = useMemo(() => {
    const lista = registros || [];
    const texto = busqueda.trim().toLowerCase();
    return lista
      .filter((registro) => (moduloFiltro ? registro.modulo?.toLowerCase() === moduloFiltro.toLowerCase() : true))
      .filter((registro) => {
        if (!texto) return true;
        const nombreActor = usuariosPorId.get(registro.actor_id)?.nombre || "";
        const usuarioActor = usuariosPorId.get(registro.actor_id)?.usuario_interno || "";
        const campos = [registro.accion, registro.modulo, nombreActor, usuarioActor, registro.detalles];
        return campos.some((campo) => (campo || "").toLowerCase().includes(texto));
      });
  }, [registros, busqueda, moduloFiltro, usuariosPorId]);

  const totalPaginas = Math.max(1, Math.ceil(registrosFiltrados.length / PAGE_SIZE));
  const registrosPaginados = useMemo(() => {
    const start = (pagina - 1) * PAGE_SIZE;
    return registrosFiltrados.slice(start, start + PAGE_SIZE);
  }, [registrosFiltrados, pagina]);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, moduloFiltro]);

  const kpis = useMemo(() => {
    const lista = registros || [];
    const hoy = hoyISO();
    const total = lista.length;
    const hoyCount = lista.filter((r) => (r.created_at || "").slice(0, 10) === hoy).length;
    const modulosCount = new Set(lista.map((r) => r.modulo).filter(Boolean)).size;
    const usuariosCount = new Set(lista.map((r) => r.actor_id).filter(Boolean)).size;
    return { total, hoyCount, modulosCount, usuariosCount };
  }, [registros]);

  const handleExportar = () => {
    const encabezados = ["ID", "Acción", "Módulo", "Usuario", "Fecha", "Detalles"];
    const filas = registrosFiltrados.map((r) => [
      r.id || "",
      r.accion || "",
      r.modulo || "",
      usuariosPorId.get(r.actor_id)?.nombre || r.actor_id || "",
      formatoFechaHora(r.created_at),
      r.detalles || "",
    ]);
    const csvContent = [encabezados, ...filas].map((fila) => fila.map(csvEscape).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  const cargando = registros === null;

  return (
    <div className="flex flex-col gap-5 pb-6">
      {/* Banner de error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-navy-700 dark:text-white">
            Auditoría y Trazabilidad
          </h2>
          <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-white/60">
            Trazabilidad integral de operaciones, consultas a la IA, gestión de plantilla y eventos de seguridad.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportar}
          disabled={registrosFiltrados.length === 0 || !tieneExportar}
          title={!tieneExportar ? "La exportación de datos está disponible desde el plan Business." : undefined}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
        >
          <MdOutlineDownload className="h-4 w-4" />
          <span>{tieneExportar ? "Exportar CSV" : "Exportar CSV (Business+)"}</span>
        </button>
      </div>

      {/* Grid de 4 Cards de Métricas Refinadas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total de Eventos */}
        <NexxusCard extra="p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                Total de Eventos
              </span>
              <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-bold text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
                100% trazabilidad
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-navy-700 dark:text-white">
                {kpis.total}
              </span>
              <span className="text-xs font-medium text-gray-400 dark:text-white/40">
                registros
              </span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div className="h-full w-full bg-brand-500" />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-white/60">
              <span>Historial indexado</span>
              <span className="font-bold text-navy-700 dark:text-white">{kpis.total} eventos</span>
            </div>
          </div>
        </NexxusCard>

        {/* Card 2: Eventos Hoy */}
        <NexxusCard extra="p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                Eventos Hoy
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En tiempo real
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-navy-700 dark:text-white">
                {kpis.hoyCount}
              </span>
              <span className="text-xs font-medium text-gray-400 dark:text-white/40">
                últimas 24h
              </span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                style={{ width: `${Math.min((kpis.hoyCount / Math.max(kpis.total, 1)) * 100 * 3, 100)}%` }}
                className="h-full bg-emerald-500 transition-all duration-500"
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-white/60">
              <span>Actividad de hoy</span>
              <span className="font-bold text-navy-700 dark:text-white">{kpis.hoyCount} operaciones</span>
            </div>
          </div>
        </NexxusCard>

        {/* Card 3: Módulos Auditados */}
        <NexxusCard extra="p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                Módulos Auditados
              </span>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
                {modulosDisponibles.length} módulos
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-navy-700 dark:text-white">
                {kpis.modulosCount}
              </span>
              <span className="text-xs font-medium text-gray-400 dark:text-white/40">
                sistemas
              </span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div className="h-full w-full bg-blue-500" />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-white/60">
              <span>Sistemas integrados</span>
              <span className="font-bold text-navy-700 dark:text-white">100% monitoreo</span>
            </div>
          </div>
        </NexxusCard>

        {/* Card 4: Actores Activos */}
        <NexxusCard extra="p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                Actores Activos
              </span>
              <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-bold text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                Verificados
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-navy-700 dark:text-white">
                {kpis.usuariosCount}
              </span>
              <span className="text-xs font-medium text-gray-400 dark:text-white/40">
                operadores
              </span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div className="h-full w-full bg-purple-500" />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-white/60">
              <span>Operadores con actividad</span>
              <span className="font-bold text-navy-700 dark:text-white">{kpis.usuariosCount} usuarios</span>
            </div>
          </div>
        </NexxusCard>
      </div>

      <NexxusCard extra="p-5 sm:p-6 flex flex-col gap-4" delay={100}>
        {/* Header con Buscador */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h4 className="text-lg font-bold tracking-tight text-navy-700 dark:text-white">
              Historial de Eventos
            </h4>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-white/60">
              Mostrando {registrosFiltrados.length} registros auditados.
            </p>
          </div>

          {/* Buscador */}
          <div className="relative w-full sm:w-72">
            <MdOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/40" />
            <input
              type="text"
              placeholder="Buscar por acción, usuario o detalles..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
            />
          </div>
        </div>

        {/* Pestañas de Filtro Segmentadas */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setModuloFiltro("")}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition-all active:scale-95 ${
              !moduloFiltro
                ? "bg-navy-700 font-semibold text-white shadow-xs dark:bg-white dark:text-navy-900"
                : "border border-gray-200 bg-white font-medium text-gray-600 hover:bg-gray-50 hover:text-navy-700 dark:border-white/10 dark:bg-charcoal dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white"
            }`}
          >
            <span>Todos</span>
            <span
              className={`rounded-md px-1.5 py-0.2 text-[10px] font-semibold ${
                !moduloFiltro
                  ? "bg-white/20 text-white dark:bg-black/10 dark:text-navy-900"
                  : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60"
              }`}
            >
              {kpis.total}
            </span>
          </button>
          {modulosDisponibles.map((m) => {
            const count = (registros || []).filter((r) => r.modulo?.toLowerCase() === m.toLowerCase()).length;
            const isSelected = moduloFiltro.toLowerCase() === m.toLowerCase();
            const modStyle = getModuleStyle(m);

            return (
              <button
                key={m}
                type="button"
                onClick={() => setModuloFiltro(isSelected ? "" : m)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition-all active:scale-95 ${
                  isSelected
                    ? "bg-navy-700 font-semibold text-white shadow-xs dark:bg-white dark:text-navy-900"
                    : "border border-gray-200 bg-white font-medium text-gray-600 hover:bg-gray-50 hover:text-navy-700 dark:border-white/10 dark:bg-charcoal dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white"
                }`}
              >
                <span>{modStyle.label}</span>
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] font-semibold ${
                    isSelected
                      ? "bg-white/20 text-white dark:bg-black/10 dark:text-navy-900"
                      : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tabla */}
        {cargando ? (
          <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="text-sm font-medium text-gray-500 dark:text-white/60">
              Cargando registros de auditoría...
            </p>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-white/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/40">
              <MdOutlineFactCheck className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
              No se encontraron registros
            </p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-white/50">
              {busqueda || moduloFiltro
                ? "Prueba a cambiar el filtro de módulo o término de búsqueda."
                : "Aún no se han registrado eventos de auditoría para esta empresa."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-white/5">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 dark:border-white/10 dark:bg-white/[0.02]">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                    Acción Realizada
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                    Módulo
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                    Usuario / Actor
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                    Fecha & Hora
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                    Detalle
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {registrosPaginados.map((r) => {
                  const modStyle = getModuleStyle(r.modulo);
                  const Icon = modStyle.icon;
                  const actor = usuariosPorId.get(r.actor_id);
                  const actorNombre = actor?.nombre || (r.actor_id ? `Usuario (${r.actor_id.slice(0, 6)}...)` : "Sistema");
                  const detailText = formatAuditDetail(r.detalles);

                  return (
                    <tr
                      key={r.id}
                      className="group cursor-pointer transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                      onClick={() => setSelectedRegistro(r)}
                    >
                      {/* Acción */}
                      <td className="min-w-[220px] px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-navy-700 dark:text-white">
                              {r.accion || "Operación"}
                            </p>
                            {detailText && (
                              <p className="truncate text-[11px] font-medium text-gray-400 dark:text-white/40 max-w-xs">
                                {detailText}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Módulo */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className={`inline-flex rounded-md px-2.5 py-0.5 text-[11px] font-bold ${modStyle.badge}`}>
                          {modStyle.label}
                        </span>
                      </td>

                      {/* Usuario */}
                      <td className="min-w-[180px] px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={actor?.foto_perfil || actor?.foto} name={actorNombre} size={7} />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-navy-700 dark:text-white">
                              {actorNombre}
                            </p>
                            {actor?.usuario_interno && (
                              <p className="truncate text-[10.5px] font-medium text-gray-400 dark:text-white/40">
                                @{actor.usuario_interno}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Fecha */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-gray-500 dark:text-white/60">
                        <div className="flex items-center gap-1.5">
                          <MdOutlineAccessTime className="h-3.5 w-3.5 text-gray-400" />
                          <span>{formatoFechaHora(r.created_at)}</span>
                        </div>
                      </td>

                      {/* Botón Ver */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedRegistro(r)}
                          className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 shadow-xs transition hover:bg-gray-50 hover:text-brand-600 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5 dark:hover:text-brand-300"
                        >
                          <MdOutlineVisibility className="h-3.5 w-3.5" />
                          <span>Detalle</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginador */}
        {registrosFiltrados.length > PAGE_SIZE && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-3 sm:flex-row dark:border-white/10">
            <p className="text-xs font-medium text-gray-500 dark:text-white/60">
              Página {pagina} de {totalPaginas} · {registrosFiltrados.length} eventos en total
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagina <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 shadow-2xs transition hover:bg-gray-50 active:scale-95 disabled:opacity-40 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={pagina >= totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 shadow-2xs transition hover:bg-gray-50 active:scale-95 disabled:opacity-40 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </NexxusCard>

      <Modal
        isOpen={!!selectedRegistro}
        onClose={() => setSelectedRegistro(null)}
        title="Detalle del Evento de Auditoría"
        width="max-w-lg"
      >
        {selectedRegistro ? (
          <div className="flex flex-col gap-3.5 py-1">
            {/* Header del evento */}
            <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/80 p-3.5 dark:border-white/5 dark:bg-white/[0.03]">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
                  <MdOutlineFactCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-navy-700 dark:text-white">
                    {selectedRegistro.accion || "Operación"}
                  </p>
                  <p className="truncate text-xs font-medium text-gray-500 dark:text-white/60">
                    {formatoFechaHora(selectedRegistro.created_at)}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                  getModuleStyle(selectedRegistro.modulo).badge
                }`}
              >
                {getModuleStyle(selectedRegistro.modulo).label}
              </span>
            </div>

            {/* Actor / Usuario */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 dark:border-white/5 dark:bg-charcoal">
              <p className="mb-2 text-[10.5px] font-semibold text-gray-400 dark:text-white/40">
                Usuario / Actor Responsable
              </p>
              {(() => {
                const actor = usuariosPorId.get(selectedRegistro.actor_id);
                const nombre = actor?.nombre || (selectedRegistro.actor_id ? `ID: ${selectedRegistro.actor_id}` : "Sistema Automático");
                return (
                  <div className="flex items-center gap-3">
                    <Avatar src={actor?.foto_perfil || actor?.foto} name={nombre} size={9} />
                    <div>
                      <p className="text-xs font-bold text-navy-700 dark:text-white">{nombre}</p>
                      {actor?.correo && (
                        <p className="text-[11px] text-gray-400 dark:text-white/50">{actor.correo}</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Detalles de la Operación */}
            {selectedRegistro.detalles ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 dark:border-white/5 dark:bg-charcoal">
                <p className="mb-1.5 text-[10.5px] font-semibold text-gray-400 dark:text-white/40">
                  Detalles Registrados
                </p>
                <p className="text-xs font-medium leading-relaxed text-navy-700 whitespace-pre-wrap dark:text-white/90">
                  {selectedRegistro.detalles}
                </p>
              </div>
            ) : null}

            {/* Identificador de Registro */}
            <div className="flex items-center justify-between px-1 text-[11px] text-gray-400 dark:text-white/40">
              <span>ID de Auditoría: <span className="font-mono text-gray-600 dark:text-white/60">{selectedRegistro.id}</span></span>
              {selectedRegistro.target_id && (
                <span>Target: <span className="font-mono text-gray-600 dark:text-white/60">{selectedRegistro.target_id}</span></span>
              )}
            </div>

            {/* Botón Cerrar */}
            <div className="mt-1 flex justify-end border-t border-gray-100 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSelectedRegistro(null)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-2xs transition hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
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
