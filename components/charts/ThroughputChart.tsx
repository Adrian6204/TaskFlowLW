
import React, { useMemo } from 'react';
import { Task, TaskStatus } from '../../types';
import { TASK_STATUS_CONFIG } from '../../constants/taskStatusConfig';
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
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ThroughputChartProps {
  tasks: Task[];
}

const ThroughputChart: React.FC<ThroughputChartProps> = ({ tasks }) => {
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const labels = last7Days.map(date => date.toLocaleDateString('en-US', { weekday: 'short' }));
    
    // Created Tasks Data
    const createdCounts = last7Days.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      return tasks.filter(t => t.createdAt.startsWith(dateStr)).length;
    });

    // Completed Tasks Data
    const completedCounts = last7Days.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      return tasks.filter(t => 
        t.status === TaskStatus.DONE && 
        t.completedAt && 
        t.completedAt.startsWith(dateStr)
      ).length;
    });

    const createdColor = TASK_STATUS_CONFIG[TaskStatus.TODO].chart;
    const completedColor = TASK_STATUS_CONFIG[TaskStatus.DONE].chart;

    return {
      labels,
      datasets: [
        {
          fill: true,
          label: 'Created Tasks',
          data: createdCounts,
          borderColor: createdColor,
          backgroundColor: `${createdColor}22`,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: createdColor,
          pointHoverRadius: 6,
        },
        {
          fill: true,
          label: 'Completed Tasks',
          data: completedCounts,
          borderColor: completedColor,
          backgroundColor: `${completedColor}44`,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: completedColor,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [tasks]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          color: '#94a3b8',
          font: { size: 10, weight: 'bold' as const },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 12, weight: 'bold' as const },
        bodyFont: { size: 11 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 10, weight: 'bold' as const },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          stepSize: 1,
          color: '#94a3b8',
          font: { size: 10 },
          padding: 8,
        },
      },
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart' as const,
    },
  };

  return (
    <div className="w-full h-full min-h-[180px]">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default ThroughputChart;
