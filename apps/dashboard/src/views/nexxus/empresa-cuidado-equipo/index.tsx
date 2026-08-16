import { useEffect, useMemo, useState } from "react";
import {
  MdOutlineFavorite,
  MdOutlineWarningAmber,
  MdOutlineFitnessCenter,
  MdOutlineNotificationsActive,
} from "react-icons/md";

import NexxusWidget from "views/nexxus/components/NexxusWidget";
import TrendChart from "views/nexxus/components/TrendChart";
import PeoplePriorityTable from "./PeoplePriorityTable";

import { useAuth } from "context/AuthContext";
import { useTeamCareAlerts, TeamCareAlert } from "context/TeamCareAlertsContext";
import { subscribeEmpleados, subscribeCheckIns } from "services/adminRepository";
import { summarizeTeamCheckIns, teamCareStats, STRESS_SCORE, estresDeCheckIn } from "services/checkInAnalytics";

const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

export default function CuidadoEquipo() {
  const { empresaId } = useAuth();
  const { alerts, unresolvedCount, markAsResolved } = useTeamCareAlerts();
  const [error, setError] = useState("");
  const [empleados, setEmpleados] = useState(null);
  const [checkIns, setCheckIns] = useState([]);

  useEffect(() => {
    if (!empresaId) return;
    const onErr = (err) => setError(err.message || "No se pudo conectar con la base de datos.");
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
      // Se queda la mas reciente sin resolver; si todas estan resueltas, la mas reciente.
      if (!actual || (!alerta.resuelta && actual.resuelta) || alerta.created_at > actual.created_at) {
        map.set(alerta.usuario_id, alerta);
      }
    }
    return map;
  }, [alerts]);

  // Serie de 14 dias: estres promedio del equipo por dia (a partir de estresDeCheckIn,
  // el mismo helper que usa el widget "Prioridades" del Resumen, para no inventar un
  // segundo criterio de "estres" en el dashboard).
  const serieEstres = useMemo(() => {
    const dias = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dias.push({ key: d.toISOString().slice(0, 10), label: DIAS_CORTOS[d.getDay()] });
    }
    const promedios = dias.map(({ key }) => {
      const valores = checkIns
        .filter((c: any) => (c.created_at || "").slice(0, 10) === key)
        .map(estresDeCheckIn)
        .filter((v) => v !== null) as number[];
      if (valores.length === 0) return 0;
      return Math.round((valores.reduce((sum, v) => sum + v, 0) / valores.length) * 10) / 10;
    });
    return { categorias: dias.map((d) => d.label), promedios };
  }, [checkIns]);

  const widgets = [
    { icon: MdOutlineFavorite, title: "Pulso promedio del equipo", subtitle: `${stats.avgPulse}%` },
    { icon: MdOutlineWarningAmber, title: "En riesgo", subtitle: `${stats.atRiskCount} (${stats.atRiskPercent}%)` },
    { icon: MdOutlineFitnessCenter, title: "Carga laboral promedio", subtitle: `${stats.avgWorkload}/5` },
    { icon: MdOutlineNotificationsActive, title: "Alertas sin resolver", subtitle: String(unresolvedCount) },
  ];

  if (!empresaId) {
    return <p className="text-sm font-medium text-gray-600 dark:text-white/70">Tu cuenta no tiene una empresa asociada.</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-navy-700 dark:text-white">Cuidado del Equipo</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
          Estadísticas de bienestar del equipo a partir de los check-ins diarios, y las personas que necesitan atención inmediata.
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">{error}</p>
      ) : null}

      {empleados === null ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando datos del equipo...</p>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {widgets.map((w, i) => (
              <NexxusWidget key={w.title} {...w} delay={i * 100} />
            ))}
          </div>

          <TrendChart
            title="Estrés promedio del equipo (14 días)"
            total={`${stats.avgStress}/5`}
            change="Escala de estrés: 1 bajo · 5 crítico"
            series={[{ name: "Estrés promedio", data: serieEstres.promedios, color: "#EF4444" }]}
            categories={serieEstres.categorias}
            delay={100}
          />

          <PeoplePriorityTable summaries={summaries} alertsByUser={alertsByUser} onResolve={markAsResolved} delay={150} />
        </div>
      )}
    </div>
  );
}
