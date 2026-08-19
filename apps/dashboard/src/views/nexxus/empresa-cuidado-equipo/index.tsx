import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdOutlineFavorite,
  MdOutlineWarningAmber,
  MdOutlineFitnessCenter,
  MdOutlineNotificationsActive,
  MdCheckCircle,
  MdOutlineTrendingUp,
} from "react-icons/md";

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
  const { empresaId } = useAuth();
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

  const alertsByUser = useMemo(() => {
    const map = new Map<string, TeamCareAlert>();
    for (const alerta of alerts) {
      if (!alerta.usuario_id) continue;
      const actual = map.get(alerta.usuario_id);
      if (!actual || (!alerta.resuelta && actual.resuelta) || alerta.created_at > actual.created_at) {
        map.set(alerta.usuario_id, alerta);
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
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
                Bienestar del Equipo
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-500 dark:text-white/60">
                Monitoreo del clima laboral a partir de los check-ins diarios, detección preventiva y seguimiento oportuno.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(routeUrl("/admin", "empresa-resumen"))}
                className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-navy-700 shadow-sm transition hover:bg-gray-50 dark:bg-charcoal dark:border dark:border-charcoal-border dark:text-white dark:hover:bg-white/5"
              >
                <span>Ver Resumen General</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {/* KPI 1: Pulso Promedio */}
            <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                    Pulso Promedio
                  </p>
                  <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                    {stats.avgPulse > 0 ? `${stats.avgPulse}%` : "—"}
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 dark:bg-rose-400/20 dark:text-rose-300">
                  <MdOutlineFavorite className="h-6 w-6" />
                </div>
              </div>

              {/* Barra de progreso de pulso */}
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stats.avgPulse >= 75
                        ? "bg-emerald-500"
                        : stats.avgPulse >= 50
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, stats.avgPulse))}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-white/60">
                <span className="flex items-center gap-1">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      stats.avgPulse >= 75
                        ? "bg-emerald-500"
                        : stats.avgPulse >= 50
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                  />
                  {stats.avgPulse >= 75
                    ? "Estado Óptimo"
                    : stats.avgPulse >= 50
                    ? "Requiere Atención"
                    : "Riesgo Detectado"}
                </span>
                <span>{summaries.length} evaluados</span>
              </div>
            </NexxusCard>

            {/* KPI 2: En Riesgo */}
            <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                    En Riesgo
                  </p>
                  <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                    {stats.atRiskCount}
                    <span className="ml-1.5 text-sm font-semibold text-rose-500">
                      ({stats.atRiskPercent}%)
                    </span>
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300">
                  <MdOutlineWarningAmber className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
                <span>
                  {stats.atRiskCount === 0
                    ? "Sin colaboradores en riesgo"
                    : "Requieren acompañamiento"}
                </span>
                <span className="font-bold text-rose-500">
                  {stats.atRiskCount > 0 ? "Prioritario" : "Todo bien"}
                </span>
              </div>
            </NexxusCard>

            {/* KPI 3: Carga Laboral Promedio */}
            <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                    Carga Laboral
                  </p>
                  <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                    {stats.avgWorkload}
                    <span className="text-sm font-semibold text-gray-400 dark:text-white/40">
                      /5
                    </span>
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
                  <MdOutlineFitnessCenter className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
                <span>
                  {stats.avgWorkload >= 4
                    ? "Carga elevada en el equipo"
                    : stats.avgWorkload >= 2.5
                    ? "Nivel de carga equilibrado"
                    : "Carga laboral ligera"}
                </span>
                <span className="font-bold text-navy-700 dark:text-white">Escala 1-5</span>
              </div>
            </NexxusCard>

            {/* KPI 4: Alertas de Bienestar */}
            <NexxusCard extra="p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/50">
                    Alertas Activas
                  </p>
                  <h3 className="mt-2 text-3xl font-extrabold text-navy-700 dark:text-white">
                    {unresolvedCount}
                    <span className="ml-1 text-sm font-semibold text-gray-500 dark:text-white/60">
                      pendientes
                    </span>
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                  <MdOutlineNotificationsActive className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
                <span>
                  {unresolvedCount === 0 ? "Todas resueltas" : "Acción requerida"}
                </span>
                <span className="flex items-center gap-1 font-bold text-brand-500">
                  <MdCheckCircle className="h-3.5 w-3.5" />
                  {unresolvedCount === 0 ? "Al día" : "Revisar tabla"}
                </span>
              </div>
            </NexxusCard>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTipoGrafico("estres")}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    tipoGrafico === "estres"
                      ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                      : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-charcoal dark:border dark:border-charcoal-border dark:text-white/70"
                  }`}
                >
                  Nivel de Estrés (14 días)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoGrafico("pulso")}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    tipoGrafico === "pulso"
                      ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                      : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-charcoal dark:border dark:border-charcoal-border dark:text-white/70"
                  }`}
                >
                  Pulso de Bienestar (14 días)
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
