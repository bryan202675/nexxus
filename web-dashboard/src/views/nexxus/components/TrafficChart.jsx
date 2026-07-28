import { useMemo } from "react";
import { MdArrowDropUp } from "react-icons/md";
import NexxusCard from "./NexxusCard";
import NexxusBarChart from "./NexxusBarChart";
import useIsDarkMode from "views/nexxus/utils/useIsDarkMode";

const TrafficChart = ({ title, value, unit, change, data, categories, delay = 0 }) => {
  const isDark = useIsDarkMode();

  const chartOptions = useMemo(
    () => ({
      chart: { toolbar: { show: false } },
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
      grid: { show: false },
      fill: {
        type: "gradient",
        gradient: {
          type: "vertical",
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.9,
          colorStops: [
            [
              { offset: 0, color: "#7551FF", opacity: 1 },
              { offset: 100, color: "rgba(117, 81, 255, 0.28)", opacity: 0.28 },
            ],
          ],
        },
      },
      dataLabels: { enabled: false },
      plotOptions: { bar: { borderRadius: 10, columnWidth: "40px" } },
    }),
    [isDark, categories]
  );

  return (
    <NexxusCard extra="pb-7 p-[20px]" delay={delay}>
      <div className="flex flex-row justify-between">
        <div className="ml-1 pt-2">
          <p className="text-sm font-medium leading-4 text-gray-600 dark:text-white/70">
            {title}
          </p>
          <p className="text-[34px] font-bold text-navy-700 dark:text-white">
            {value}{" "}
            <span className="text-sm font-medium leading-6 text-gray-600 dark:text-white/70">
              {unit}
            </span>
          </p>
        </div>
        <div className="mt-2 flex items-start">
          <div className="flex items-center text-sm text-green-500 dark:text-green-400">
            <MdArrowDropUp className="h-5 w-5" />
            <p className="font-bold">{change}</p>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full pt-10 pb-0">
        <NexxusBarChart chartData={data} chartOptions={chartOptions} />
      </div>
    </NexxusCard>
  );
};

export default TrafficChart;
