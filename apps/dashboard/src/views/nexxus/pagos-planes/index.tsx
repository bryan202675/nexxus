import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdOutlineAttachMoney,
  MdOutlineTrendingUp,
  MdOutlineBusiness,
  MdOutlineSearch,
  MdOutlineContentCopy,
  MdOutlineCheck,
  MdOutlineFilterList,
  MdOutlineReceiptLong,
  MdOutlineCalendarToday,
  MdOutlineArrowForward,
  MdOutlineArrowBack,
  MdOutlineVisibility,
  MdOutlineClose,
  MdOutlineCheckCircleOutline,
  MdOutlineAccessTime,
  MdOutlineWarningAmber,
  MdOutlineFileDownload,
  MdOutlinePayments,
  MdOutlineCreditCard,
  MdOutlineStorefront,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import TrendChart from "views/nexxus/components/TrendChart";
import Avatar from "components/nexxus/Avatar";
import useIsDarkMode from "views/nexxus/utils/useIsDarkMode";

import {
  getPlatformStats,
  subscribePayments,
  loadMoreCompanies,
} from "services/superAdminRepository";
import { formatoMoneda, formatoFecha, formatoFechaHora } from "services/saFormat";
import { routeUrl } from "utils/routePath";

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Mapeo seguro de planes para evitar mostrar UUIDs
const PLAN_NAME_MAP: Record<string, string> = {
  starter: "Starter",
  business: "Business",
  enterprise: "Enterprise",
  "sin plan": "Sin plan",
  sin_plan: "Sin plan",
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

const STATUS_STYLES: Record<
  string,
  { label: string; badge: string; dot: string; icon: React.ElementType }
> = {
  confirmado: {
    label: "Confirmado",
    badge: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-500/20",
    dot: "bg-emerald-500",
    icon: MdOutlineCheckCircleOutline,
  },
  completado: {
    label: "Confirmado",
    badge: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-500/20",
    dot: "bg-emerald-500",
    icon: MdOutlineCheckCircleOutline,
  },
  succeeded: {
    label: "Confirmado",
    badge: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-500/20",
    dot: "bg-emerald-500",
    icon: MdOutlineCheckCircleOutline,
  },
  pendiente: {
    label: "Pendiente",
    badge: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-500/20",
    dot: "bg-amber-500",
    icon: MdOutlineAccessTime,
  },
  pending: {
    label: "Pendiente",
    badge: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-500/20",
    dot: "bg-amber-500",
    icon: MdOutlineAccessTime,
  },
  fallido: {
    label: "Fallido",
    badge: "bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300 border border-rose-500/20",
    dot: "bg-rose-500",
    icon: MdOutlineWarningAmber,
  },
  failed: {
    label: "Fallido",
    badge: "bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300 border border-rose-500/20",
    dot: "bg-rose-500",
    icon: MdOutlineWarningAmber,
  },
  cancelado: {
    label: "Cancelado",
    badge: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70 border border-gray-200/50 dark:border-white/10",
    dot: "bg-gray-400",
    icon: MdOutlineClose,
  },
};

function getPaymentStatusStyle(estado: string | null | undefined) {
  const key = String(estado || "pendiente").toLowerCase().trim();
  if (STATUS_STYLES[key]) return STATUS_STYLES[key];
  if (key.includes("conf") || key.includes("comp") || key.includes("exito") || key.includes("succ")) {
    return STATUS_STYLES.confirmado;
  }
  if (key.includes("pend")) return STATUS_STYLES.pendiente;
  if (key.includes("fall") || key.includes("err") || key.includes("rech") || key.includes("fail")) {
    return STATUS_STYLES.fallido;
  }
  return {
    label: estado || "Pendiente",
    badge: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70 border border-gray-200/50 dark:border-white/10",
    dot: "bg-gray-400",
    icon: MdOutlineAccessTime,
  };
}

// Componente de tarjeta de metadatos con soporte de copia
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

const PagosPlanes = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [statsError, setStatsError] = useState("");

  const [pagos, setPagos] = useState<any[]>([]);
  const [pagosCargando, setPagosCargando] = useState(true);
  const [pagosError, setPagosError] = useState("");

  const [empresasMap, setEmpresasMap] = useState<Record<string, { nombre: string; plan: string; codigo?: string }>>({});
  const [empresasLista, setEmpresasLista] = useState<Array<{ id: string; nombre: string; plan: string; codigo?: string }>>([]);

  // Filtros & Controles
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroEmpresa, setFiltroEmpresa] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<"recientes" | "antiguos" | "monto_mayor" | "monto_menor">("recientes");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(10);

  // Modal de Detalle
  const [pagoSeleccionado, setPagoSeleccionado] = useState<any | null>(null);
  const [copiadoId, setCopiadoId] = useState(false);
  const [copiadoRef, setCopiadoRef] = useState(false);

  // 1. Cargar Estadísticas
  useEffect(() => {
    let active = true;
    getPlatformStats()
      .then((value) => {
        if (active) setStats(value);
      })
      .catch((err) => {
        if (active) setStatsError(err.message || "No se pudieron cargar las estadísticas.");
      });
    return () => {
      active = false;
    };
  }, []);

  // 2. Suscribirse a Pagos
  useEffect(() => {
    const unsubscribe = subscribePayments(
      200,
      ({ items }) => {
        setPagos(items || []);
        setPagosCargando(false);
      },
      (err) => {
        setPagosError(err.message || "No se pudieron cargar los pagos.");
        setPagosCargando(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 3. Cargar Mapa de Empresas para nombres y planes
  useEffect(() => {
    let active = true;
    loadMoreCompanies({}, 500, null)
      .then(({ items }) => {
        if (!active) return;
        const mapa: Record<string, { nombre: string; plan: string; codigo?: string }> = {};
        const lista: Array<{ id: string; nombre: string; plan: string; codigo?: string }> = [];
        (items || []).forEach((empresa) => {
          const empObj = {
            id: empresa.id,
            nombre: empresa.nombre || "Empresa sin nombre",
            plan: empresa.plan || "Sin plan",
            codigo: empresa.codigo || (empresa.id ? empresa.id.slice(0, 8) : "—"),
          };
          mapa[empresa.id] = empObj;
          lista.push(empObj);
        });
        setEmpresasMap(mapa);
        setEmpresasLista(lista);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Distribución de planes
  const planDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      Enterprise: 0,
      Business: 0,
      Starter: 0,
      "Sin plan": 0,
    };

    if (empresasLista.length > 0) {
      empresasLista.forEach((emp) => {
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
  }, [empresasLista, stats]);

  // Ingresos por mes para TrendChart
  const ingresosPorMes = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const pago of pagos) {
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
  }, [pagos, stats]);

  // Conteo por estados para filtros segmentados
  const conteoEstados = useMemo(() => {
    let confirmados = 0;
    let pendientes = 0;
    let fallidos = 0;

    pagos.forEach((p) => {
      const st = String(p.status || "").toLowerCase();
      if (st.includes("conf") || st.includes("comp") || st.includes("exito") || st.includes("succ")) {
        confirmados++;
      } else if (st.includes("pend")) {
        pendientes++;
      } else if (st.includes("fall") || st.includes("err") || st.includes("rech") || st.includes("canc")) {
        fallidos++;
      } else {
        pendientes++;
      }
    });

    return {
      todos: pagos.length,
      confirmados,
      pendientes,
      fallidos,
    };
  }, [pagos]);

  // Filtrado y ordenamiento de pagos
  const pagosFiltrados = useMemo(() => {
    let resultado = pagos.map((pago) => {
      const empresaInfo = empresasMap[pago.empresaId] || {
        nombre: pago.empresaId !== "sin_empresa" ? `Empresa (${pago.empresaId.slice(0, 8)})` : "Empresa no especificada",
        plan: pago.plan || "Sin plan",
        codigo: pago.empresaId !== "sin_empresa" ? pago.empresaId.slice(0, 8) : "—",
      };
      const planResolved = pago.plan || empresaInfo.plan || "Sin plan";
      const planBadge = getPlanBadge(planResolved);
      const statusStyle = getPaymentStatusStyle(pago.status);

      return {
        ...pago,
        empresaNombre: empresaInfo.nombre,
        empresaCodigo: empresaInfo.codigo,
        planNombre: planBadge.label,
        planBadge: planBadge.badge,
        planDot: planBadge.dot,
        statusStyle,
        montoFormateado: formatoMoneda(pago.amount),
        fechaFormateada: formatoFechaHora(pago.createdAt),
        fechaCorta: formatoFecha(pago.createdAt),
      };
    });

    // Filtro por Estado
    if (filtroEstado !== "todos") {
      resultado = resultado.filter((p) => {
        const st = String(p.status || "").toLowerCase();
        if (filtroEstado === "confirmados") {
          return st.includes("conf") || st.includes("comp") || st.includes("exito") || st.includes("succ");
        }
        if (filtroEstado === "pendientes") {
          return st.includes("pend");
        }
        if (filtroEstado === "fallidos") {
          return st.includes("fall") || st.includes("err") || st.includes("rech") || st.includes("canc");
        }
        return true;
      });
    }

    // Filtro por Empresa
    if (filtroEmpresa !== "todas") {
      resultado = resultado.filter((p) => p.empresaId === filtroEmpresa);
    }

    // Filtro por Búsqueda
    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim();
      resultado = resultado.filter(
        (p) =>
          p.empresaNombre.toLowerCase().includes(term) ||
          p.empresaCodigo.toLowerCase().includes(term) ||
          p.planNombre.toLowerCase().includes(term) ||
          String(p.referencia || "").toLowerCase().includes(term) ||
          String(p.id || "").toLowerCase().includes(term) ||
          String(p.amount || "").includes(term)
      );
    }

    // Ordenamiento
    resultado.sort((a, b) => {
      if (orden === "recientes") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (orden === "antiguos") {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (orden === "monto_mayor") {
        return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      }
      if (orden === "monto_menor") {
        return (Number(a.amount) || 0) - (Number(b.amount) || 0);
      }
      return 0;
    });

    return resultado;
  }, [pagos, empresasMap, filtroEstado, filtroEmpresa, busqueda, orden]);

  // Reiniciar a la primera página al cambiar filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroEstado, filtroEmpresa, busqueda, orden, filasPorPagina]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(pagosFiltrados.length / filasPorPagina));
  const pagosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * filasPorPagina;
    return pagosFiltrados.slice(inicio, inicio + filasPorPagina);
  }, [pagosFiltrados, paginaActual, filasPorPagina]);

  // Copiar ID o Referencia
  const handleCopy = (text: string, type: "id" | "ref") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiadoId(true);
      setTimeout(() => setCopiadoId(false), 2000);
    } else {
      setCopiadoRef(true);
      setTimeout(() => setCopiadoRef(false), 2000);
    }
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    if (!pagosFiltrados.length) return;
    const headers = ["ID Transaccion", "Empresa", "Codigo Empresa", "Plan", "Monto", "Estado", "Referencia Externa", "Fecha"];
    const rows = pagosFiltrados.map((p) => [
      `"${p.id || ""}"`,
      `"${p.empresaNombre || ""}"`,
      `"${p.empresaCodigo || ""}"`,
      `"${p.planNombre || ""}"`,
      `"${p.amount || 0}"`,
      `"${p.statusStyle?.label || p.status || ""}"`,
      `"${p.referencia || ""}"`,
      `"${p.fechaFormateada || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nexxus_pagos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Alertas de error si ocurren */}
      {(statsError || pagosError) && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300">
          <div className="flex items-center gap-2">
            <MdOutlineWarningAmber className="h-5 w-5 shrink-0" />
            <span>{statsError || pagosError}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setStatsError("");
              setPagosError("");
            }}
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
            Pagos & Facturación Global
          </h1>
          <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm dark:text-white/60">
            Control de transacciones, conciliación financiera, ingresos del ecosistema y suscripciones activas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={pagosFiltrados.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white px-3.5 py-2 text-xs font-bold text-navy-700 shadow-xs transition duration-150 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
          >
            <MdOutlineFileDownload className="h-4 w-4 text-gray-500 dark:text-white/70" />
            <span>Exportar CSV</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(routeUrl("/admin", "nexxus-empresas"))}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-brand-500/25 transition duration-150 hover:bg-brand-600 active:scale-[0.98]"
          >
            <MdOutlineBusiness className="h-4 w-4" />
            <span>Gestionar Empresas</span>
          </button>
        </div>
      </div>

      {!stats && pagosCargando ? (
        <div className="flex h-96 w-full flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500 dark:text-white/60">
            Sincronizando información financiera y pasarela de pagos...
          </p>
        </div>
      ) : (
        <>
          {/* Grid Asimétrico Superior (7+5 cols) */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
            {/* Hero Card (7 cols): Ingresos Confirmados */}
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

                  {/* Métrica Principal */}
                  <div className="mt-4">
                    <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-brand-500 dark:text-brand-300">
                      {formatoMoneda(stats?.ingresosTotales || 0)}
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-white/60">
                      <span>Últimos 30 días: {formatoMoneda(stats?.ingresos30d || 0)}</span>
                      <span className="font-normal text-gray-400 dark:text-white/40">
                        · {stats?.empresasTotal || empresasLista.length} organizaciones con plan
                      </span>
                    </p>
                  </div>

                  {/* Barra de Distribución Proporcional de Suscripciones */}
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

                {/* Leyenda de Distribución por Plan */}
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

            {/* Right Stack (5 cols - 3 tarjetas) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Stat 1: Ingresos 30 Días */}
              <NexxusCard extra="p-5 flex-1 flex flex-col justify-between" delay={100}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                    Ingresos Últimos 30 Días
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
                    <MdOutlineTrendingUp className="h-3 w-3" />
                    Período Activo
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {formatoMoneda(stats?.ingresos30d || 0)}
                  </h4>
                  <span className="text-xs text-gray-400 dark:text-white/40">
                    Cobros del mes en curso
                  </span>
                </div>
              </NexxusCard>

              {/* Stat 2: Empresas con Plan */}
              <NexxusCard extra="p-5 flex-1 flex flex-col justify-between" delay={130}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                    Empresas con Plan Activo
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                    <MdOutlineBusiness className="h-3 w-3" />
                    Suscripciones
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {stats?.empresasTotal || empresasLista.length}
                  </h4>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    100% con licencia
                  </span>
                </div>
              </NexxusCard>

              {/* Stat 3: Total Transacciones */}
              <NexxusCard extra="p-5 flex-1 flex flex-col justify-between" delay={160}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                    Transacciones Registradas
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                    <MdOutlineReceiptLong className="h-3 w-3" />
                    Conciliado
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {pagos.length}
                  </h4>
                  <span className="text-xs text-gray-400 dark:text-white/40">
                    {conteoEstados.confirmados} confirmadas · {conteoEstados.pendientes} pend.
                  </span>
                </div>
              </NexxusCard>
            </div>
          </div>

          {/* Sección Media: Historial de Facturación & Distribución de Planes */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 items-stretch">
            {/* Gráfico de Tendencia (2 cols) */}
            <div className="xl:col-span-2 flex flex-col h-full">
              <TrendChart
                title="Historial de Facturación (Últimos 6 meses)"
                total={formatoMoneda(stats?.ingresosTotales || 0)}
                change={`Último mes: ${formatoMoneda(stats?.ingresos30d || 0)}`}
                series={[
                  {
                    name: "Ingresos",
                    data: ingresosPorMes.map((m) => m.value),
                    color: "#422AFB",
                  },
                ]}
                categories={ingresosPorMes.map((m) => m.label)}
                delay={180}
              />
            </div>

            {/* Panel de Distribución por Plan (1 col) */}
            <div className="xl:col-span-1 flex flex-col h-full">
              <NexxusCard extra="p-6 flex flex-col justify-between h-full" delay={200}>
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 dark:border-white/10">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-navy-700 dark:text-white">
                        Distribución de Planes
                      </h4>
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-white/40">
                        Segmentación de cartera corporativa
                      </p>
                    </div>
                    <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-bold text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
                      {stats?.empresasTotal || empresasLista.length} Clientes
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
                            <span>
                              {plan.count} {plan.count === 1 ? "empresa" : "empresas"}
                            </span>
                            <span className="text-[11px] text-gray-400 dark:text-white/40">
                              ({plan.percent}%)
                            </span>
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
                  <button
                    type="button"
                    onClick={() => navigate(routeUrl("/admin", "nexxus-empresas"))}
                    className="flex w-full items-center justify-center gap-1.5 text-xs font-bold text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    <span>Ver catálogo de empresas y planes</span>
                    <MdOutlineArrowForward className="h-3.5 w-3.5" />
                  </button>
                </div>
              </NexxusCard>
            </div>
          </div>

          {/* Sección Inferior: Tabla de Transacciones & Pagos Recientes */}
          <NexxusCard extra="p-6 overflow-hidden" delay={220}>
            {/* Header de la Tabla y Filtros */}
            <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 dark:border-white/10">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-navy-700 dark:text-white">
                    Historial de Transacciones Financieras
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-white/50">
                    Mostrando {pagosFiltrados.length} transacciones {busqueda || filtroEmpresa !== "todas" ? "filtradas" : "en plataforma"}
                  </p>
                </div>

                {/* Filtro Segmentado por Estado */}
                <div className="flex flex-wrap items-center gap-1 rounded-xl bg-gray-100/80 p-1 dark:bg-white/5">
                  {[
                    { id: "todos", label: "Todos", count: conteoEstados.todos },
                    { id: "confirmados", label: "Confirmados", count: conteoEstados.confirmados },
                    { id: "pendientes", label: "Pendientes", count: conteoEstados.pendientes },
                    { id: "fallidos", label: "Fallidos", count: conteoEstados.fallidos },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFiltroEstado(tab.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                        filtroEstado === tab.id
                          ? "bg-white text-brand-500 shadow-xs font-bold dark:bg-charcoal dark:text-white"
                          : "text-gray-500 hover:text-navy-700 dark:text-white/60 dark:hover:text-white"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                          filtroEstado === tab.id
                            ? "bg-brand-500/10 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300"
                            : "bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-white/60"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Barra de Búsqueda y Selectores */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                {/* Buscador */}
                <div className="relative sm:col-span-6 lg:col-span-6">
                  <MdOutlineSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por empresa, referencia, monto o plan..."
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

                {/* Selector de Empresa */}
                <div className="sm:col-span-3 lg:col-span-3">
                  <select
                    value={filtroEmpresa}
                    onChange={(e) => setFiltroEmpresa(e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200/80 bg-white/80 px-3 text-xs font-medium text-navy-700 shadow-xs outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                  >
                    <option value="todas">Todas las empresas</option>
                    {empresasLista.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector de Orden */}
                <div className="sm:col-span-3 lg:col-span-3">
                  <select
                    value={orden}
                    onChange={(e) => setOrden(e.target.value as any)}
                    className="h-10 w-full rounded-xl border border-gray-200/80 bg-white/80 px-3 text-xs font-medium text-navy-700 shadow-xs outline-none transition focus:border-brand-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                  >
                    <option value="recientes">Más recientes primero</option>
                    <option value="antiguos">Más antiguos primero</option>
                    <option value="monto_mayor">Mayor importe ($)</option>
                    <option value="monto_menor">Menor importe ($)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabla de Pagos */}
            <div className="mt-4 overflow-x-auto">
              {pagosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/40">
                    <MdOutlineReceiptLong className="h-7 w-7" />
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
                    No se encontraron transacciones
                  </h4>
                  <p className="mt-1 max-w-sm text-xs text-gray-400 dark:text-white/50">
                    No hay registros de pago que coincidan con los criterios de búsqueda o filtros seleccionados.
                  </p>
                  {(busqueda || filtroEstado !== "todos" || filtroEmpresa !== "todas") && (
                    <button
                      type="button"
                      onClick={() => {
                        setBusqueda("");
                        setFiltroEstado("todos");
                        setFiltroEmpresa("todas");
                      }}
                      className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-brand-500 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:border-white/10 dark:text-white/40">
                      <th className="pb-3 pl-2">Empresa</th>
                      <th className="pb-3 px-3">Plan</th>
                      <th className="pb-3 px-3">Referencia / ID</th>
                      <th className="pb-3 px-3">Estado</th>
                      <th className="pb-3 px-3">Importe</th>
                      <th className="pb-3 px-3">Fecha</th>
                      <th className="pb-3 pr-2 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                    {pagosPaginados.map((pago) => {
                      return (
                        <tr
                          key={pago.id}
                          className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                        >
                          {/* Empresa */}
                          <td className="py-3.5 pl-2">
                            <div className="flex items-center gap-3">
                              <Avatar name={pago.empresaNombre} size={8} />
                              <div className="min-w-0">
                                <p className="truncate text-xs sm:text-sm font-bold text-navy-700 dark:text-white group-hover:text-brand-500 transition-colors">
                                  {pago.empresaNombre}
                                </p>
                                <p className="truncate text-[11px] font-medium text-gray-400 dark:text-white/40">
                                  Código: {pago.empresaCodigo}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Plan */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold ${pago.planBadge}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${pago.planDot}`} />
                              {pago.planNombre}
                            </span>
                          </td>

                          {/* Referencia */}
                          <td className="py-3.5 px-3 font-mono text-xs text-gray-500 dark:text-white/70">
                            <span className="rounded-md bg-gray-100/80 px-2 py-0.5 dark:bg-white/5">
                              {pago.referencia || pago.id?.slice(0, 8) || "—"}
                            </span>
                          </td>

                          {/* Estado */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${pago.statusStyle.badge}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${pago.statusStyle.dot} animate-pulse`} />
                              {pago.statusStyle.label}
                            </span>
                          </td>

                          {/* Importe */}
                          <td className="py-3.5 px-3 font-black text-xs sm:text-sm text-navy-700 dark:text-white">
                            {pago.montoFormateado}
                          </td>

                          {/* Fecha */}
                          <td className="py-3.5 px-3 text-xs text-gray-500 dark:text-white/60">
                            {pago.fechaFormateada}
                          </td>

                          {/* Acciones */}
                          <td className="py-3.5 pr-2 text-right">
                            <button
                              type="button"
                              onClick={() => setPagoSeleccionado(pago)}
                              className="inline-flex items-center gap-1 rounded-xl border border-gray-200/80 bg-white px-2.5 py-1.5 text-xs font-bold text-navy-700 shadow-2xs transition hover:border-brand-500 hover:bg-brand-50/50 hover:text-brand-600 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
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
              )}
            </div>

            {/* Paginación Inferior */}
            {pagosFiltrados.length > 0 && (
              <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row dark:border-white/10">
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-white/60">
                  <span>
                    Mostrando{" "}
                    <span className="font-bold text-navy-700 dark:text-white">
                      {Math.min((paginaActual - 1) * filasPorPagina + 1, pagosFiltrados.length)}
                    </span>{" "}
                    -{" "}
                    <span className="font-bold text-navy-700 dark:text-white">
                      {Math.min(paginaActual * filasPorPagina, pagosFiltrados.length)}
                    </span>{" "}
                    de{" "}
                    <span className="font-bold text-navy-700 dark:text-white">
                      {pagosFiltrados.length}
                    </span>{" "}
                    transacciones
                  </span>

                  <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200 dark:border-white/10">
                    <span className="text-[11px] text-gray-400">Por página:</span>
                    <select
                      value={filasPorPagina}
                      onChange={(e) => setFilasPorPagina(Number(e.target.value))}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-navy-700 outline-none dark:border-white/10 dark:bg-charcoal dark:text-white"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
                    disabled={paginaActual === 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200/80 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-charcoal dark:text-white"
                  >
                    <MdOutlineArrowBack className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPaginas || Math.abs(p - paginaActual) <= 1)
                      .map((p, idx, arr) => {
                        const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                        return (
                          <React.Fragment key={p}>
                            {showEllipsis && (
                              <span className="px-1 text-xs text-gray-400">...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setPaginaActual(p)}
                              className={`h-8 min-w-[32px] rounded-xl px-2 text-xs font-bold transition ${
                                paginaActual === p
                                  ? "bg-brand-500 text-white shadow-xs"
                                  : "border border-gray-200/80 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-charcoal dark:text-white"
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
                    disabled={paginaActual === totalPaginas}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200/80 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-charcoal dark:text-white"
                  >
                    <MdOutlineArrowForward className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </NexxusCard>
        </>
      )}

      {/* Modal de Detalle de Transacción */}
      {pagoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl transition-all dark:border-white/10 dark:bg-charcoal">
            {/* Header del Modal */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
                  <MdOutlineReceiptLong className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-navy-700 dark:text-white">
                    Detalle de Transacción Financiera
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-white/50">
                    ID: <span className="font-mono">{pagoSeleccionado.id?.slice(0, 16)}...</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPagoSeleccionado(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-navy-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <MdOutlineClose className="h-5 w-5" />
              </button>
            </div>

            {/* Métrica de Importe Grande */}
            <div className="my-5 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 text-center dark:border-white/5 dark:bg-white/[0.02]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                Importe Facturado
              </p>
              <h2 className="mt-1 text-3xl sm:text-4xl font-black text-navy-700 dark:text-white">
                {pagoSeleccionado.montoFormateado}
              </h2>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold ${pagoSeleccionado.statusStyle?.badge}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${pagoSeleccionado.statusStyle?.dot} animate-pulse`} />
                  {pagoSeleccionado.statusStyle?.label}
                </span>
                <span className="text-xs text-gray-400 dark:text-white/40">·</span>
                <span className="text-xs font-semibold text-gray-500 dark:text-white/60">
                  {pagoSeleccionado.fechaFormateada}
                </span>
              </div>
            </div>

            {/* Cuadrícula de Metadatos */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MetaCard
                icon={MdOutlineStorefront}
                label="Organización Cliente"
                value={pagoSeleccionado.empresaNombre}
              />
              <MetaCard
                icon={MdOutlineCreditCard}
                label="Plan Contratado"
                value={
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${pagoSeleccionado.planBadge}`}
                  >
                    {pagoSeleccionado.planNombre}
                  </span>
                }
              />
              <MetaCard
                icon={MdOutlineReceiptLong}
                label="Referencia de Pago"
                value={<span className="font-mono text-xs">{pagoSeleccionado.referencia || "—"}</span>}
                copyable={Boolean(pagoSeleccionado.referencia)}
                copied={copiadoRef}
                onCopy={() => handleCopy(pagoSeleccionado.referencia, "ref")}
              />
              <MetaCard
                icon={MdOutlineCalendarToday}
                label="ID Único de Registro"
                value={<span className="font-mono text-xs truncate max-w-[140px] block">{pagoSeleccionado.id || "—"}</span>}
                copyable={Boolean(pagoSeleccionado.id)}
                copied={copiadoId}
                onCopy={() => handleCopy(pagoSeleccionado.id, "id")}
              />
            </div>

            {/* Footer de Acciones */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
              <button
                type="button"
                onClick={() => setPagoSeleccionado(null)}
                className="rounded-xl border border-gray-200/80 bg-white px-4 py-2 text-xs font-bold text-navy-700 shadow-xs transition hover:bg-gray-50 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagosPlanes;
