import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface LineChartProps {
  title?: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor?: string;
  }[];
}

const LineChart: React.FC<LineChartProps> = ({ labels, datasets }) => {
  const chartData = { labels, datasets };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        title: { display: false },
    },
    scales: {
      x: {
        type: "category" as const,
        grid: { drawBorder: false, drawTicks: false } as const,
      },
      y: {
        type: "linear" as const,
        beginAtZero: true,
        grid: { drawBorder: false, drawTicks: false } as const,
        ticks: {
          maxTicksLimit: 7,
        },
      },
    },
    elements: {
      line: { tension: 0.4 },
    },
  } as const;
  
  return (
    <div className="h-auto w-full">
        <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default LineChart;
