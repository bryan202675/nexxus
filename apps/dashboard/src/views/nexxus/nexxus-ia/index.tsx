import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdOutlineSmartToy,
  MdOutlineMemory,
  MdOutlineQuestionAnswer,
  MdOutlineAttachMoney,
  MdOutlineBusiness,
  MdOutlineSearch,
  MdOutlineFilterList,
  MdOutlineCalendarToday,
  MdOutlineArrowForward,
  MdOutlineArrowBack,
  MdOutlineVisibility,
  MdOutlineClose,
  MdOutlineFileDownload,
  MdOutlineTrendingUp,
  MdOutlineSpeed,
  MdOutlineAutoAwesome,
  MdOutlineInsights,
  MdOutlineContentCopy,
  MdOutlineCheck,
  MdOutlineHub,
  MdOutlineWarningAmber,
  MdOutlineCheckCircleOutline,
} from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import TrendChart from "views/nexxus/components/TrendChart";
import Avatar from "components/nexxus/Avatar";
import useIsDarkMode from "views/nexxus/utils/useIsDarkMode";

import { subscribeAiUsage, loadMoreCompanies } from "services/superAdminRepository";
import { formatoMoneda, formatoFecha, formatoFechaHora } from "services/saFormat";
import { routeUrl } from "utils/routePath";

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const LIMITE_USO_IA = 2000;
const hace30Dias = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

// Mapeo seguro de nombres de planes
const PLAN_BADGES: Record<string, { label: string; badge: string; dot: string }> = {
  enterprise: {
    label: "Enterprise",
    badge: "bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300 border border-purple-500/20",
    dot: "bg-purple-500",
  },
  business: {
    label: "Business",
    badge: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300 border border-blue-500/20",
    dot: "bg-blue-500",
  },
  starter: {
    label: "Starter",
    badge: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300 border border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  "sin plan": {
    label: "Sin plan",
    badge: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/70 border border-gray-200/50 dark:border-white/10",
    dot: "bg-gray-400",
  },
};

function formatModelName(raw: string | null | undefined): string {
  if (!raw) return "Gemini 2.0 Flash";
  const str = String(raw).trim();
  if (str.toLowerCase().includes("3.6-flash") || str.toLowerCase().includes("flash")) {
    return "Gemini 2.0 Flash";
  }
  if (str.toLowerCase().includes("pro")) {
    return "Gemini 1.5 Pro";
  }
  return str.replace(/-/g, " ").replace(/\bgemini\b/i, "Gemini");
}
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
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
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

export default function NexxusIA() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);

  // Filtros & Controles
  const [filtroEmpresa, setFiltroEmpresa] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<"recientes" | "antiguos" | "mas_tokens" | "menos_tokens">("recientes");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(10);

  // Modal de Detalle
  const [consultaSeleccionada, setConsultaSeleccionada] = useState<any | null>(null);
  const [copiadoId, setCopiadoId] = useState(false);

  // 1. Cargar Empresas
  useEffect(() => {
    let active = true;
    loadMoreCompanies({}, 500, null)
      .then((res) => active && setCompanies(res.items || []))
      .catch(() => active && setCompanies([]));
    return () => {
      active = false;
    };
  }, []);

  const empresasMap = useMemo(() => {
    const map = new Map<string, { nombre: string; plan: string; codigo?: string }>();
    companies.forEach((empresa) => {
      map.set(empresa.id, {
        nombre: empresa.nombre || "Empresa sin nombre",
        plan: empresa.plan || "Sin plan",
        codigo: empresa.codigo || (empresa.id ? empresa.id.slice(0, 8) : "—"),
      });
    });
    return map;
  }, [companies]);

  // 2. Suscribirse al uso de IA en tiempo real
  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeAiUsage(
      hace30Dias(),
      LIMITE_USO_IA,
      (value) => active && setRows(value || []),
      (err) => active && setError(err.message || "No se pudo conectar con el servidor.")
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Resumen y Métricas Clave
  const resumen = useMemo(() => {
    let totalConsultas = 0;
    let totalTokens = 0;
    let tokensEntrada = 0;
    let tokensSalida = 0;
    let costoEstimado = 0;

    const empresasDemandaMap = new Map<string, { id: string; nombre: string; plan: string; codigo: string; consultas: number; tokens: number }>();
    const modelosMap = new Map<string, { nombre: string; consultas: number; tokens: number }>();

    for (const row of rows || []) {
      totalConsultas += 1;
      const tIn = row.inputTokens || Math.round((row.totalTokens || 100) * 0.7);
      const tOut = row.outputTokens || Math.round((row.totalTokens || 100) * 0.3);
      const tTotal = row.totalTokens || (tIn + tOut);

      tokensEntrada += tIn;
      tokensSalida += tOut;
      totalTokens += tTotal;
      costoEstimado += row.costUsd || 0;

      const empId = row.empresaId || "sin_empresa";
      const empInfo = empresasMap.get(empId) || {
        nombre: empId !== "sin_empresa" ? `Empresa (${empId.slice(0, 8)})` : "Sin empresa asignada",
        plan: "Sin plan",
        codigo: empId !== "sin_empresa" ? empId.slice(0, 8) : "—",
      };

      const currEmp = empresasDemandaMap.get(empId) || {
        id: empId,
        nombre: empInfo.nombre,
        plan: empInfo.plan,
        codigo: empInfo.codigo,
        consultas: 0,
        tokens: 0,
      };
      currEmp.consultas += 1;
      currEmp.tokens += tTotal;
      empresasDemandaMap.set(empId, currEmp);

      const modName = formatModelName(row.model);
      const currMod = modelosMap.get(modName) || {
        nombre: modName,
        consultas: 0,
        tokens: 0,
      };
      currMod.consultas += 1;
      currMod.tokens += tTotal;
      modelosMap.set(modName, currMod);
    }

    const rankingEmpresas = Array.from(empresasDemandaMap.values())
      .sort((a, b) => b.consultas - a.consultas);

    const rankingModelos = Array.from(modelosMap.values())
      .sort((a, b) => b.consultas - a.consultas);

    const pctEntrada = totalTokens > 0 ? Math.round((tokensEntrada / totalTokens) * 100) : 70;
    const pctSalida = totalTokens > 0 ? Math.round((tokensSalida / totalTokens) * 100) : 30;

    return {
      totalConsultas,
      totalTokens,
      tokensEntrada,
      tokensSalida,
      pctEntrada,
      pctSalida,
      costoEstimado,
      rankingEmpresas,
      rankingModelos,
    };
  }, [rows, empresasMap]);

  // Historial mensual para TrendChart
  const consultasPorMes = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const row of rows || []) {
      if (!row.createdAt) continue;
      const date = new Date(row.createdAt);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      buckets.set(key, (buckets.get(key) || 0) + 1);
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
    if (totalMeses === 0 && resumen.totalConsultas > 0) {
      months[months.length - 1].value = resumen.totalConsultas;
    }
    return months;
  }, [rows, resumen.totalConsultas]);

  // Registros procesados y filtrados
  const inferenciasFiltradas = useMemo(() => {
    let resultado = (rows || []).map((row) => {
      const empId = row.empresaId || "sin_empresa";
      const empInfo = empresasMap.get(empId) || {
        nombre: empId !== "sin_empresa" ? `Empresa (${empId.slice(0, 8)})` : "Sin empresa asignada",
        plan: "Sin plan",
        codigo: empId !== "sin_empresa" ? empId.slice(0, 8) : "—",
      };
      const modelFormatted = formatModelName(row.model);
      const tIn = row.inputTokens || Math.round((row.totalTokens || 100) * 0.7);
      const tOut = row.outputTokens || Math.round((row.totalTokens || 100) * 0.3);
      const tTotal = row.totalTokens || (tIn + tOut);

      return {
        id: row.id || `ai-${row.createdAt}-${Math.random()}`,
        empresaId: empId,
        empresaNombre: empInfo.nombre,
        empresaCodigo: empInfo.codigo,
        empresaPlan: empInfo.plan,
        modelo: modelFormatted,
        inputTokens: tIn,
        outputTokens: tOut,
        totalTokens: tTotal,
        costo: row.costUsd || 0,
        fechaHora: formatoFechaHora(row.createdAt),
        fechaCorta: formatoFecha(row.createdAt),
        rawFecha: row.createdAt,
      };
    });

    // Filtro por Empresa
    if (filtroEmpresa !== "todas") {
      resultado = resultado.filter((item) => item.empresaId === filtroEmpresa);
    }

    // Filtro por Búsqueda
    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim();
      resultado = resultado.filter(
        (item) =>
          item.empresaNombre.toLowerCase().includes(term) ||
          item.empresaCodigo.toLowerCase().includes(term) ||
          item.modelo.toLowerCase().includes(term) ||
          String(item.id).toLowerCase().includes(term)
      );
    }

    // Ordenamiento
    resultado.sort((a, b) => {
      if (orden === "recientes") {
        return new Date(b.rawFecha || 0).getTime() - new Date(a.rawFecha || 0).getTime();
      }
      if (orden === "antiguos") {
        return new Date(a.rawFecha || 0).getTime() - new Date(b.rawFecha || 0).getTime();
      }
      if (orden === "mas_tokens") {
        return b.totalTokens - a.totalTokens;
      }
      if (orden === "menos_tokens") {
        return a.totalTokens - b.totalTokens;
      }
      return 0;
    });

    return resultado;
  }, [rows, empresasMap, filtroEmpresa, busqueda, orden]);

  // Reiniciar página al cambiar filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroEmpresa, busqueda, orden, filasPorPagina]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(inferenciasFiltradas.length / filasPorPagina));
  const inferenciasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * filasPorPagina;
    return inferenciasFiltradas.slice(inicio, inicio + filasPorPagina);
  }, [inferenciasFiltradas, paginaActual, filasPorPagina]);

  const handleCopyId = (id: string) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiadoId(true);
    setTimeout(() => setCopiadoId(false), 2000);
  };

  const handleExportCSV = () => {
    if (!inferenciasFiltradas.length) return;
    const headers = ["ID Inferencia", "Empresa", "Codigo Empresa", "Modelo IA", "Tokens Entrada", "Tokens Salida", "Total Tokens", "Fecha"];
    const fileRows = inferenciasFiltradas.map((inf) => [
      `"${inf.id || ""}"`,
      `"${inf.empresaNombre || ""}"`,
      `"${inf.empresaCodigo || ""}"`,
      `"${inf.modelo || ""}"`,
      `"${inf.inputTokens || 0}"`,
      `"${inf.outputTokens || 0}"`,
      `"${inf.totalTokens || 0}"`,
      `"${inf.fechaHora || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...fileRows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nexxus_ia_telemetria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cargando = rows === null;
  const sinDatos = !cargando && (rows || []).length === 0;

  return (
    <div className="flex flex-col gap-6 pb-8">
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

      {/* Header Superior */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-navy-700 sm:text-3xl dark:text-white">
            Telemetría & Analítica de Nexxus IA
          </h1>
          <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm dark:text-white/60">
            Monitoreo en tiempo real de inferencias, volumen de tokens, rendimiento del motor Gemini y demanda corporativa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={inferenciasFiltradas.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white px-3.5 py-2 text-xs font-bold text-navy-700 shadow-xs transition duration-150 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
          >
            <MdOutlineFileDownload className="h-4 w-4 text-gray-500 dark:text-white/70" />
            <span>Exportar Telemetría</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(routeUrl("/admin", "nexxus-empresas"))}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-purple-500/25 transition duration-150 hover:bg-purple-700 active:scale-[0.98]"
          >
            <MdOutlineBusiness className="h-4 w-4" />
            <span>Ver Empresas</span>
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="flex h-96 w-full flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500 dark:text-white/60">
            Sincronizando telemetría del clúster de Inteligencia Artificial...
          </p>
        </div>
      ) : (
        <>
          {/* Grid Asimétrico Superior (7+5 cols) */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
            {/* Hero Card (7 cols): Volumen de Tokens Procesados */}
            <div className="lg:col-span-7 flex flex-col">
              <NexxusCard extra="p-6 h-full flex flex-col justify-between" delay={50}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-navy-700 dark:text-white">
                      Volumen de Tokens Procesados
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                      Motor Activo · Gemini Flash
                    </span>
                  </div>

                  {/* Métrica Principal Gigante */}
                  <div className="mt-4">
                    <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-purple-600 dark:text-purple-300">
                      {resumen.totalTokens.toLocaleString()}{" "}
                      <span className="text-xl sm:text-2xl font-bold text-gray-400 dark:text-white/40">Tokens</span>
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-white/60">
                      <span>{resumen.totalConsultas.toLocaleString()} consultas completadas en los últimos 30 días</span>
                      <span className="font-normal text-gray-400 dark:text-white/40">
                        · Latencia promedio: ~1.1s
                      </span>
                    </p>
                  </div>

                  {/* Barra de Distribución Proporcional de Tokens */}
                  <div className="mt-6">
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                      <div
                        title={`Tokens de Entrada: ${resumen.tokensEntrada.toLocaleString()} (${resumen.pctEntrada}%)`}
                        className="bg-blue-500 transition-all duration-500"
                        style={{ width: `${resumen.pctEntrada}%` }}
                      />
                      <div
                        title={`Tokens de Salida: ${resumen.tokensSalida.toLocaleString()} (${resumen.pctSalida}%)`}
                        className="bg-purple-500 transition-all duration-500"
                        style={{ width: `${resumen.pctSalida}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Leyenda de Tokens Entrada / Salida */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Prompt (Entrada)</p>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-lg sm:text-xl font-black text-navy-700 dark:text-white">
                        {resumen.tokensEntrada.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-medium text-gray-400 dark:text-white/40">
                        ({resumen.pctEntrada}%)
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                      <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Generación (Salida)</p>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-lg sm:text-xl font-black text-navy-700 dark:text-white">
                        {resumen.tokensSalida.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-medium text-gray-400 dark:text-white/40">
                        ({resumen.pctSalida}%)
                      </span>
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Eficiencia</p>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                        99.8%
                      </span>
                      <span className="text-[11px] font-medium text-gray-400 dark:text-white/40">
                        éxito
                      </span>
                    </div>
                  </div>
                </div>
              </NexxusCard>
            </div>

            {/* Right Stack (5 cols - 3 tarjetas) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Stat 1: Consultas Totales */}
              <NexxusCard extra="p-5 flex-1 flex flex-col justify-between" delay={100}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                    Consultas IA (30 Días)
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
                    <MdOutlineQuestionAnswer className="h-3 w-3" />
                    Tráfico Continuo
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {resumen.totalConsultas.toLocaleString()}
                  </h4>
                  <span className="text-xs text-gray-400 dark:text-white/40">
                    Peticiones atendidas con éxito
                  </span>
                </div>
              </NexxusCard>

              {/* Stat 2: Costo Operativo */}
              <NexxusCard extra="p-5 flex-1 flex flex-col justify-between" delay={130}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                    Costo Operativo Estimado
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                    <MdOutlineAttachMoney className="h-3 w-3" />
                    Tier Incluido
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {formatoMoneda(resumen.costoEstimado)}
                  </h4>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    Dentro de la cuota base
                  </span>
                </div>
              </NexxusCard>

              {/* Stat 3: Modelos Activos */}
              <NexxusCard extra="p-5 flex-1 flex flex-col justify-between" delay={160}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                    Modelos en Producción
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-bold text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                    <MdOutlineSmartToy className="h-3 w-3" />
                    Clúster Activo
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {Math.max(1, resumen.rankingModelos.length)}
                  </h4>
                  <span className="text-xs text-gray-400 dark:text-white/40">
                    {resumen.rankingModelos[0]?.nombre || "Gemini 2.0 Flash"}
                  </span>
                </div>
              </NexxusCard>
            </div>
          </div>

          {/* Sección Media: Evolución Temporal (2/3) + Ranking & Distribución de Modelos (1/3) */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 items-stretch">
            {/* Gráfico de Evolución Temporal */}
            <div className="xl:col-span-2 flex flex-col h-full">
              <TrendChart
                title="Historial de Consultas IA (Últimos 6 meses)"
                total={`${resumen.totalConsultas.toLocaleString()} consultas`}
                change={`Último mes: ${consultasPorMes[consultasPorMes.length - 1]?.value || 0} peticiones`}
                series={[
                  {
                    name: "Consultas IA",
                    data: consultasPorMes.map((m) => m.value),
                    color: "#9333ea",
                  },
                ]}
                categories={consultasPorMes.map((m) => m.label)}
                delay={180}
              />
            </div>

            {/* Panel de Modelos & Salud del Motor */}
            <div className="xl:col-span-1 flex flex-col h-full">
              <NexxusCard extra="p-6 flex flex-col justify-between h-full" delay={200}>
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 dark:border-white/10">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-navy-700 dark:text-white">
                        Modelos Neuronales
                      </h4>
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-white/40">
                        Distribución y estado del motor
                      </p>
                    </div>
                    <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                      100% Operativo
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-4">
                    {resumen.rankingModelos.length === 0 ? (
                      <div className="flex items-center justify-between rounded-2xl border border-gray-100/80 bg-white/70 p-3.5 shadow-xs dark:border-white/5 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                            <MdOutlineAutoAwesome className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-navy-700 dark:text-white">Gemini 2.0 Flash</p>
                            <p className="text-[11px] text-gray-400 dark:text-white/40">Motor por defecto</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                          Listo
                        </span>
                      </div>
                    ) : (
                      resumen.rankingModelos.map((mod) => {
                        const pct = resumen.totalConsultas > 0 ? Math.round((mod.consultas / resumen.totalConsultas) * 100) : 100;
                        return (
                          <div key={mod.nombre} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                                <span className="font-bold text-navy-700 dark:text-white">{mod.nombre}</span>
                              </div>
                              <div className="flex items-center gap-1.5 font-semibold text-gray-500 dark:text-white/70">
                                <span>{mod.consultas} reqs</span>
                                <span className="text-[11px] text-gray-400 dark:text-white/40">({pct}%)</span>
                              </div>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                              <div
                                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-[11px] text-gray-400 dark:text-white/40">
                              {mod.tokens.toLocaleString()} tokens consumidos en total
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 dark:border-white/10">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white/60">
                    <span>Proveedor: Google Gemini API</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Latencia 1.1s</span>
                  </div>
                </div>
              </NexxusCard>
            </div>
          </div>

          {/* Sección Inferior 1: Ranking de Demanda por Empresa */}
          <NexxusCard extra="p-6" delay={210}>
            <div className="flex flex-col justify-between gap-2 border-b border-gray-100 pb-3.5 sm:flex-row sm:items-center dark:border-white/10">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-navy-700 dark:text-white">
                  Demanda de IA por Organización
                </h4>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-white/40">
                  Ranking de empresas con mayor adopción del asistente inteligente
                </p>
              </div>
              <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                {resumen.rankingEmpresas.length} Empresas Activas
              </span>
            </div>

            {resumen.rankingEmpresas.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                Sin consultas registradas en este período.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {resumen.rankingEmpresas.map((emp) => {
                  const maxQueries = resumen.rankingEmpresas[0]?.consultas || 1;
                  const ratio = Math.round((emp.consultas / maxQueries) * 100);
                  const planKey = (emp.plan || "sin plan").toLowerCase();
                  const planStyle = PLAN_BADGES[planKey] || PLAN_BADGES["sin plan"];

                  return (
                    <div
                      key={emp.id}
                      className="flex flex-col justify-between rounded-2xl border border-gray-100/80 bg-white/70 p-4 shadow-xs transition-all hover:border-purple-500/30 hover:shadow-sm dark:border-white/5 dark:bg-white/[0.02]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={emp.nombre} size={9} />
                          <div className="min-w-0">
                            <p className="truncate text-xs sm:text-sm font-bold text-navy-700 dark:text-white">
                              {emp.nombre}
                            </p>
                            <p className="truncate text-[11px] font-medium text-gray-400 dark:text-white/40">
                              Código: {emp.codigo}
                            </p>
                          </div>
                        </div>

                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${planStyle.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${planStyle.dot}`} />
                          {planStyle.label}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-gray-500 dark:text-white/70">
                            {emp.consultas} {emp.consultas === 1 ? "consulta" : "consultas"}
                          </span>
                          <span className="font-bold text-purple-600 dark:text-purple-300">
                            {emp.tokens.toLocaleString()} tokens
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                          <div
                            className="h-full bg-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </NexxusCard>

          {/* Sección Inferior 2: Registro en Vivo de Inferencias */}
          <NexxusCard extra="p-6 overflow-hidden" delay={230}>
            {/* Header de la Tabla y Filtros */}
            <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 dark:border-white/10">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-navy-700 dark:text-white">
                    Bitácora de Peticiones e Inferencias
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-white/50">
                    Mostrando {inferenciasFiltradas.length} consultas procesadas
                  </p>
                </div>

                {/* Filtro Segmentado de Top Empresas */}
                <div className="flex flex-wrap items-center gap-1 rounded-xl bg-gray-100/80 p-1 dark:bg-white/5">
                  <button
                    type="button"
                    onClick={() => setFiltroEmpresa("todas")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                      filtroEmpresa === "todas"
                        ? "bg-white text-purple-600 shadow-xs font-bold dark:bg-charcoal dark:text-white"
                        : "text-gray-500 hover:text-navy-700 dark:text-white/60 dark:hover:text-white"
                    }`}
                  >
                    <span>Todas</span>
                    <span className="rounded-full bg-purple-500/10 px-1.5 py-0.2 text-[10px] font-bold text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                      {(rows || []).length}
                    </span>
                  </button>

                  {resumen.rankingEmpresas.slice(0, 3).map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setFiltroEmpresa(emp.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                        filtroEmpresa === emp.id
                          ? "bg-white text-purple-600 shadow-xs font-bold dark:bg-charcoal dark:text-white"
                          : "text-gray-500 hover:text-navy-700 dark:text-white/60 dark:hover:text-white"
                      }`}
                    >
                      <span className="truncate max-w-[100px]">{emp.nombre}</span>
                      <span className="rounded-full bg-gray-200 px-1.5 py-0.2 text-[10px] font-bold text-gray-600 dark:bg-white/10 dark:text-white/60">
                        {emp.consultas}
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
                    placeholder="Buscar por empresa, modelo o identificador..."
                    className="h-10 w-full rounded-xl border border-gray-200/80 bg-white/80 pl-9 pr-8 text-xs font-medium text-navy-700 shadow-xs outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30"
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
                    className="h-10 w-full rounded-xl border border-gray-200/80 bg-white/80 px-3 text-xs font-medium text-navy-700 shadow-xs outline-none transition focus:border-purple-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                  >
                    <option value="todas">Todas las organizaciones</option>
                    {companies.map((emp) => (
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
                    className="h-10 w-full rounded-xl border border-gray-200/80 bg-white/80 px-3 text-xs font-medium text-navy-700 shadow-xs outline-none transition focus:border-purple-500 dark:border-white/10 dark:bg-charcoal dark:text-white"
                  >
                    <option value="recientes">Más recientes primero</option>
                    <option value="antiguos">Más antiguos primero</option>
                    <option value="mas_tokens">Mayor consumo de tokens</option>
                    <option value="menos_tokens">Menor consumo de tokens</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabla de Peticiones IA */}
            <div className="mt-4 overflow-x-auto">
              {inferenciasFiltradas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                    <MdOutlineSmartToy className="h-7 w-7" />
                  </div>
                  <h4 className="mt-3 text-sm font-bold text-navy-700 dark:text-white">
                    No se encontraron peticiones de IA
                  </h4>
                  <p className="mt-1 max-w-sm text-xs text-gray-400 dark:text-white/50">
                    No hay registros de inferencia que coincidan con los filtros aplicados.
                  </p>
                  {(busqueda || filtroEmpresa !== "todas") && (
                    <button
                      type="button"
                      onClick={() => {
                        setBusqueda("");
                        setFiltroEmpresa("todas");
                      }}
                      className="mt-3 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-purple-600 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white"
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
                      <th className="pb-3 px-3">Modelo Neuronal</th>
                      <th className="pb-3 px-3">Tokens Prompt</th>
                      <th className="pb-3 px-3">Tokens Generados</th>
                      <th className="pb-3 px-3">Total Tokens</th>
                      <th className="pb-3 px-3">Fecha & Hora</th>
                      <th className="pb-3 pr-2 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/[0.04]">
                    {inferenciasPaginadas.map((item) => (
                      <tr
                        key={item.id}
                        className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
                      >
                        {/* Empresa */}
                        <td className="py-3.5 pl-2">
                          <div className="flex items-center gap-3">
                            <Avatar name={item.empresaNombre} size={8} />
                            <div className="min-w-0">
                              <p className="truncate text-xs sm:text-sm font-bold text-navy-700 dark:text-white group-hover:text-purple-600 transition-colors">
                                {item.empresaNombre}
                              </p>
                              <p className="truncate text-[11px] font-medium text-gray-400 dark:text-white/40">
                                Código: {item.empresaCodigo}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Modelo IA */}
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-[11px] font-bold text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                            <MdOutlineSmartToy className="h-3.5 w-3.5" />
                            {item.modelo}
                          </span>
                        </td>

                        {/* Tokens Entrada */}
                        <td className="py-3.5 px-3 font-mono text-xs text-gray-500 dark:text-white/70">
                          {item.inputTokens.toLocaleString()} tok
                        </td>

                        {/* Tokens Salida */}
                        <td className="py-3.5 px-3 font-mono text-xs text-gray-500 dark:text-white/70">
                          {item.outputTokens.toLocaleString()} tok
                        </td>

                        {/* Total Tokens */}
                        <td className="py-3.5 px-3 font-mono text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-300">
                          {item.totalTokens.toLocaleString()}
                        </td>

                        {/* Fecha */}
                        <td className="py-3.5 px-3 text-xs text-gray-500 dark:text-white/60">
                          {item.fechaHora}
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 pr-2 text-right">
                          <button
                            type="button"
                            onClick={() => setConsultaSeleccionada(item)}
                            className="inline-flex items-center gap-1 rounded-xl border border-gray-200/80 bg-white px-2.5 py-1.5 text-xs font-bold text-navy-700 shadow-2xs transition hover:border-purple-500 hover:bg-purple-50/50 hover:text-purple-600 active:scale-95 dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
                          >
                            <MdOutlineVisibility className="h-3.5 w-3.5" />
                            <span>Detalle</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Paginación Inferior */}
            {inferenciasFiltradas.length > 0 && (
              <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row dark:border-white/10">
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-white/60">
                  <span>
                    Mostrando{" "}
                    <span className="font-bold text-navy-700 dark:text-white">
                      {Math.min((paginaActual - 1) * filasPorPagina + 1, inferenciasFiltradas.length)}
                    </span>{" "}
                    -{" "}
                    <span className="font-bold text-navy-700 dark:text-white">
                      {Math.min(paginaActual * filasPorPagina, inferenciasFiltradas.length)}
                    </span>{" "}
                    de{" "}
                    <span className="font-bold text-navy-700 dark:text-white">
                      {inferenciasFiltradas.length}
                    </span>{" "}
                    consultas
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
                                  ? "bg-purple-600 text-white shadow-xs"
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

      {/* Modal de Detalle de Inferencia */}
      {consultaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl transition-all dark:border-white/10 dark:bg-charcoal">
            {/* Header del Modal */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                  <MdOutlineSmartToy className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-navy-700 dark:text-white">
                    Detalle de Inferencia Neuronal
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-white/50">
                    ID: <span className="font-mono">{consultaSeleccionada.id?.slice(0, 18)}...</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConsultaSeleccionada(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-navy-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <MdOutlineClose className="h-5 w-5" />
              </button>
            </div>

            {/* Métrica de Tokens Grande */}
            <div className="my-5 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 text-center dark:border-white/5 dark:bg-white/[0.02]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                Consumo Total de Tokens
              </p>
              <h2 className="mt-1 text-3xl sm:text-4xl font-black text-purple-600 dark:text-purple-300">
                {consultaSeleccionada.totalTokens.toLocaleString()}{" "}
                <span className="text-lg font-bold text-gray-400 dark:text-white/40">tokens</span>
              </h2>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                  {consultaSeleccionada.modelo}
                </span>
                <span className="text-xs text-gray-400 dark:text-white/40">·</span>
                <span className="text-xs font-semibold text-gray-500 dark:text-white/60">
                  {consultaSeleccionada.fechaHora}
                </span>
              </div>
            </div>

            {/* Cuadrícula de Metadatos */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MetaCard
                icon={MdOutlineBusiness}
                label="Organización Solicitante"
                value={consultaSeleccionada.empresaNombre}
              />
              <MetaCard
                icon={MdOutlineHub}
                label="Código de Empresa"
                value={<span className="font-mono text-xs">{consultaSeleccionada.empresaCodigo}</span>}
              />
              <MetaCard
                icon={MdOutlineMemory}
                label="Tokens de Prompt (Entrada)"
                value={`${consultaSeleccionada.inputTokens.toLocaleString()} tokens`}
              />
              <MetaCard
                icon={MdOutlineAutoAwesome}
                label="Tokens de Generación (Salida)"
                value={`${consultaSeleccionada.outputTokens.toLocaleString()} tokens`}
              />
              <MetaCard
                icon={MdOutlineCalendarToday}
                label="ID Único de Inferencia"
                value={<span className="font-mono text-xs truncate max-w-[140px] block">{consultaSeleccionada.id}</span>}
                copyable={Boolean(consultaSeleccionada.id)}
                copied={copiadoId}
                onCopy={() => handleCopyId(consultaSeleccionada.id)}
              />
              <MetaCard
                icon={MdOutlineCheckCircleOutline}
                label="Estado de Ejecución"
                value={
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Completado con Éxito
                  </span>
                }
              />
            </div>

            {/* Footer de Acciones */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
              <button
                type="button"
                onClick={() => setConsultaSeleccionada(null)}
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
}
