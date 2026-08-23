import Chart from "react-apexcharts";

type BarChartProps = Pick<React.ComponentProps<typeof Chart>, "options" | "series"> & {
  chartData: React.ComponentProps<typeof Chart>["series"];
  chartOptions: React.ComponentProps<typeof Chart>["options"];
};

const BarChart = ({ chartData, chartOptions }: BarChartProps) => (
  <Chart options={chartOptions} series={chartData} type="bar" width="100%" height="100%" />
);

export default BarChart;
