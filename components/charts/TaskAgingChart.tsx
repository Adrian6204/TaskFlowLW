
import React, { useMemo } from 'react';
import { Task, TaskStatus } from '../../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TaskAgingChartProps {
  tasks: Task[];
}

const TaskAgingChart: React.FC<TaskAgingChartProps> = ({ tasks }) => {
  const chartData = useMemo(() => {
    const now = new Date();
    const activeTasks = tasks.filter(t => t.status !== TaskStatus.DONE);

    const buckets = {
      fresh: 0,    // < 3 days
      active: 0,   // 3-7 days
      stagnant: 0, // 7-14 days
      delayed: 0,  // 14+ days
    };

    activeTasks.forEach(task => {
      const createdDate = new Date(task.createdAt);
      const ageInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

      if (ageInDays < 3) buckets.fresh++;
      else if (ageInDays < 7) buckets.active++;
      else if (ageInDays < 14) buckets.stagnant++;
      else buckets.delayed++;
    });

    const labels = ['< 3 Days', '3-7 Days', '7-14 Days', '14+ Days'];
    const data = [buckets.fresh, buckets.active, buckets.stagnant, buckets.delayed];
    
    // Gradient-like colors: Green -> Yellow -> Orange -> Red
    const backgroundColors = [
      'rgba(16, 185, 129, 0.6)', // fresh - emerald
      'rgba(244, 197, 10, 0.6)', // active - yellow
      'rgba(249, 115, 22, 0.6)', // stagnant - orange
      'rgba(239, 68, 68, 0.6)',  // delayed - red
    ];

    const borderColors = [
      'rgba(16, 185, 129, 1)',
      'rgba(244, 197, 10, 1)',
      'rgba(249, 115, 22, 1)',
      'rgba(239, 68, 68, 1)',
    ];

    return {
      labels,
      datasets: [
        {
          label: 'Active Tasks',
          data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 8,
          barThickness: 40,
        },
      ],
    };
  }, [tasks]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 12, weight: 'bold' as const },
        bodyFont: { size: 11 },
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
      duration: 1000,
      easing: 'easeOutQuart' as const,
    },
  };

  return (
    <div className="w-full h-48 mt-2">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default TaskAgingChart;
