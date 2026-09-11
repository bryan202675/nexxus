import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdOutlineWarningAmber } from "react-icons/md";

import NexxusCard from "views/nexxus/components/NexxusCard";
import TrendChart from "views/nexxus/components/TrendChart";
import PeoplePriorityTable from "./PeoplePriorityTable";

import { useAuth } from "context/AuthContext";
import { useTeamCareAlerts, TeamCareAlert } from "context/TeamCareAlertsContext";
import { subscribeEmpleados, subscribeCheckIns } from "services/adminRepository";
import {
  summarizeTeamCheckIns,
  teamCareStats,
  estresDeCheckIn,
  normalizeCheckIn,
  calculatePulse,
} from "services/checkInAnalytics";
import { routeUrl } from "utils/routePath";

const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export default function CuidadoEquipo() {
  const navigate = useNavigate();
  const { empresaId, empresaNombre } = useAuth();
  const { alerts, unresolvedCount, markAsResolved } = useTeamCareAlerts();
  const [error, setError] = useState("");
  const [empleados, setEmpleados] = useState<any[] | null>(null);
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [tipoGrafico, setTipoGrafico] = useState<"estres" | "pulso">("estres");

  useEffect(() => {
    if (!empresaId) return;
    const onErr = (err: any) => setError(err.message || "No se pudo conectar con la base de datos.");
    const unsubs = [
      subscribeEmpleados(empresaId, (docs) => setEmpleados(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
      subscribeCheckIns(empresaId, (docs) => setCheckIns(docs.map((d) => ({ id: d.id, ...d.data() }))), onErr),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [empresaId]);

  const summaries = useMemo(() => summarizeTeamCheckIns(checkIns, empleados || []), [checkIns, empleados]);
  const stats = useMemo(() => teamCareStats(summaries), [summaries]);

  // Distribución de bienestar para la barra de desglose y leyenda exacta
  const distribucionBienestar = useMemo(() => {
    const total = summaries.length;
    if (total === 0) {
      return {
        optimosCount: 0,
        optimosPercent: 0,
        atencionCount: 0,
        atencionPercent: 0,
        riesgoCount: 0,
        riesgoPercent: 0,
      };
    }
    const optimosCount = summaries.filter((s) => s.pulse >= 75).length;
    const atencionCount = summaries.filter((s) => s.pulse >= 50 && s.pulse < 75).length;
    const riesgoCount = summaries.filter((s) => s.pulse < 50 || s.severity === "riesgo").length;

    return {
      optimosCount,
      optimosPercent: Math.round((optimosCount / total) * 100),
      atencionCount,
      atencionPercent: Math.round((atencionCount / total) * 100),
      riesgoCount,
      riesgoPercent: Math.round((riesgoCount / total) * 100),
    };
  }, [summaries]);

  const alertsByUser = useMemo(() => {
    const map = new Map<string, TeamCareAlert>();
    for (const alerta of alerts) {
      const uids = new Set<string>();
      if (alerta.usuario_id) uids.add(alerta.usuario_id);
      const datosUid = (alerta.datos as any)?.usuario_id as string | undefined;
      if (datosUid) uids.add(datosUid);

      for (const uid of uids) {
        const actual = map.get(uid);
        if (!actual || (!alerta.resuelta && actual.resuelta) || alerta.created_at > actual.created_at) {
          map.set(uid, alerta);
        }
      }
    }
    return map;
  }, [alerts]);

  // Serie de 14 días con soporte para Estrés y Pulso promedio
  const serieBienestar = useMemo(() => {
    const dias = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dias.push({ key: d.toISOString().slice(0, 10), label: DIAS_CORTOS[d.getDay()] });
    }

    const estresPromedios = dias.map(({ key }) => {
      const valores = checkIns
        .filter((c: any) => (c.created_at || c.fecha || "").slice(0, 10) === key)
        .map(estresDeCheckIn)
        .filter((v) => v !== null) as number[];
      if (valores.length === 0) return 0;
      return Math.round((valores.reduce((sum, v) => sum + v, 0) / valores.length) * 10) / 10;
    });

    const pulsoPromedios = dias.map(({ key }) => {
      const diaCheckIns = checkIns.filter(
        (c: any) => (c.created_at || c.fecha || "").slice(0, 10) === key
      );
      if (diaCheckIns.length === 0) return 0;
      const sum = diaCheckIns.reduce((acc, c) => {
        const n = normalizeCheckIn(c);
        return acc + calculatePulse(n.energy, n.sleep, n.mood, n.stress, n.workload);
      }, 0);
      return Math.round(sum / diaCheckIns.length);
    });

    return {
      categorias: dias.map((d) => d.label),
      estres: estresPromedios,
      pulso: pulsoPromedios,
    };
  }, [checkIns]);

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
      {/* Banner de error */}
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
            Sincronizando estado de bienestar del equipo...
          </p>
        </div>
      ) : (
        <>
          {/* Header Superior Limpio */}
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-navy-700 sm:text-3xl dark:text-white">
                Cuidado del Equipo
              </h2>
              <p className="mt-1 text-xs sm:text-sm font-medium text-gray-400 dark:text-white/50">
                Monitoreo de clima laboral y pulso preventivo · {empresaNombre || "Empresa"}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate(routeUrl("/admin", "empresa-resumen"))}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white px-4 py-2 text-xs font-bold text-navy-700 shadow-xs transition duration-150 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] dark:border-white/10 dark:bg-charcoal dark:text-white dark:hover:bg-white/5"
              >
                <span>Ver Resumen General</span>
              </button>
              <button
                type="button"
                onClick={() => navigate(routeUrl("/admin", "empresa-plantilla"))}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-brand-500/25 transition duration-150 hover:bg-brand-600 active:scale-[0.98]"
              >
                <span>Gestionar Plantilla</span>
              </button>
            </div>
          </div>

          {/* Bloque Hero & Stack Lateral de 3 Cards */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
            {/* Left Hero Card: Pulso Promedio del Equipo (7 columnas en desktop) */}
            <div className="lg:col-span-7 flex flex-col">
              <NexxusCard
                extra="p-6 h-full flex flex-col justify-between transition-all duration-200 hover:shadow-md"
                delay={50}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                      Pulso General del Equipo
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        stats.avgPulse >= 75
                          ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                          : stats.avgPulse >= 50
                          ? "bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300"
                          : "bg-rose-500/10 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300"
                      }`}
                    >
                      {stats.avgPulse >= 75
                        ? "Clima Óptimo"
                        : stats.avgPulse >= 50
                        ? "Atención Requerida"
                        : "Riesgo Detectado"}
                    </span>
                  </div>

                  {/* Número Principal Gigante */}
                  <div className="mt-3">
                    <h3 className="text-4xl sm:text-5xl font-black tracking-tight text-navy-700 dark:text-white">
                      {stats.avgPulse > 0 ? `${stats.avgPulse}%` : "—"}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm font-medium text-gray-500 dark:text-white/60">
                      {summaries.length} colaboradores evaluados a partir de check-ins registrados
                    </p>
                  </div>

                  {/* Barra de progreso de distribución proporcional */}
                  <div className="mt-5">
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                      {summaries.length > 0 ? (
                        <>
                          <div
                            title={`Óptimos: ${distribucionBienestar.optimosCount} (${distribucionBienestar.optimosPercent}%)`}
                            className="bg-emerald-500 transition-all duration-500"
                            style={{ width: `${distribucionBienestar.optimosPercent}%` }}
                          />
                          <div
                            title={`En atención: ${distribucionBienestar.atencionCount} (${distribucionBienestar.atencionPercent}%)`}
                            className="bg-amber-400 transition-all duration-500"
                            style={{ width: `${distribucionBienestar.atencionPercent}%` }}
                          />
                          <div
                            title={`En riesgo: ${distribucionBienestar.riesgoCount} (${distribucionBienestar.riesgoPercent}%)`}
                            className="bg-rose-500 transition-all duration-500"
                            style={{ width: `${distribucionBienestar.riesgoPercent}%` }}
                          />
                        </>
                      ) : (
                        <div className="w-full bg-gray-200 dark:bg-white/10" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Desglose con identificación exacta de cada color y su dato */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Óptimos (≥75%)</p>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-lg sm:text-xl font-black text-navy-700 dark:text-white">
                        {distribucionBienestar.optimosCount}
                      </span>
                      <span className="text-[11px] font-medium text-gray-400 dark:text-white/40">
                        ({distribucionBienestar.optimosPercent}%)
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                      <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Atención (50-74%)</p>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-lg sm:text-xl font-black text-navy-700 dark:text-white">
                        {distribucionBienestar.atencionCount}
                      </span>
                      <span className="text-[11px] font-medium text-gray-400 dark:text-white/40">
                        ({distribucionBienestar.atencionPercent}%)
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                      <p className="text-xs font-semibold text-gray-400 dark:text-white/50">En riesgo (&lt;50%)</p>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className={`text-lg sm:text-xl font-black ${distribucionBienestar.riesgoCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-navy-700 dark:text-white"}`}>
                        {distribucionBienestar.riesgoCount}
                      </span>
                      <span className="text-[11px] font-medium text-gray-400 dark:text-white/40">
                        ({distribucionBienestar.riesgoPercent}%)
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                      <p className="text-xs font-semibold text-gray-400 dark:text-white/50">Estrés promedio</p>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-lg sm:text-xl font-black text-navy-700 dark:text-white">
                        {stats.avgStress}
                      </span>
                      <span className="text-[11px] font-medium text-gray-400 dark:text-white/40">
                        / 5
                      </span>
                    </div>
                  </div>
                </div>
              </NexxusCard>
            </div>

            {/* Right Column: Stack de 3 Cards Métricas Limpias (5 columnas en desktop) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Stat Card 1: Colaboradores en Riesgo */}
              <NexxusCard
                extra="p-5 flex-1 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                delay={100}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                    Colaboradores en Riesgo
                  </p>
                  <span
                    className={`text-xs font-bold ${
                      stats.atRiskCount > 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {stats.atRiskCount > 0 ? "Acompañamiento 1:1" : "Sin casos críticos"}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {stats.atRiskCount}
                  </h4>
                  <span className="text-xs text-gray-400 dark:text-white/40">
                    {stats.atRiskPercent}% del equipo
                  </span>
                </div>
              </NexxusCard>

              {/* Stat Card 2: Carga Laboral Promedio */}
              <NexxusCard
                extra="p-5 flex-1 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                delay={130}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                    Carga Laboral Media
                  </p>
                  <span
                    className={`text-xs font-bold ${
                      stats.avgWorkload >= 4
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-brand-600 dark:text-brand-400"
                    }`}
                  >
                    {stats.avgWorkload >= 4 ? "Elevada" : stats.avgWorkload >= 2.5 ? "Equilibrada" : "Ligera"}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {stats.avgWorkload}
                    <span className="text-sm font-normal text-gray-400 dark:text-white/40 ml-1">/ 5</span>
                  </h4>
                  <span className="text-xs text-gray-400 dark:text-white/40">
                    Nivel de exigencia general
                  </span>
                </div>
              </NexxusCard>

              {/* Stat Card 3: Alertas Activas */}
              <NexxusCard
                extra="p-5 flex-1 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                delay={160}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-400 dark:text-white/50">
                    Alertas Activas
                  </p>
                  <span
                    className={`text-xs font-bold ${
                      unresolvedCount > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {unresolvedCount > 0 ? "Pendientes de revisión" : "Todas resueltas"}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <h4 className="text-2xl sm:text-3xl font-black tracking-tight text-navy-700 dark:text-white">
                    {unresolvedCount}
                  </h4>
                  <span className="text-xs text-gray-400 dark:text-white/40">
                    {unresolvedCount > 0 ? "Requieren seguimiento" : "Sin pendientes"}
                  </span>
                </div>
              </NexxusCard>
            </div>
          </div>

          {/* Gráfico y Selector de Tendencia Histórica */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-base font-bold tracking-tight text-navy-700 dark:text-white">
                  Tendencia Histórica de Bienestar
                </h3>
                <p className="text-xs text-gray-400 dark:text-white/50">
                  Evolución de los últimos 14 días a partir de check-ins diarios.
                </p>
              </div>

              {/* Segmented Control */}
              <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-white/5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTipoGrafico("estres")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
                    tipoGrafico === "estres"
                      ? "bg-white text-navy-700 shadow-xs dark:bg-charcoal dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-white/60 dark:hover:text-white"
                  }`}
                >
                  Nivel de Estrés
                </button>
                <button
                  type="button"
                  onClick={() => setTipoGrafico("pulso")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
                    tipoGrafico === "pulso"
                      ? "bg-white text-navy-700 shadow-xs dark:bg-charcoal dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-white/60 dark:hover:text-white"
                  }`}
                >
                  Pulso Promedio
                </button>
              </div>
            </div>

            {tipoGrafico === "estres" ? (
              <TrendChart
                title="Estrés promedio del equipo (14 días)"
                total={`${stats.avgStress}/5`}
                change="Escala de estrés: 1 bajo · 5 crítico"
                series={[
                  {
                    name: "Estrés promedio",
                    data: serieBienestar.estres,
                    color: "#EF4444",
                  },
                ]}
                categories={serieBienestar.categorias}
                delay={100}
                min={0}
                max={5}
              />
            ) : (
              <TrendChart
                title="Pulso de bienestar del equipo (14 días)"
                total={`${stats.avgPulse}%`}
                change="Índice de salud: 0% riesgo · 100% óptimo"
                series={[
                  {
                    name: "Pulso promedio",
                    data: serieBienestar.pulso,
                    color: "#10B981",
                  },
                ]}
                categories={serieBienestar.categorias}
                delay={100}
                min={0}
                max={100}
              />
            )}
          </div>

          {/* Tabla de Prioridad y Seguimiento */}
          <PeoplePriorityTable
            summaries={summaries}
            alertsByUser={alertsByUser}
            onResolve={markAsResolved}
            delay={150}
          />
        </>
      )}
    </div>
  );
}
