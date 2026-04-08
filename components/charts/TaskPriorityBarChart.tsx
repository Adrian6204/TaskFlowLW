
import React from 'react';
import { Task, Priority, TaskStatus } from '../../types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip
);

interface TaskPriorityBarChartProps {
  tasks: Task[];
}

const priorityConfig = {
  [Priority.URGENT]: { label: 'Urgent', color: '#ef4444' },
  [Priority.HIGH]: { label: 'High', color: '#f97316' },
  [Priority.MEDIUM]: { label: 'Medium', color: '#eab308' },
  [Priority.LOW]: { label: 'Low', color: '#94a3b8' },
};

const TaskPriorityBarChart: React.FC<TaskPriorityBarChartProps> = ({ tasks }) => {
  const activeTasks = tasks.filter(t => t.status !== TaskStatus.DONE);
  const total = activeTasks.length;

  const counts = {
    [Priority.URGENT]: activeTasks.filter(t => t.priority === Priority.URGENT).length,
    [Priority.HIGH]: activeTasks.filter(t => t.priority === Priority.HIGH).length,
    [Priority.MEDIUM]: activeTasks.filter(t => t.priority === Priority.MEDIUM).length,
    [Priority.LOW]: activeTasks.filter(t => t.priority === Priority.LOW).length,
  };

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs gap-2">
        <span className="font-bold uppercase tracking-wider">No active tasks</span>
      </div>
    );
  }

  const data = {
    labels: Object.values(priorityConfig).map(cfg => cfg.label),
    datasets: [
      {
        data: [
          counts[Priority.URGENT],
          counts[Priority.HIGH],
          counts[Priority.MEDIUM],
          counts[Priority.LOW],
        ],
        backgroundColor: Object.values(priorityConfig).map(cfg => cfg.color),
        borderRadius: 8,
        barThickness: 20,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        cornerRadius: 8,
        padding: 10,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true,
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 10 } },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: { size: 11, weight: 'bold' as const },
        },
      },
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart' as const,
    },
  };

  return (
    <div className="w-full h-full min-h-[200px]">
      <Bar data={data} options={options} />
    </div>
  );
};

export default TaskPriorityBarChart;

