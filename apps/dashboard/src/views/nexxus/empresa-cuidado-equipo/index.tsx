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
          {/* Toolbar / Subtítulo Superior (sin duplicar el título del Navbar) */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-xs font-medium text-gray-500 dark:text-white/60">
              Monitoreo del clima laboral a partir de los check-ins diarios, detección preventiva y seguimiento oportuno.
            </p>
            <button
              type="button"
              onClick={() => navigate(routeUrl("/admin", "empresa-resumen"))}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-navy-700 shadow-2xs transition hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              <span>Ver Resumen General</span>
            </button>
          </div>

          {/* Grid de 4 KPIs Principales */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {/* KPI 1: Pulso Promedio */}
            <NexxusCard extra="p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-white/60">
                  Pulso Promedio
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 dark:bg-rose-400/20 dark:text-rose-300">
                  <MdOutlineFavorite className="h-5 w-5" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
                    {stats.avgPulse > 0 ? `${stats.avgPulse}%` : "—"}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      stats.avgPulse >= 75
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                        : stats.avgPulse >= 50
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                    }`}
                  >
                    {stats.avgPulse >= 75
                      ? "Óptimo"
                      : stats.avgPulse >= 50
                      ? "Atención"
                      : "Riesgo"}
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
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

              <p className="text-xs text-gray-500 dark:text-white/60">
                {summaries.length} colaboradores evaluados
              </p>
            </NexxusCard>

            {/* KPI 2: En Riesgo */}
            <NexxusCard extra="p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-white/60">
                  En Riesgo
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300">
                  <MdOutlineWarningAmber className="h-5 w-5" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
                    {stats.atRiskCount}
                  </h3>
                  <span className="inline-flex items-center rounded-md bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    {stats.atRiskPercent}% del equipo
                  </span>
                </div>

                {/* Barra de proporción */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, stats.atRiskPercent))}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-white/60">
                {stats.atRiskCount === 0
                  ? "Sin colaboradores en riesgo"
                  : "Requieren acompañamiento 1:1"}
              </p>
            </NexxusCard>

            {/* KPI 3: Carga Laboral Promedio */}
            <NexxusCard extra="p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-white/60">
                  Carga Laboral
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
                  <MdOutlineFitnessCenter className="h-5 w-5" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
                    {stats.avgWorkload}
                    <span className="text-sm font-normal text-gray-400 dark:text-white/40 ml-1">/ 5</span>
                  </h3>
                  <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-white/70">
                    {stats.avgWorkload >= 4 ? "Elevada" : stats.avgWorkload >= 2.5 ? "Equilibrada" : "Ligera"}
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stats.avgWorkload >= 4
                        ? "bg-amber-500"
                        : "bg-brand-500 dark:bg-brand-400"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, (stats.avgWorkload / 5) * 100))}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-white/60">
                Promedio general del equipo
              </p>
            </NexxusCard>

            {/* KPI 4: Alertas Activas */}
            <NexxusCard extra="p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-white/60">
                  Alertas Activas
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/20 dark:text-purple-300">
                  <MdOutlineNotificationsActive className="h-5 w-5" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold tracking-tight text-navy-700 dark:text-white">
                    {unresolvedCount}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      unresolvedCount > 0
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                    }`}
                  >
                    {unresolvedCount > 0 ? "Pendientes" : "Al día"}
                  </span>
                </div>

                {/* Barra de proporción */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      unresolvedCount > 0 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: unresolvedCount > 0 ? "100%" : "0%" }}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-white/60">
                {unresolvedCount === 0 ? "Todas las alertas resueltas" : "Seguimiento requerido en tabla"}
              </p>
            </NexxusCard>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTipoGrafico("estres")}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                    tipoGrafico === "estres"
                      ? "bg-brand-500 text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200/80 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
                  }`}
                >
                  Nivel de Estrés (14 días)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoGrafico("pulso")}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
                    tipoGrafico === "pulso"
                      ? "bg-brand-500 text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200/80 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10"
                  }`}
                >
                  Pulso Promedio (14 días)
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
