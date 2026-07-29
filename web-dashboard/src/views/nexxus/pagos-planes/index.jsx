import { useEffect, useMemo, useState } from "react";
import { MdOutlineAttachMoney, MdOutlineTrendingUp, MdOutlineBusiness } from "react-icons/md";

import NexxusWidget from "views/nexxus/components/NexxusWidget";
import NexxusCard from "views/nexxus/components/NexxusCard";
import DistributionChart from "views/nexxus/components/DistributionChart";
import RecordsTable from "views/nexxus/components/RecordsTable";
import BarChart from "components/charts/BarChart";
import useIsDarkMode from "views/nexxus/utils/useIsDarkMode";

import { getPlatformStats, subscribePayments, loadMoreCompanies } from "services/superAdminRepository";
import { formatoMoneda, formatoFechaHora } from "services/saFormat";

const LIMITE_PAGOS = 80;

const columnsPagos = [
  { Header: "Empresa", accessor: "empresa" },
  { Header: "Plan", accessor: "plan" },
  { Header: "Estado", accessor: "estado" },
  { Header: "Monto", accessor: "monto" },
  { Header: "Fecha", accessor: "fecha" },
];

function PlanesVendidosChart({ labels, series, delay }) {
  const isDark = useIsDarkMode();
  const options = {
    chart: { toolbar: { show: false } },
    tooltip: { theme: isDark ? "dark" : "light" },
    xaxis: {
      categories: labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: isDark ? "#E0E0E0" : "#A3AED0", fontSize: "12px", fontWeight: "500" } },
    },
    yaxis: { labels: { style: { colors: isDark ? "#E0E0E0" : "#A3AED0", fontSize: "12px" } } },
    grid: {
      borderColor: isDark ? "#404040" : "rgba(163, 174, 208, 0.3)",
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    fill: { type: "solid", colors: ["#422AFB"] },
    colors: ["#422AFB"],
    dataLabels: { enabled: false },
    plotOptions: { bar: { borderRadius: 8, columnWidth: "45%" } },
  };
  return (
    <NexxusCard extra="p-4" delay={delay}>
      <h4 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">Planes vendidos</h4>
      <div className="h-[260px] w-full">
        <BarChart chartData={[{ name: "Empresas", data: series }]} chartOptions={options} />
      </div>
    </NexxusCard>
  );
}

const PagosPlanes = () => {
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState("");

  const [pagos, setPagos] = useState([]);
  const [pagosCargando, setPagosCargando] = useState(true);
  const [pagosError, setPagosError] = useState("");

  const [nombresEmpresas, setNombresEmpresas] = useState({});

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

  useEffect(() => {
    const unsubscribe = subscribePayments(
      LIMITE_PAGOS,
      ({ items }) => {
        setPagos(items);
        setPagosCargando(false);
      },
      (err) => {
        setPagosError(err.message || "No se pudieron cargar los pagos.");
        setPagosCargando(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    loadMoreCompanies({}, 500, null)
      .then(({ items }) => {
        if (!active) return;
        const mapa = {};
        items.forEach((empresa) => {
          mapa[empresa.id] = empresa.nombre;
        });
        setNombresEmpresas(mapa);
      })
      .catch(() => {
        // Si falla la resolución de nombres, la tabla sigue mostrando el id de empresa.
      });
    return () => {
      active = false;
    };
  }, []);

  const distribucionPlanes = useMemo(() => {
    const entries = Object.entries(stats?.porPlan || {}).sort((a, b) => b[1] - a[1]);
    return {
      labels: entries.slice(0, 4).map(([plan]) => plan),
      series: entries.slice(0, 4).map(([, count]) => count),
      todasLabels: entries.map(([plan]) => plan),
      todasSeries: entries.map(([, count]) => count),
    };
  }, [stats]);

  const filasPagos = useMemo(
    () =>
      pagos.map((pago) => ({
        empresa: nombresEmpresas[pago.empresaId] || pago.empresaId,
        plan: pago.plan,
        estado: pago.status,
        monto: formatoMoneda(pago.amount),
        fecha: formatoFechaHora(pago.createdAt),
      })),
    [pagos, nombresEmpresas]
  );

  const widgets = stats
    ? [
        { icon: MdOutlineAttachMoney, title: "Ingresos confirmados", subtitle: formatoMoneda(stats.ingresosTotales) },
        { icon: MdOutlineTrendingUp, title: "Ingresos 30 días", subtitle: formatoMoneda(stats.ingresos30d) },
        { icon: MdOutlineBusiness, title: "Empresas con plan", subtitle: String(stats.empresasTotal) },
      ]
    : [];

  return (
    <div>
      {statsError ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {statsError}
        </p>
      ) : null}
      {pagosError ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-400/10 dark:text-red-400">
          {pagosError}
        </p>
      ) : null}

      {!stats ? (
        <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando estadísticas...</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-3">
          {widgets.map((w, i) => (
            <NexxusWidget key={w.title} {...w} delay={i * 100} />
          ))}
        </div>
      )}

      {distribucionPlanes.todasLabels.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <DistributionChart
            title="Distribución de planes"
            series={distribucionPlanes.series}
            labels={distribucionPlanes.labels}
            delay={150}
          />
          <PlanesVendidosChart
            labels={distribucionPlanes.todasLabels}
            series={distribucionPlanes.todasSeries}
            delay={200}
          />
        </div>
      ) : null}

      <div className="mt-5">
        {pagosCargando ? (
          <p className="text-sm font-medium text-gray-600 dark:text-white/70">Cargando pagos...</p>
        ) : (
          <>
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-white/70">
              Mostrando {pagos.length} pagos
            </p>
            <RecordsTable
              title="Pagos recientes"
              columnsData={columnsPagos}
              tableData={filasPagos}
              delay={250}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default PagosPlanes;
