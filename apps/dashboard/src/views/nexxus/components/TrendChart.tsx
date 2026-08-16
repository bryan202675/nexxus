import { useMemo } from "react";
import LineChart from "components/charts/LineChart";
import NexxusCard from "./NexxusCard";
import useIsDarkMode from "views/nexxus/utils/useIsDarkMode";

interface TrendChartProps {
  title: string;
  total: string;
  change: string;
  series: Array<{ name: string; data: number[]; color?: string }>;
  categories: string[];
  delay?: number;
}

const TrendChart = ({ title, total, change, series, categories, delay = 0 }: TrendChartProps) => {
  const isDark = useIsDarkMode();

  const options = useMemo(
    () => ({
      legend: { show: false },
      theme: { mode: isDark ? "dark" : "light" },
      chart: {
        type: "line",
        toolbar: { show: false },
        background: "transparent",
        animations: { enabled: true, easing: "easeinout", speed: 400 },
      },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 3.5 },
      tooltip: { theme: isDark ? "dark" : "light" },
      grid: {
        show: true,
        borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
        strokeDashArray: 4,
        yaxis: { lines: { show: true } },
        xaxis: { lines: { show: false } },
      },
      xaxis: {
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: isDark ? "#A3AED0" : "#707EAE",
            fontSize: "12px",
            fontWeight: "600",
          },
        },
        type: "text",
        categories,
      },
      yaxis: {
        min: 0,
        max: 5,
        tickAmount: 5,
        labels: {
          style: {
            colors: isDark ? "#A3AED0" : "#707EAE",
            fontSize: "11px",
            fontWeight: "500",
          },
          formatter: (val: number) => String(Math.round(val)),
        },
      },
    }),
    [isDark, categories]
  );

  return (
    <NexxusCard extra="flex flex-col w-full rounded-[20px] p-6" delay={delay}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
            {title}
          </p>
          <h3 className="mt-1 text-2xl font-black text-navy-700 dark:text-white">
            {total}
          </h3>
        </div>
        <div className="self-start sm:self-auto rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-white/5 dark:text-white/60">
          {change}
        </div>
      </div>
      <div className="h-[220px] w-full pt-2">
        <LineChart series={series} options={options} />
      </div>
    </NexxusCard>
  );
};

export default TrendChart;
