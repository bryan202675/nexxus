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
    label: "IA Nexxus",
    badge: "bg-purple-500/10 text-purple-600 border border-purple-500/20 dark:bg-purple-400/20 dark:text-purple-300",
    icon: MdOutlineSmartToy,
  },
  documentos: {
    label: "Documentos",
    badge: "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-400/20 dark:text-amber-300",
    icon: MdOutlineDescription,
  },
  plantilla: {
    label: "Plantilla",
    badge: "bg-brand-500/10 text-brand-600 border border-brand-500/20 dark:bg-brand-400/20 dark:text-brand-300",
    icon: MdOutlinePeople,
  },
  estructura: {
    label: "Estructura",
    badge: "bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 dark:bg-cyan-400/20 dark:text-cyan-300",
    icon: MdOutlineAccountTree,
  },
  nomina: {
    label: "Nómina",
    badge: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-400/20 dark:text-emerald-300",
    icon: MdOutlineAssignment,
  },
  seguridad: {
    label: "Seguridad",
    badge: "bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:bg-rose-400/20 dark:text-rose-300",
    icon: MdOutlineSecurity,
  },
};

function getModuleStyle(moduloRaw: string) {
  const key = (moduloRaw || "").trim().toLowerCase();
  if (MODULE_STYLES[key]) return MODULE_STYLES[key];
  if (key.includes("ia") || key.includes("ai")) return MODULE_STYLES.ia;
  if (key.includes("doc")) return MODULE_STYLES.documentos;
  if (key.includes("plantilla") || key.includes("usuario") || key.includes("empleado")) return MODULE_STYLES.plantilla;
  if (key.includes("estructura") || key.includes("depto")) return MODULE_STYLES.estructura;
  if (key.includes("nom")) return MODULE_STYLES.nomina;
  if (key.includes("seg") || key.includes("auth")) return MODULE_STYLES.seguridad;

  return {
    label: moduloRaw || "General",
    badge: "bg-gray-100 text-gray-700 border border-gray-200 dark:bg-white/10 dark:text-white/70 dark:border-white/10",
    icon: MdOutlineHistory,
  };
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
    <div className="flex flex-col gap-6 pb-6">
      {/* Banner de error */}
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
            Registro de Auditoría & Seguridad
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-white/60">
            Trazabilidad de operaciones, consultas de IA, gestión de plantilla y eventos de seguridad.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportar}
          disabled={registrosFiltrados.length === 0 || !tieneExportar}
          title={!tieneExportar ? "La exportación de datos está disponible desde el plan Business." : undefined}
          className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
        >
          <MdOutlineDownload className="h-4 w-4" />
          <span>{tieneExportar ? "Exportar CSV" : "Exportar CSV (Business+)"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Eventos */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Total de Eventos
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                {kpis.total}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
              <MdOutlineFactCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Historial indexado</span>
            <span className="font-bold text-brand-500">100% trazabilidad</span>
          </div>
        </NexxusCard>

        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Eventos Hoy
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                {kpis.hoyCount}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
              <MdOutlineToday className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Últimas 24 horas
            </span>
            <span className="font-bold text-emerald-600">En tiempo real</span>
          </div>
        </NexxusCard>

        {/* Módulos Activos */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Módulos Auditados
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                {kpis.modulosCount}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
              <MdOutlineCategory className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Sistemas integrados</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{modulosDisponibles.length} módulos</span>
          </div>
        </NexxusCard>

        {/* Usuarios Activos */}
        <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                Actores Activos
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                {kpis.usuariosCount}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
              <MdOutlinePeopleAlt className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
            <span>Operadores con actividad</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">Verificados</span>
          </div>
        </NexxusCard>
      </div>

      <NexxusCard extra="p-6 flex flex-col gap-5" delay={100}>
        {/* Barra superior de filtrado y búsqueda */}
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h4 className="text-xl font-bold tracking-tight text-navy-700 dark:text-white">
              Historial de Eventos
            </h4>
            <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-white/60">
              Mostrando {registrosFiltrados.length} registros auditados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Buscador */}
            <div className="relative w-full sm:w-72">
              <MdOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 dark:text-white/40" />
              <input
                type="text"
                placeholder="Buscar por acción, módulo, usuario o detalles..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-9 pr-3 text-xs font-medium text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-charcoal dark:text-white dark:focus:border-brand-400"
              />
            </div>

            {/* Select Módulo */}
            <select
              value={moduloFiltro}
              onChange={(e) => setModuloFiltro(e.target.value)}
              className="h-9 rounded-xl border border-gray-200 bg-gray-50/50 px-3 text-xs font-semibold text-navy-700 outline-none transition dark:border-white/10 dark:bg-charcoal dark:text-white"
            >
              <option value="">Todos los módulos ({modulosDisponibles.length})</option>
              {modulosDisponibles.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pestañas de Filtro Rápido */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3 dark:border-white/10">
          <button
            type="button"
            onClick={() => setModuloFiltro("")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              !moduloFiltro
                ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200/80 dark:bg-white/5 dark:text-white/70"
            }`}
          >
            Todos ({kpis.total})
          </button>
          {modulosDisponibles.map((m) => {
            const count = (registros || []).filter((r) => r.modulo?.toLowerCase() === m.toLowerCase()).length;
            const isSelected = moduloFiltro.toLowerCase() === m.toLowerCase();

            return (
              <button
                key={m}
                type="button"
                onClick={() => setModuloFiltro(isSelected ? "" : m)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200/80 dark:bg-white/5 dark:text-white/70"
                }`}
              >
                <span>{m}</span>
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] ${
                    isSelected ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/10 text-gray-500 dark:text-white/60"
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
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Acción Realizada
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Módulo
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Usuario / Actor
                  </th>
                  <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
                    Fecha & Hora
                  </th>
                  <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/40">
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

                  return (
                    <tr
                      key={r.id}
                      className="cursor-pointer transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                      onClick={() => setSelectedRegistro(r)}
                    >
                      {/* Acción */}
                      <td className="min-w-[220px] px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 dark:bg-brand-400/20 dark:text-brand-300">
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-navy-700 dark:text-white">
                              {r.accion || "Operación"}
                            </p>
                            {r.detalles && (
                              <p className="truncate text-[11px] text-gray-400 dark:text-white/40 max-w-xs">
                                {r.detalles}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Módulo */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${modStyle.badge}`}>
                          {r.modulo || "General"}
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
                              <p className="truncate text-[10.5px] text-gray-400 dark:text-white/40">
                                @{actor.usuario_interno}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Fecha */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-gray-500 dark:text-white/60">
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
                          className="inline-flex items-center gap-1 rounded-xl bg-lightPrimary px-3 py-1.5 text-xs font-bold text-brand-500 shadow-sm transition hover:bg-brand-500/10 active:scale-95 dark:bg-white/5 dark:text-brand-300 dark:hover:bg-white/10"
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
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row dark:border-white/10">
            <p className="text-xs font-medium text-gray-500 dark:text-white/60">
              Página {pagina} de {totalPaginas} · {registrosFiltrados.length} eventos en total
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
        isOpen={!!selectedRegistro}
        onClose={() => setSelectedRegistro(null)}
        title="Detalle del Evento de Auditoría"
        width="max-w-xl"
      >
        {selectedRegistro ? (
          <div className="flex flex-col gap-4 py-2">
            {/* Header del evento */}
            <div className="flex items-center justify-between rounded-2xl bg-brand-500/[0.06] p-4 dark:bg-brand-500/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/20">
                  <MdOutlineFactCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-navy-700 dark:text-white">
                    {selectedRegistro.accion || "Operación"}
                  </p>
                  <p className="truncate text-xs font-medium text-gray-500 dark:text-white/60">
                    {formatoFechaHora(selectedRegistro.created_at)}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  getModuleStyle(selectedRegistro.modulo).badge
                }`}
              >
                {selectedRegistro.modulo || "General"}
              </span>
            </div>

            {/* Actor / Usuario */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-white/5 dark:bg-charcoal">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-2">
                Usuario / Actor Responsable
              </p>
              {(() => {
                const actor = usuariosPorId.get(selectedRegistro.actor_id);
                const nombre = actor?.nombre || (selectedRegistro.actor_id ? `ID: ${selectedRegistro.actor_id}` : "Sistema Automático");
                return (
                  <div className="flex items-center gap-3">
                    <Avatar src={actor?.foto_perfil || actor?.foto} name={nombre} size={10} />
                    <div>
                      <p className="text-sm font-bold text-navy-700 dark:text-white">{nombre}</p>
                      {actor?.correo && (
                        <p className="text-xs text-gray-400 dark:text-white/50">{actor.correo}</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Detalles de la Operación */}
            {selectedRegistro.detalles ? (
              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-white/5 dark:bg-charcoal">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1.5">
                  Detalles Registrados
                </p>
                <p className="text-xs leading-relaxed text-navy-700 dark:text-white/90 font-medium whitespace-pre-wrap">
                  {selectedRegistro.detalles}
                </p>
              </div>
            ) : null}

            {/* Identificador de Registro */}
            <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-white/40 px-1">
              <span>ID de Auditoría: <span className="font-mono">{selectedRegistro.id}</span></span>
              {selectedRegistro.target_id && (
                <span>Target: <span className="font-mono">{selectedRegistro.target_id}</span></span>
              )}
            </div>

            {/* Botón Cerrar */}
            <div className="mt-2 flex justify-end border-t border-gray-100 pt-3 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSelectedRegistro(null)}
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
