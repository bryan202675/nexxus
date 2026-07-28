import Chart from "react-apexcharts";

// Unlike components/charts/BarChart (a class component that only reads props on mount),
// this reads props on every render so dark-mode option changes apply without a page refresh.
const NexxusBarChart = ({ chartData, chartOptions }) => (
  <Chart
    options={chartOptions}
    series={chartData}
    type="bar"
    width="100%"
    height="100%"
  />
);

export default NexxusBarChart;
