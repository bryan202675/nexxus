import { useEffect, useMemo, useState } from "react";
import {
  MdOutlineSearch,
  MdOutlineShield,
  MdOutlineBusiness,
  MdOutlineAssignment,
  MdOutlineSmartToy,
  MdOutlineDescription,
  MdOutlineLock,
  MdOutlinePeople,
  MdOutlineAccessTime,
  MdOutlineArrowForward,
  MdOutlineClose,
  MdOutlineHistory,
  MdOutlineContentCopy,
  MdOutlineCheck,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import Avatar from "components/nexxus/Avatar";
import Modal from "components/nexxus/Modal";
import {
  subscribeAuditGlobal,
  loadMoreAuditGlobal,
  loadMoreCompanies,
} from "services/superAdminRepository";
import { formatoFechaHora, formatoFecha } from "services/saFormat";

const LIMITE = 25;

const MODULE_STYLES: Record<
  string,
  { label: string; badge: string; dot: string; barColor: string; icon: React.ElementType }
> = {
  solicitudes: {
    label: "Solicitudes",
    badge: "bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300 border border-purple-500/20",
    dot: "bg-purple-500",
    barColor: "bg-purple-500",
    icon: MdOutlineAssignment,
  },
  ia: {
    label: "IA Nexxus",
    badge: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300 border border-blue-500/20",
    dot: "bg-blue-500",
    barColor: "bg-blue-500",
    icon: MdOutlineSmartToy,
  },
  documentos: {
    label: "Documentos",
    badge: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-500/20",
    dot: "bg-emerald-500",
    barColor: "bg-emerald-500",
    icon: MdOutlineDescription,
  },
  auth: {
    label: "Autenticación",
    badge: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-500/20",
    dot: "bg-amber-500",
    barColor: "bg-amber-500",
    icon: MdOutlineLock,
  },
  empresas: {
    label: "Organizaciones",
    badge: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/20 dark:text-indigo-300 border border-indigo-500/20",
    dot: "bg-indigo-500",
    barColor: "bg-indigo-500",
    icon: MdOutlineBusiness,
  },
  usuarios: {
    label: "Usuarios",
    badge: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-300 border border-cyan-500/20",
    dot: "bg-cyan-500",
    barColor: "bg-cyan-500",
    icon: MdOutlinePeople,
  },
};

function getModuleStyle(modulo: string) {
  const key = String(modulo || "").toLowerCase().trim();
  if (MODULE_STYLES[key]) return MODULE_STYLES[key];
  if (key.includes("solicitud")) return MODULE_STYLES.solicitudes;
  if (key.includes("ia") || key.includes("ai")) return MODULE_STYLES.ia;
  if (key.includes("doc")) return MODULE_STYLES.documentos;
  if (key.includes("auth") || key.includes("login") || key.includes("seguridad")) return MODULE_STYLES.auth;
  if (key.includes("empresa") || key.includes("org")) return MODULE_STYLES.empresas;
  if (key.includes("user") || key.includes("usuario")) return MODULE_STYLES.usuarios;

  return {
    label: modulo || "Sistema",
    badge: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70 border border-gray-200/50 dark:border-white/10",
    dot: "bg-gray-400",
    barColor: "bg-gray-400",
    icon: MdOutlineShield,
  };
}
function formatAuditAction(accion: string): string {
  if (!accion) return "Evento del sistema";
  const formatted = accion.replace(/_/g, " ").trim();
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

const MODULO_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "solicitudes", label: "Solicitudes" },
  { value: "ia", label: "IA Nexxus" },
  { value: "documentos", label: "Documentos" },
  { value: "auth", label: "Autenticación" },
  { value: "empresas", label: "Empresas" },
];

export default function Auditoria() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [cursor, setCursor] = useState<any>(null);
  const [hayMas, setHayMas] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState("todos");
  const [empresaFiltro, setEmpresaFiltro] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [copiedDetail, setCopiedDetail] = useState(false);

  useEffect(() => {
    let active = true;
    loadMoreCompanies({}, 500, null)
      .then((res) => active && setCompanies(res.items || []))
      .catch(() => active && setCompanies([]));
    return () => {
      active = false;
    };
  }, []);

  const nombreEmpresaPorId = useMemo(() => {
    const map = new Map<string, string>();
    companies.forEach((empresa) => map.set(empresa.id, empresa.nombre));
    return map;
  }, [companies]);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeAuditGlobal(
      LIMITE,
      (snapshot) => {
        if (!active) return;
        setRegistros(snapshot.items);
        setCursor(snapshot.cursor);
        setHayMas(snapshot.hayMas);
        setCargando(false);
      },
      (err) => {
        if (!active) return;
        setError(err.message || "No se pudo conectar con el servidor.");
        setCargando(false);
      }
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleCargarMas = async () => {
    if (!hayMas || cargandoMas) return;
    setCargandoMas(true);
    setError("");
    try {
      const siguiente = await loadMoreAuditGlobal(LIMITE, cursor);
      setRegistros((prev) => [...prev, ...siguiente.items]);
      setCursor(siguiente.cursor);
      setHayMas(siguiente.hayMas);
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar más registros.");
    } finally {
      setCargandoMas(false);
    }
  };

  const handleCopyDetails = (text: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedDetail(true);
    setTimeout(() => setCopiedDetail(false), 2000);
  };

  const registrosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return registros.filter((reg) => {
      const mod = (reg.modulo || "").toLowerCase();
      if (moduloFiltro !== "todos") {
        if (!mod.includes(moduloFiltro)) return false;
      }
      if (empresaFiltro && reg.empresaId !== empresaFiltro) {
        return false;
      }
      if (!texto) return true;
      const empresaNom = (reg.empresaNombre || nombreEmpresaPorId.get(reg.empresaId) || "").toLowerCase();
      const campos = [
        reg.accion,
        reg.modulo,
        empresaNom,
        reg.actorNombre,
        reg.detalles,
      ];
      return campos.some((campo) => (campo || "").toLowerCase().includes(texto));
    });
  }, [registros, busqueda, moduloFiltro, empresaFiltro, nombreEmpresaPorId]);

  const moduleDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      solicitudes: 0,
      ia: 0,
      documentos: 0,
      auth: 0,
      otros: 0,
    };

    registros.forEach((r) => {
      const mod = String(r.modulo || "").toLowerCase();
      if (mod.includes("solicitud")) counts.solicitudes += 1;
      else if (mod.includes("ia") || mod.includes("ai")) counts.ia += 1;
      else if (mod.includes("doc")) counts.documentos += 1;
      else if (mod.includes("auth") || mod.includes("login")) counts.auth += 1;
      else counts.otros += 1;
    });

    const total = registros.length || 1;
    return [
      { name: "Solicitudes", count: counts.solicitudes, percent: Math.round((counts.solicitudes / total) * 100), ...MODULE_STYLES.solicitudes },
      { name: "IA Nexxus", count: counts.ia, percent: Math.round((counts.ia / total) * 100), ...MODULE_STYLES.ia },
      { name: "Documentos", count: counts.documentos, percent: Math.round((counts.documentos / total) * 100), ...MODULE_STYLES.documentos },
      { name: "Autenticación", count: counts.auth, percent: Math.round((counts.auth / total) * 100), ...MODULE_STYLES.auth },
    ].filter((item) => item.count > 0 || total === 1);
  }, [registros]);

  const empresasMonitoreadasCount = useMemo(() => {
    const set = new Set<string>();
    registros.forEach((r) => {
      if (r.empresaId) set.add(r.empresaId);
    });
    return set.size;
  }, [registros]);

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Superior Asymmetric Grid (7 cols + 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Hero Card (7 columnas) */}
        <div className="lg:col-span-7">
          <NexxusCard extra="p-6 h-full flex flex-col justify-between" delay={0}>
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                    Seguridad & Trazabilidad
                  </p>
                  <h2 className="text-xl font-black tracking-tight text-navy-700 dark:text-white">
                    Bitácora Global de Auditoría
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  En Vivo
                </span>
              </div>

              {/* Métrica Gigante */}
              <div className="mt-4">
                <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-brand-500 dark:text-brand-300">
                  {registros.length > 0 ? `${registros.length} Eventos` : cargando ? "—" : "0 Eventos"}
                </p>
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-white/60">
                  <span>Actividad registrada en tiempo real</span>
                  <span className="font-normal text-gray-400 dark:text-white/40">
                    · Trazabilidad forense inmutable de toda la plataforma
                  </span>
                </p>
              </div>

              {/* Barra de Distribución Proporcional de Eventos por Módulo */}
              <div className="mt-6">
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  {moduleDistribution.map((item) => (
                    <div
                      key={item.name}
                      title={`${item.name}: ${item.count} eventos (${item.percent}%)`}
                      className={`${item.barColor} transition-all duration-500`}
                      style={{ width: `${item.percent}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Leyenda de Métricas por Módulo */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
              {moduleDistribution.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${item.dot} shrink-0`} />
                    <p className="text-xs font-semibold text-gray-400 dark:text-white/50">{item.name}</p>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-lg sm:text-xl font-black text-navy-700 dark:text-white">
                      {item.count}
                    </span>
                    <span className="text-[11px] font-medium text-gray-400 dark:text-white/40">
                      ({item.percent}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </NexxusCard>
        </div>

        {/* Right Stack (5 columnas - 3 Mini Cards) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <NexxusCard extra="p-5 flex-1 flex flex-col justify-between" delay={100}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Módulo Más Activo</p>
              <span className="text-xs font-bold text-brand-500">Operaciones</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white capitalize">
                {moduleDistribution[0]?.name || "General"}
              </h4>
              <span className="text-xs text-gray-400 dark:text-white/40">
                {moduleDistribution[0]?.percent || 0}% del volumen
              </span>
            </div>
          </NexxusCard>

          <NexxusCard extra="p-5 flex-1 flex flex-col justify-between" delay={130}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Empresas Monitoreadas</p>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Auditoría Multi-Tenant
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                {empresasMonitoreadasCount}
              </h4>
              <span className="text-xs text-gray-400 dark:text-white/40">
                Organizaciones activas
              </span>
            </div>
          </NexxusCard>

          <NexxusCard extra="p-5 flex-1 flex flex-col justify-between" delay={160}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Integridad de Registros</p>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                100% Inmutable
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                Auditoría Activa
              </h4>
              <span className="text-xs text-gray-400 dark:text-white/40">
                Logs protegidos
              </span>
            </div>
          </NexxusCard>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <NexxusCard extra="p-4" delay={180}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Segmented Controls por Módulo */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-gray-100/80 p-1 dark:bg-white/5">
            {MODULO_FILTERS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setModuloFiltro(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  moduloFiltro === opt.value
                    ? "bg-white text-brand-500 shadow-xs font-bold dark:bg-charcoal dark:text-white"
                    : "text-gray-500 hover:text-navy-700 dark:text-white/60 dark:hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Búsqueda y Selector de Empresa */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] sm:min-w-[280px]">
              <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por acción, usuario, empresa..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-xl border border-gray-200/80 bg-gray-50/60 pl-9 pr-3.5 py-1.5 text-xs text-navy-700 outline-none transition focus:border-brand-500 focus:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:border-brand-400"
              />
            </div>

            <select
              id="filtro-empresa-auditoria"
              value={empresaFiltro}
              onChange={(e) => setEmpresaFiltro(e.target.value)}
              className="rounded-xl border border-gray-200/80 bg-gray-50/60 px-3 py-1.5 text-xs font-semibold text-navy-700 outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
            >
              <option value="">Todas las empresas</option>
              {companies.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </NexxusCard>

      {/* Listado Principal de Auditoría */}
      <NexxusCard extra="p-6" delay={200}>
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 dark:border-white/10">
          <div>
            <h3 className="text-base font-bold text-navy-700 dark:text-white">
              Registro de Eventos y Actividad
            </h3>
            <p className="text-xs text-gray-400 dark:text-white/40">
              Mostrando {registrosFiltrados.length} de {registros.length} eventos cargados
            </p>
          </div>
        </div>

        {error ? (
          <div className="my-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {cargando && registros.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-500 border-t-transparent" />
            <p className="mt-3 text-xs font-medium">Cargando bitácora de auditoría...</p>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
            <MdOutlineHistory className="h-10 w-10 text-gray-300 dark:text-white/20" />
            <p className="mt-2 text-sm font-bold text-navy-700 dark:text-white">No se encontraron eventos</p>
            <p className="text-xs text-gray-400 dark:text-white/50">Intenta ajustando los filtros de búsqueda o módulo.</p>
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                  <th className="pb-3 pt-2 pl-2">Evento / Acción</th>
                  <th className="pb-3 pt-2">Módulo</th>
                  <th className="pb-3 pt-2">Organización</th>
                  <th className="pb-3 pt-2">Responsable</th>
                  <th className="pb-3 pt-2">Fecha y Hora</th>
                  <th className="pb-3 pt-2 pr-2 text-right">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {registrosFiltrados.map((reg) => {
                  const moduleInfo = getModuleStyle(reg.modulo);
                  const ModuleIcon = moduleInfo.icon;
                  const empresaNombre =
                    reg.empresaNombre || nombreEmpresaPorId.get(reg.empresaId) || "Plataforma Central";

                  return (
                    <tr
                      key={reg.id}
                      onClick={() => setSelectedEvent(reg)}
                      className="group cursor-pointer transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                    >
                      {/* Acción y Detalles breves */}
                      <td className="py-3.5 pl-2 max-w-[280px]">
                        <div>
                          <p className="text-xs font-bold text-navy-700 group-hover:text-brand-500 transition-colors dark:text-white truncate">
                            {formatAuditAction(reg.accion)}
                          </p>
                          {reg.detalles ? (
                            <p className="text-[11px] text-gray-400 dark:text-white/40 truncate mt-0.5">
                              {reg.detalles}
                            </p>
                          ) : null}
                        </div>
                      </td>

                      {/* Módulo */}
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${moduleInfo.badge}`}>
                          <ModuleIcon className="h-3 w-3" />
                          <span>{moduleInfo.label}</span>
                        </span>
                      </td>

                      {/* Empresa */}
                      <td className="py-3.5 text-xs font-bold text-navy-700 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <MdOutlineBusiness className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{empresaNombre}</span>
                        </div>
                      </td>

                      {/* Responsable */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={reg.actorNombre || "Sistema"} size={7} />
                          <span className="text-xs font-semibold text-navy-700 dark:text-white truncate max-w-[130px]">
                            {reg.actorNombre || "Sistema"}
                          </span>
                        </div>
                      </td>

                      {/* Fecha y Hora */}
                      <td className="py-3.5 text-xs font-medium text-gray-500 dark:text-white/60">
                        <div className="flex items-center gap-1.5">
                          <MdOutlineAccessTime className="h-3.5 w-3.5 text-gray-400" />
                          <span>{formatoFechaHora(reg.timestamp)}</span>
                        </div>
                      </td>

                      {/* Botón Ver */}
                      <td className="py-3.5 pr-2 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(reg);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1 text-xs font-bold text-navy-700 transition hover:bg-brand-500 hover:text-white active:scale-95 dark:bg-white/10 dark:text-white dark:hover:bg-brand-500"
                        >
                          <span>Ver</span>
                          <MdOutlineArrowForward className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Paginación / Cargar Más */}
            <div className="mt-4 flex justify-center border-t border-gray-100 pt-4 dark:border-white/10">
              {hayMas ? (
                <button
                  type="button"
                  onClick={handleCargarMas}
                  disabled={cargandoMas}
                  className="rounded-xl border border-gray-200/80 bg-white px-5 py-2 text-xs font-bold text-navy-700 shadow-xs transition hover:bg-gray-50 active:scale-95 disabled:opacity-50 dark:border-white/10 dark:bg-charcoal dark:text-white"
                >
                  {cargandoMas ? "Cargando más eventos..." : "Cargar más registros de auditoría"}
                </button>
              ) : (
                <p className="text-xs font-medium text-gray-400 dark:text-white/40">
                  Has llegado al final de la bitácora de auditoría.
                </p>
              )}
            </div>
          </div>
        )}
      </NexxusCard>

      {/* Modal: Detalle de Evento de Auditoría */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Detalle de Registro de Auditoría"
        width="max-w-2xl"
      >
        {selectedEvent ? (
          <div className="p-1 flex flex-col gap-4">
            {/* Header del Evento */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4.5 dark:border-white/10 dark:bg-white/[0.02]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-black text-navy-700 dark:text-white">
                  {formatAuditAction(selectedEvent.accion)}
                </h3>
                {(() => {
                  const mod = getModuleStyle(selectedEvent.modulo);
                  const Icon = mod.icon;
                  return (
                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${mod.badge}`}>
                      <Icon className="h-3 w-3" />
                      <span>{mod.label}</span>
                    </span>
                  );
                })()}
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/50">
                <MdOutlineAccessTime className="h-3.5 w-3.5" />
                <span>Registrado el {formatoFechaHora(selectedEvent.timestamp)}</span>
              </p>
            </div>

            {/* Metadatos en Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-2xs dark:border-white/5 dark:bg-white/[0.02]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                  Organización Afectada
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <MdOutlineBusiness className="h-4 w-4 text-brand-500" />
                  <p className="text-sm font-bold text-navy-700 dark:text-white">
                    {selectedEvent.empresaNombre || nombreEmpresaPorId.get(selectedEvent.empresaId) || "Plataforma Global"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-2xs dark:border-white/5 dark:bg-white/[0.02]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                  Actor Responsable
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Avatar name={selectedEvent.actorNombre || "Sistema"} size={6} />
                  <p className="text-sm font-bold text-navy-700 dark:text-white">
                    {selectedEvent.actorNombre || "Sistema Automatizado"}
                  </p>
                </div>
              </div>
            </div>

            {/* Detalles / Payload Forense */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 dark:border-white/10 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-gray-200/60 pb-2.5 dark:border-white/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-700 dark:text-white">
                  Detalles del Registro
                </h4>
                {selectedEvent.detalles ? (
                  <button
                    type="button"
                    onClick={() => handleCopyDetails(selectedEvent.detalles)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold text-gray-500 hover:bg-gray-200/60 hover:text-brand-500 dark:text-white/60 dark:hover:bg-white/10"
                  >
                    {copiedDetail ? (
                      <>
                        <MdOutlineCheck className="h-3 w-3 text-emerald-500" />
                        <span className="text-emerald-500">Copiado</span>
                      </>
                    ) : (
                      <>
                        <MdOutlineContentCopy className="h-3 w-3" />
                        <span>Copiar detalles</span>
                      </>
                    )}
                  </button>
                ) : null}
              </div>
              <div className="mt-3">
                {selectedEvent.detalles ? (
                  <pre className="rounded-xl bg-gray-100 p-3 text-xs font-mono text-navy-700 whitespace-pre-wrap break-all dark:bg-charcoal dark:text-white/90">
                    {selectedEvent.detalles}
                  </pre>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-white/40">
                    Sin datos adicionales registrados para este evento.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-200 dark:bg-white/10 dark:text-white/70"
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
