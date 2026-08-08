import { useMemo } from "react";
import PieChart from "components/charts/PieChart";
import NexxusCard from "./NexxusCard";
import useIsDarkMode from "views/nexxus/utils/useIsDarkMode";

const LEGEND_COLORS = ["#422AFB", "#6AD2FF", "#7551FF"];

const DistributionChart = ({ title, series, labels, delay = 0 }) => {
  const isDark = useIsDarkMode();
  const total = series.reduce((sum, value) => sum + value, 0);
  const porcentajes = series.map((value) => (total > 0 ? Math.round((value / total) * 100) : 0));

  const options = useMemo(
    () => ({
      labels,
      colors: LEGEND_COLORS,
      chart: { width: "50px" },
      states: { hover: { filter: { type: "none" } } },
      legend: { show: false },
      dataLabels: { enabled: false },
      hover: { mode: null },
      plotOptions: {
        pie: { donut: { labels: { show: false } } },
      },
      fill: { colors: LEGEND_COLORS },
      tooltip: { enabled: true, theme: isDark ? "dark" : "light" },
    }),
    [isDark, labels]
  );

  return (
    <NexxusCard extra="rounded-[20px] p-3" delay={delay}>
      <div className="flex flex-row justify-between px-3 pt-2">
        <h4 className="text-lg font-bold text-navy-700 dark:text-white">
          {title}
        </h4>
      </div>

      <div className="mb-auto flex h-[220px] w-full items-center justify-center">
        <PieChart options={options} series={series} />
      </div>

      <div className="flex flex-row justify-between rounded-2xl px-6 py-3 shadow-2xl shadow-shadow-500 dark:!bg-charcoal-light dark:shadow-none">
        {labels.map((label, i) => (
          <div key={label} className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: LEGEND_COLORS[i % LEGEND_COLORS.length] }}
              />
              <p className="ml-1 text-sm font-normal text-gray-600 dark:text-white/70">
                {label}
              </p>
            </div>
            <p className="mt-px text-xl font-bold text-navy-700 dark:text-white">
              {porcentajes[i]}%
            </p>
          </div>
        ))}
      </div>
    </NexxusCard>
  );
};

export default DistributionChart;
