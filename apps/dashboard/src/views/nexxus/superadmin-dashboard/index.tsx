import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MdOutlineArrowForward,
  MdOutlineBusiness,
  MdOutlinePeople,
  MdOutlineWarningAmber,
  MdOutlineHistory,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import TrendChart from "views/nexxus/components/TrendChart";
import Avatar from "components/nexxus/Avatar";

import { getPlatformStats, subscribePlatform } from "services/superAdminRepository";
import { formatoMoneda, formatoFecha, etiquetaEstadoEmpresa } from "services/saFormat";
import { routeUrl } from "utils/routePath";

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Mapeo seguro de nombres de planes para evitar mostrar UUIDs crudos
const PLAN_NAME_MAP: Record<string, string> = {
  starter: "Starter",
  business: "Business",
  enterprise: "Enterprise",
  "sin plan": "Sin plan",
  "sin_plan": "Sin plan",
};

const PLAN_BADGES: Record<string, { label: string; badge: string; dot: string; barColor: string }> = {
  enterprise: {
    label: "Enterprise",
    badge: "bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300 border border-purple-500/20",
    dot: "bg-purple-500",
    barColor: "bg-purple-500",
  },
  business: {
    label: "Business",
    badge: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300 border border-blue-500/20",
    dot: "bg-blue-500",
    barColor: "bg-blue-500",
  },
  starter: {
    label: "Starter",
    badge: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-500/20",
    dot: "bg-emerald-500",
    barColor: "bg-emerald-500",
  },
  "sin plan": {
    label: "Sin plan",
    badge: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70 border border-gray-200/50 dark:border-white/10",
    dot: "bg-gray-400",
    barColor: "bg-gray-300 dark:bg-white/20",
  },
};

function normalizePlanName(raw: string | null | undefined): string {
  if (!raw) return "Sin plan";
  const str = String(raw).trim();
  const lower = str.toLowerCase();
  if (PLAN_NAME_MAP[lower]) return PLAN_NAME_MAP[lower];
  if (lower.includes("enter")) return "Enterprise";
  if (lower.includes("bus")) return "Business";
  if (lower.includes("start")) return "Starter";
  if (lower.includes("sin")) return "Sin plan";
  // Si es un UUID u otro identificador desconocido
  if (/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(str)) {
    return "Enterprise";
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getPlanBadge(planName: string) {
  const normalized = normalizePlanName(planName).toLowerCase();
  return (
    PLAN_BADGES[normalized] || {
      label: normalizePlanName(planName),
      badge: "bg-brand-500/10 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300 border border-brand-500/20",
      dot: "bg-brand-500",
      barColor: "bg-brand-500",
    }
  );
}

// Formateo de acciones de auditoría en Sentence Case en español
const ACTION_TITLES: Record<string, string> = {
  resolucion_solicitud_ausencia: "Resolución de solicitud de ausencia",
  resolucion_de_solicitud_ausencia: "Resolución de solicitud de ausencia",
  resolucion_solicitud_interna: "Resolución de solicitud interna",
  resolucion_de_solicitud_interna: "Resolución de solicitud interna",
  resolucion_solicitud_extension: "Resolución de extensión de tarea",
  solicitud_ausencia_creada: "Nueva solicitud de ausencia",
  solicitud_interna_creada: "Nueva solicitud interna",
  consulta_ia: "Consulta IA Nexxus",
  consulta_ia_nexxus: "Consulta IA Nexxus",
  interaccion_asistente: "Interacción con Nexxus IA",
  subida_documento: "Subida de documento corporativo",
  documento_subido: "Documento corporativo subido",
  eliminacion_documento: "Eliminación de documento",
  publicacion_anuncio: "Publicación de comunicado empresarial",
  publico_un_anuncio: "Publicación de comunicado empresarial",
  "publicó un anuncio": "Publicación de comunicado empresarial",
  creacion_usuario: "Registro de nuevo colaborador",
  usuario_creado: "Colaborador registrado",
  edicion_usuario: "Actualización de colaborador",
  login: "Inicio de sesión",
  inicio_de_sesion_empresarial: "Inicio de sesión empresarial",
  "inicio de sesion empresarial": "Inicio de sesión empresarial",
  logout: "Cierre de sesión",
  cambio_password: "Cambio de contraseña",
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
  comunicacion: {
    label: "Comunicación",
    badge: "bg-cyan-500/10 text-cyan-600 dark:bg-cyan-400/20 dark:text-cyan-300 border border-cyan-500/15",
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
  seguridad: {
    label: "Seguridad",
    badge: "bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300 border border-rose-500/15",
  },
  auth: {
    label: "Auth",
    badge: "bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300 border border-rose-500/15",
  },
};

function resolveModuleBadge(moduloRaw: string) {
  const key = (moduloRaw || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (MODULE_STYLES[key]) return MODULE_STYLES[key];
  if (key.includes("ia") || key.includes("ai")) return MODULE_STYLES.ia;
  if (key.includes("solicitud")) return MODULE_STYLES.solicitudes;
  if (key.includes("doc")) return MODULE_STYLES.documentos;
  if (key.includes("comunic") || key.includes("anuncio")) return MODULE_STYLES.comunicacion;
  if (key.includes("plantilla") || key.includes("usuario") || key.includes("empleado")) return MODULE_STYLES.usuarios;
  if (key.includes("asistencia") || key.includes("jornada")) return MODULE_STYLES.asistencia;
  if (key.includes("seg") || key.includes("auth") || key.includes("login")) return MODULE_STYLES.auth;

  return {
    label: moduloRaw || "Sistema",
    badge: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70 border border-gray-200/50 dark:border-white/10",
  };
}

function formatearAccionAudit(str: string): string {
  if (!str) return "Operación registrada";
  const normalizedKey = str.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (ACTION_TITLES[normalizedKey]) return ACTION_TITLES[normalizedKey];

  let cleaned = str.replace(/[_-]+/g, " ").trim();
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  cleaned = cleaned
    .replace(/\bia\b/gi, "IA")
    .replace(/\bnexxus\b/gi, "Nexxus")
    .replace(/\brrhh\b/gi, "RRHH")
    .replace(/\bpdf\b/gi, "PDF")
    .replace(/\bdni\b/gi, "DNI")
    .replace(/\bapi\b/gi, "API");
  return cleaned;
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [snapshot, setSnapshot] = useState<{ empresas: any[]; pagos: any[]; auditoria: any[]; usuariosTotal?: number }>({
    empresas: [],
    pagos: [],
    auditoria: [],
  });
  const [error, setError] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState("todos");

  useEffect(() => {
    let active = true;
    getPlatformStats()
      .then((value) => active && setStats(value))
      .catch((err) => active && setError(err.message || "No se pudieron cargar las estadísticas."));
    const unsubscribe = subscribePlatform(
      (value) => active && setSnapshot(value),
      (err) => active && setError(err.message || "No se pudo conectar con el servidor.")
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const ingresosPorMes = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const pago of snapshot.pagos) {
      if (!pago.createdAt) continue;
      const date = new Date(pago.createdAt);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      buckets.set(key, (buckets.get(key) || 0) + (Number(pago.amount) || 0));
    }
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const val = buckets.get(key) || 0;
      months.push({ key, label: MESES_CORTOS[d.getMonth()], value: val });
    }
    const totalMeses = months.reduce((acc, m) => acc + m.value, 0);
    if (totalMeses === 0 && stats?.ingresosTotales) {
      months[months.length - 1].value = stats.ingresosTotales;
    }
    return months;
  }, [snapshot.pagos, stats]);

  const nombreEmpresaPorId = useMemo(() => {
    const map = new Map<string, string>();
    snapshot.empresas.forEach((empresa) => map.set(empresa.id, empresa.nombre));
    return map;
  }, [snapshot.empresas]);

  // Distribución real de planes mapeando correctamente nombres legibles
  const planDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      Enterprise: 0,
      Business: 0,
      Starter: 0,
      "Sin plan": 0,
    };

    if (snapshot.empresas.length > 0) {
      snapshot.empresas.forEach((emp) => {
        const name = normalizePlanName(emp.plan);
        counts[name] = (counts[name] || 0) + 1;
      });
    } else if (stats?.porPlan) {
      Object.entries(stats.porPlan).forEach(([rawKey, val]) => {
        const name = normalizePlanName(rawKey);
        counts[name] = (counts[name] || 0) + Number(val);
      });
    }

    const total = Object.values(counts).reduce((acc, n) => acc + n, 0) || 1;
    return [
      { name: "Enterprise", count: counts.Enterprise || 0, percent: Math.round(((counts.Enterprise || 0) / total) * 100), style: PLAN_BADGES.enterprise },
      { name: "Business", count: counts.Business || 0, percent: Math.round(((counts.Business || 0) / total) * 100), style: PLAN_BADGES.business },
      { name: "Starter", count: counts.Starter || 0, percent: Math.round(((counts.Starter || 0) / total) * 100), style: PLAN_BADGES.starter },
      { name: "Sin plan", count: counts["Sin plan"] || 0, percent: Math.round(((counts["Sin plan"] || 0) / total) * 100), style: PLAN_BADGES["sin plan"] },
    ].filter((item) => item.count > 0);
  }, [snapshot.empresas, stats]);

  const empresasRecientes = useMemo(() => {
    return [...snapshot.empresas]
      .sort((a, b) => (b.fechaCreacion || "").localeCompare(a.fechaCreacion || ""))
      .slice(0, 6)
      .map((empresa) => {
        const planBadge = getPlanBadge(empresa.plan);
        return {
          id: empresa.id,
          nombre: empresa.nombre || "Empresa sin nombre",
          codigo: empresa.codigo || empresa.id.slice(0, 8),
          plan: planBadge.label,
          planBadge: planBadge.badge,
          estado: etiquetaEstadoEmpresa(empresa.estado),
          activo: empresa.estado === "activa" || empresa.paymentStatus === "active",
          fecha: formatoFecha(empresa.fechaCreacion),
        };
      });
  }, [snapshot.empresas]);

  const actividadReciente = useMemo(() => {
    return snapshot.auditoria
      .filter((entry) => {
        if (moduloFiltro === "todos") return true;
        const mod = (entry.modulo || "").toLowerCase();
        if (moduloFiltro === "solicitudes") return mod.includes("solicitud");
        if (moduloFiltro === "ia") return mod.includes("ia") || mod.includes("ai");
        if (moduloFiltro === "documentos") return mod.includes("doc");
        if (moduloFiltro === "comunicacion") return mod.includes("comunic") || mod.includes("anuncio");
        if (moduloFiltro === "auth") return mod.includes("auth") || mod.includes("login") || mod.includes("seg");
        return mod.includes(moduloFiltro);
      })
      .slice(0, 7)
      .map((entry) => {
        const modStyle = resolveModuleBadge(entry.modulo);
        const empresaNombre = entry.empresaNombre || nombreEmpresaPorId.get(entry.empresaId) || "Plataforma";
        return {
          id: entry.id || `${entry.timestamp}-${entry.accion}`,
          accion: formatearAccionAudit(entry.accion),
          modulo: modStyle.label,
          badgeStyle: modStyle.badge,
          empresa: empresaNombre,
          actorNombre: entry.actorNombre || "Administrador",
          fecha: formatoFecha(entry.timestamp),
        };
      });
  }, [snapshot.auditoria, nombreEmpresaPorId, moduloFiltro]);

  return (
    <div className="flex flex-col gap-6 pb-6">
      {/* Banner de error si surge */}
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

      {/* Header Superior con Breadcrumb y Acciones Rápidas */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-navy-700 sm:text-3xl dark:text-white">
            Resumen Global de Plataforma
          </h1>
          <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm dark:text-white/60">
            Monitoreo en tiempo real del ecosistema multi-empresa, suscripciones, usuarios e ingresos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(routeUrl("/admin", "nexxus-empresas"))}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white px-4 py-2 text-xs font-bold text-navy-700 shadow-xs transition duration-150 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
          >
            <MdOutlineBusiness className="h-4 w-4 text-gray-500 dark:text-white/70" />
            <span>Gestionar Empresas</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(routeUrl("/admin", "nexxus-usuarios"))}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-brand-500/25 transition duration-150 hover:bg-brand-600 active:scale-[0.98]"
          >
            <MdOutlinePeople className="h-4 w-4" />
            <span>Gestionar Usuarios</span>
          </button>
        </div>
      </div>

      {!stats ? (
        <div className="flex h-96 w-full flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500 dark:text-white/60">
            Sincronizando métricas globales de plataforma...
          </p>
        </div>
      ) : (
        <>
          {/* Grid Asimétrico: Hero Card Principal (7 cols) + Right Stack (5 cols) */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
            {/* Left Hero Card: Ingresos & Facturación Acumulada (7 columnas) */}
            <div className="lg:col-span-7 flex flex-col">
              <NexxusCard extra="p-6 h-full flex flex-col justify-between" delay={50}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-navy-700 dark:text-white">
                      Facturación Total en Plataforma
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Operación Activa
                    </span>
                  </div>

                  {/* Métrica Gigante */}
                  <div className="mt-4">
                    <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-brand-500 dark:text-brand-300">
                      {formatoMoneda(stats.ingresosTotales)}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-white/60">
                      <span>Últimos 30 días: {formatoMoneda(stats.ingresos30d)}</span>
                      <span className="font-normal text-gray-400 dark:text-white/40">
                        · {stats.empresasTotal} empresas registradas en total
                      </span>
                    </p>
                  </div>

                  {/* Barra de Distribución Proporcional de Empresas por Plan */}
                  <div className="mt-6">
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                      {planDistribution.map((item) => (
                        <div
                          key={item.name}
                          title={`${item.name}: ${item.count} empresas (${item.percent}%)`}
                          className={`${item.style.barColor} transition-all duration-500`}
                          style={{ width: `${item.percent}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Leyenda de Métricas por Plan */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
                  {planDistribution.map((item) => (
                    <div key={item.name}>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${item.style.dot} shrink-0`} />
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

            {/* Right Column: Stack de 3 Cards de Telemetría Clave (5 columnas) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Stat Card 1: Empresas Activas */}
              <NexxusCard
                extra="p-5 flex-1 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                delay={100}
                onClick={() => navigate(routeUrl("/admin", "nexxus-empresas"))}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                    Empresas en Plataforma
                  </p>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.empresasActivas} activas
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {stats.empresasTotal}
                  </h4>
                  <span className="text-xs text-gray-400 dark:text-white/40">
                    {stats.empresasTotal - stats.empresasActivas} suspendidas
                  </span>
                </div>
              </NexxusCard>

              {/* Stat Card 2: Usuarios del Ecosistema */}
              <NexxusCard
                extra="p-5 flex-1 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                delay={130}
                onClick={() => navigate(routeUrl("/admin", "nexxus-usuarios"))}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                    Usuarios en el Ecosistema
                  </p>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.usuariosActivos} activos
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {stats.usuariosTotal}
                  </h4>
                  <span className="text-xs text-gray-400 dark:text-white/40">
                    {stats.usuariosTotal - stats.usuariosActivos} inactivos
                  </span>
                </div>
              </NexxusCard>

              {/* Stat Card 3: Ingresos Últimos 30 Días */}
              <NexxusCard
                extra="p-5 flex-1 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                delay={160}
                onClick={() => navigate(routeUrl("/admin", "nexxus-pagos"))}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                    Facturación Período Actual
                  </p>
                  <span className="text-xs font-bold text-brand-500 hover:underline flex items-center gap-1">
                    Ver Pagos <MdOutlineArrowForward className="h-3 w-3" />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {formatoMoneda(stats.ingresos30d)}
                  </h4>
                  <span className="text-xs text-gray-400 dark:text-white/40">
                    Cobros de los últimos 30d
                  </span>
                </div>
              </NexxusCard>
            </div>
          </div>

          {/* Barra de Telemetría Global Continua */}
          <NexxusCard extra="p-0 overflow-hidden shadow-xs" delay={180}>
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-white/[0.08]">
              {/* Telemetría 1 */}
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Ecosistema Empresarial</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {stats.empresasTotal}
                  </span>
                  <span className="text-xs font-medium text-gray-500 dark:text-white/60">
                    empresas clientes
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
                  {stats.empresasActivas === stats.empresasTotal ? "100% organizaciones activas" : `${stats.empresasActivas} activas`}
                </p>
              </div>

              {/* Telemetría 2 */}
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Población de Usuarios</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {stats.usuariosActivos}
                  </span>
                  <span className="text-xs font-medium text-gray-500 dark:text-white/60">
                    colaboradores activos
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
                  De {stats.usuariosTotal} cuentas registradas
                </p>
              </div>

              {/* Telemetría 3 */}
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Tasa de Suscripción</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {stats.empresasTotal > 0 ? `${Math.round((stats.empresasActivas / stats.empresasTotal) * 100)}%` : "100%"}
                  </span>
                  <span className="text-xs font-medium text-gray-500 dark:text-white/60">
                    retención
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
                  Renovación continua activa
                </p>
              </div>

              {/* Telemetría 4 */}
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Trazabilidad & Logs</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {snapshot.auditoria.length}
                  </span>
                  <span className="text-xs font-medium text-gray-500 dark:text-white/60">
                    eventos recientes
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400 dark:text-white/40">
                  Auditoría multi-tenant en vivo
                </p>
              </div>
            </div>
          </NexxusCard>

          {/* Sección Media: Gráfico de Ingresos (2/3) + Distribución de Suscripciones (1/3) */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 items-stretch">
            {/* Gráfico de Ingresos Mensuales (2 columnas) */}
            <div className="xl:col-span-2 flex flex-col h-full">
              <TrendChart
                title="Historial de Facturación (Últimos 6 meses)"
                total={formatoMoneda(stats.ingresosTotales)}
                change={`Último mes: ${formatoMoneda(stats.ingresos30d)}`}
                series={[
                  {
                    name: "Ingresos",
                    data: ingresosPorMes.map((m) => m.value),
                    color: "#422AFB",
                  },
                ]}
                categories={ingresosPorMes.map((m) => m.label)}
                delay={200}
              />
            </div>

            {/* Panel de Suscripciones y Planes (1 columna) */}
            <div className="xl:col-span-1 flex flex-col h-full">
              <NexxusCard extra="p-6 flex flex-col justify-between h-full" delay={220}>
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 dark:border-white/10">
                    <h4 className="text-sm sm:text-base font-bold text-navy-700 dark:text-white">
                      Distribución por Plan
                    </h4>
                    <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-bold text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
                      {stats.empresasTotal} Empresas
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-3.5">
                    {planDistribution.map((plan) => (
                      <div key={plan.name} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${plan.style.dot}`} />
                            <span className="font-bold text-navy-700 dark:text-white">{plan.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-semibold text-gray-500 dark:text-white/70">
                            <span>{plan.count} {plan.count === 1 ? "empresa" : "empresas"}</span>
                            <span className="text-[11px] text-gray-400 dark:text-white/40">({plan.percent}%)</span>
                          </div>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                          <div
                            className={`h-full ${plan.style.barColor} rounded-full transition-all duration-500`}
                            style={{ width: `${plan.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 dark:border-white/10">
                  <Link
                    to={routeUrl("/admin", "nexxus-pagos")}
                    className="flex items-center justify-center gap-1.5 text-xs font-bold text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    <span>Configuración de planes & precios</span>
                    <MdOutlineArrowForward className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </NexxusCard>
            </div>
          </div>

          {/* Sección Inferior: Empresas Recientes (1/2) + Feed de Actividad Global (1/2) */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 items-stretch">
            {/* Empresas Recientes */}
            <div className="flex flex-col h-full">
              <NexxusCard extra="p-6 flex flex-col justify-between h-full" delay={240}>
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 dark:border-white/10">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-navy-700 dark:text-white">
                        Empresas Recientes
                      </h4>
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-white/40">
                        Últimas organizaciones incorporadas a la plataforma
                      </p>
                    </div>
                    <Link
                      to={routeUrl("/admin", "nexxus-empresas")}
                      className="text-xs font-bold text-brand-500 hover:underline"
                    >
                      Ver todas ({snapshot.empresas.length})
                    </Link>
                  </div>

                  {empresasRecientes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                      <p className="text-sm font-medium">No hay empresas registradas aún.</p>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-col gap-2.5">
                      {empresasRecientes.map((emp) => (
                        <div
                          key={emp.id}
                          onClick={() => navigate(routeUrl("/admin", "nexxus-empresas"))}
                          className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-100/80 bg-white/70 p-3 shadow-xs cursor-pointer transition-all duration-200 hover:border-gray-200 hover:bg-white hover:shadow-sm dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-white/10 dark:hover:bg-white/[0.04]"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <Avatar
                              name={emp.nombre}
                              size={9}
                            />
                            <div className="min-w-0 flex flex-col gap-0.5">
                              <p className="truncate text-xs sm:text-sm font-bold text-navy-700 dark:text-white group-hover:text-brand-500 transition-colors">
                                {emp.nombre}
                              </p>
                              <p className="truncate text-[11px] font-medium text-gray-400 dark:text-white/50">
                                Código: <span className="font-semibold text-gray-600 dark:text-gray-300">{emp.codigo}</span> · Registrada el {emp.fecha}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 pl-2">
                            <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${emp.planBadge}`}>
                              {emp.plan}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {emp.estado}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
                  <Link
                    to={routeUrl("/admin", "nexxus-empresas")}
                    className="flex items-center justify-center gap-1.5 text-xs font-bold text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    <span>Directorio completo de organizaciones</span>
                    <MdOutlineArrowForward className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </NexxusCard>
            </div>

            {/* Feed de Actividad Global */}
            <div className="flex flex-col h-full">
              <NexxusCard extra="p-6 flex flex-col justify-between h-full" delay={260}>
                <div>
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center border-b border-gray-100 pb-3.5 dark:border-white/10">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-navy-700 dark:text-white">
                        Actividad Global del Sistema
                      </h4>
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-white/40">
                        Eventos de auditoría multi-empresa
                      </p>
                    </div>

                    {/* Selector de Filtro Segmentado */}
                    <div className="flex flex-wrap items-center gap-1 rounded-xl bg-gray-100/80 p-1 dark:bg-white/5">
                      {[
                        { id: "todos", label: "Todos" },
                        { id: "solicitudes", label: "Solicitudes" },
                        { id: "ia", label: "IA" },
                        { id: "documentos", label: "Docs" },
                        { id: "auth", label: "Auth" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setModuloFiltro(tab.id)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-150 ${
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
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300 font-bold text-xs">
                              <MdOutlineHistory className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex flex-col gap-0.5">
                              <p className="truncate text-xs sm:text-sm font-bold text-navy-700 dark:text-white">
                                {item.accion}
                              </p>
                              <p className="truncate text-[11px] font-medium text-gray-400 dark:text-white/50">
                                Empresa: <span className="font-semibold text-gray-600 dark:text-gray-300">{item.empresa}</span> · {item.actorNombre}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 pl-2">
                            <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${item.badgeStyle}`}>
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

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
                  <Link
                    to={routeUrl("/admin", "nexxus-auditoria")}
                    className="flex items-center justify-center gap-1.5 text-xs font-bold text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    <span>Centro de auditoría y trazabilidad</span>
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
