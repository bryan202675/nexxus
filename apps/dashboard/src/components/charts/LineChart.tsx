import Chart from "react-apexcharts";

const LineChart = (props) => {
  const { series, options } = props;

  const mergedOptions = {
    ...options,
    chart: {
      ...options?.chart,
      background: "transparent",
    },
  };

  return (
    <Chart
      options={mergedOptions}
      type="line"
      width="100%"
      height="100%"
      series={series}
    />
  );
};

export default LineChart;
