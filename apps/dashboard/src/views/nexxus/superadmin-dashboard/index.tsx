import { useEffect, useMemo, useState } from "react";
import {
  MdOutlineBusiness,
  MdCheckCircle,
  MdOutlinePeople,
  MdOutlineHowToReg,
  MdOutlineAttachMoney,
  MdOutlineTrendingUp,
} from "react-icons/md";

import NexxusWidget from "views/nexxus/components/NexxusWidget";
import TrendChart from "views/nexxus/components/TrendChart";
import DistributionChart from "views/nexxus/components/DistributionChart";
import DataTable from "views/nexxus/components/DataTable";
import RecordsTable from "views/nexxus/components/RecordsTable";

import { columnsEmpresasRecientes, columnsActividadReciente } from "views/nexxus/data/columns";
import { getPlatformStats, subscribePlatform } from "services/superAdminRepository";
import { formatoMoneda, formatoFecha, etiquetaEstadoEmpresa } from "services/saFormat";

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const AUDIT_STATUS_MAP = { Success: "Approved", Warning: "Error", Error: "Disable" };

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [snapshot, setSnapshot] = useState({ empresas: [], pagos: [], auditoria: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getPlatformStats()
      .then((value) => active && setStats(value))
      .catch((err) => active && setError(err.message || "No se pudieron cargar las estadísticas."));
    const unsubscribe = subscribePlatform(
      (value) => active && setSnapshot(value),
      (err) => active && setError(err.message || "No se pudo conectar con Firestore.")
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const ingresosPorMes = useMemo(() => {
    const buckets = new Map();
    for (const pago of snapshot.pagos) {
      if (!pago.createdAt) continue;
      const date = new Date(pago.createdAt);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      buckets.set(key, (buckets.get(key) || 0) + pago.amount);
    }
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      months.push({ key, label: MESES_CORTOS[d.getMonth()], value: buckets.get(key) || 0 });
    }
    return months;
  }, [snapshot.pagos]);

  const empresasRecientes = useMemo(() => {
    return [...snapshot.empresas]
      .sort((a, b) => (b.fechaCreacion || "").localeCompare(a.fechaCreacion || ""))
      .slice(0, 6)
      .map((empresa) => ({
        nombre: empresa.nombre,
        plan: empresa.plan,
        estado: etiquetaEstadoEmpresa(empresa.estado),
        fecha: formatoFecha(empresa.fechaCreacion),
      }));
  }, [snapshot.empresas]);

  // audit_logs no siempre guarda empresaNombre denormalizado (p.ej. aiAssistant.js solo guarda
  // empresaId) -- sin este mapa, "Empresa" salía vacía para casi todos los registros.
  const nombreEmpresaPorId = useMemo(() => {
    const map = new Map();
    snapshot.empresas.forEach((empresa) => map.set(empresa.id, empresa.nombre));
    return map;
  }, [snapshot.empresas]);

  const actividadReciente = useMemo(() => {
    return snapshot.auditoria
      .filter((entry) => entry.modulo !== "IA")
      .slice(0, 7)
      .map((entry) => ({
        accion: entry.accion,
        modulo: entry.modulo,
        empresa: entry.empresaNombre || nombreEmpresaPorId.get(entry.empresaId) || "—",
        fecha: formatoFecha(entry.timestamp),
        status: AUDIT_STATUS_MAP[entry.estado] || "Approved",
      }));
  }, [snapshot.auditoria, nombreEmpresaPorId]);

  const distribucionPlanes = useMemo(() => {
    const entries = Object.entries((stats?.porPlan || {}) as Record<string, number>).sort((a, b) => b[1] - a[1]).slice(0, 4);
    return {
      labels: entries.map(([plan]) => plan),
      series: entries.map(([, count]) => count),
    };
  }, [stats]);

  const widgets = stats
    ? [
        { icon: MdOutlineBusiness, title: "Empresas totales", subtitle: String(stats.empresasTotal) },
        { icon: MdCheckCircle, title: "Empresas activas", subtitle: String(stats.empresasActivas) },
        { icon: MdOutlinePeople, title: "Usuarios totales", subtitle: String(stats.usuariosTotal) },
        { icon: MdOutlineHowToReg, title: "Usuarios activos", subtitle: String(stats.usuariosActivos) },
        { icon: MdOutlineAttachMoney, title: "Ingresos totales", subtitle: formatoMoneda(stats.ingresosTotales) },
        { icon: MdOutlineTrendingUp, title: "Ingresos 30 días", subtitle: formatoMoneda(stats.ingresos30d) },
      ]
    : [];

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {!stats ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando estadísticas...</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-6">
          {widgets.map((w, i) => (
            <NexxusWidget key={w.title} {...w} delay={i * 100} />
          ))}
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <TrendChart
          title="Ingresos por mes"
          total={stats ? formatoMoneda(stats.ingresosTotales) : "—"}
          change="Últimos 6 meses"
          series={[{ name: "Ingresos", data: ingresosPorMes.map((m) => m.value), color: "#422AFB" }]}
          categories={ingresosPorMes.map((m) => m.label)}
          delay={100}
        />
        {distribucionPlanes.labels.length > 0 ? (
          <DistributionChart
            title="Distribución de planes"
            series={distribucionPlanes.series}
            labels={distribucionPlanes.labels}
            delay={150}
          />
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DataTable
          title="Empresas recientes"
          columnsData={columnsEmpresasRecientes}
          tableData={empresasRecientes}
          readOnly
          delay={100}
        />
        <RecordsTable
          title="Actividad reciente"
          columnsData={columnsActividadReciente}
          tableData={actividadReciente}
          delay={150}
        />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
