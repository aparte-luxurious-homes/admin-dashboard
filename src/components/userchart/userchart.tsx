import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: false },
  },
};

interface ChartDataItem {
  label: string;
  thisYear: number;
  lastYear: number;
}

interface UsersChartProps {
  range: string;
  data: Record<string, ChartDataItem[]>;
}

const UsersChart: React.FC<UsersChartProps> = ({ range, data }) => {
  if (!data[range]) return <p>No data available for the selected range.</p>;

  const chartData = {
    labels: data[range].map((d) => d.label),
    datasets: [
      {
        label: "This Year",
        data: data[range].map((d) => d.thisYear),
        backgroundColor: "#007080",
        barPercentage: 0.4,
        categoryPercentage: 0.6,
      },
      {
        label: "Last Year",
        data: data[range].map((d) => d.lastYear),
        backgroundColor: "#B0B0B0",
        barPercentage: 0.4,
        categoryPercentage: 0.6,
      },
    ],
  };

  return (
    <div className="h-[200px] w-full">
      <Bar data={chartData} options={chartOptions} className="h-full w-full" />
    </div>
  );
};

export default UsersChart;
