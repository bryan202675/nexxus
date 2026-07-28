import { useMemo } from "react";
import { MdBarChart } from "react-icons/md";
import NexxusCard from "./NexxusCard";
import NexxusBarChart from "./NexxusBarChart";
import useIsDarkMode from "views/nexxus/utils/useIsDarkMode";

const SERIES_COLORS = ["#422AFB", "#17c1e8", "#a3aed0"];

const RevenueChart = ({ title, series, categories, delay = 0 }) => {
  const isDark = useIsDarkMode();

  const chartOptions = useMemo(
    () => ({
      chart: { stacked: true, toolbar: { show: false } },
      tooltip: { theme: isDark ? "dark" : "light" },
      xaxis: {
        categories,
        show: false,
        labels: {
          show: true,
          style: {
            colors: isDark ? "#E0E0E0" : "#A3AED0",
            fontSize: "14px",
            fontWeight: "500",
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { show: false },
      grid: {
        borderColor: isDark ? "#404040" : "rgba(163, 174, 208, 0.3)",
        show: true,
        yaxis: { lines: { show: false } },
        xaxis: { lines: { show: false } },
      },
      fill: { type: "solid", colors: SERIES_COLORS },
      legend: { show: false },
      colors: SERIES_COLORS,
      dataLabels: { enabled: false },
      plotOptions: { bar: { borderRadius: 10, columnWidth: "20px" } },
    }),
    [isDark, categories]
  );

  return (
    <NexxusCard
      extra="flex flex-col w-full rounded-[20px] py-6 px-2 text-center"
      delay={delay}
    >
      <div className="mb-auto flex items-center justify-between px-6">
        <h2 className="text-lg font-bold text-navy-700 dark:text-white">
          {title}
        </h2>
        <button className="flex items-center justify-center rounded-lg bg-lightPrimary p-2 text-brand-500 transition duration-250 hover:bg-gray-100 dark:bg-charcoal-light dark:text-white dark:hover:bg-white/10">
          <MdBarChart className="h-6 w-6" />
        </button>
      </div>
      <div className="md:mt-16 lg:mt-0">
        <div className="h-[250px] w-full xl:h-[350px]">
          <NexxusBarChart chartData={series} chartOptions={chartOptions} />
        </div>
      </div>
    </NexxusCard>
  );
};

export default RevenueChart;
