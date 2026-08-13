import { useMemo } from "react";
import LineChart from "components/charts/LineChart";
import NexxusCard from "./NexxusCard";
import useIsDarkMode from "views/nexxus/utils/useIsDarkMode";

const TrendChart = ({ title, total, change, series, categories, delay = 0 }) => {
  const isDark = useIsDarkMode();

  const options = useMemo(
    () => ({
      legend: { show: false },
      theme: { mode: isDark ? "dark" : "light" },
      chart: { type: "line", toolbar: { show: false }, background: "transparent" },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth" },
      tooltip: { theme: isDark ? "dark" : "light" },
      grid: { show: false },
      xaxis: {
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: isDark ? "#E0E0E0" : "#A3AED0",
            fontSize: "12px",
            fontWeight: "500",
          },
        },
        type: "text",
        categories,
      },
      yaxis: { show: false },
    }),
    [isDark, categories]
  );

  return (
    <NexxusCard extra="flex flex-col w-full rounded-[20px] p-6" delay={delay}>
      <div className="flex flex-row justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-white/70">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-navy-700 dark:text-white">
            {total}
          </h3>
          <p className="text-sm font-medium text-green-500 dark:text-green-400">
            {change}
          </p>
        </div>
      </div>
      <div className="h-[220px] w-full pt-6">
        <LineChart series={series} options={options} />
      </div>
    </NexxusCard>
  );
};

export default TrendChart;
