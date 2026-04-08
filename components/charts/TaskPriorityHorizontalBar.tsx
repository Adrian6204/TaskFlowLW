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

interface Props {
  tasks: Task[];
}

const priorityConfig = [
  { key: Priority.URGENT, label: 'Urgent', color: '#ef4444', text: 'text-red-500' },
  { key: Priority.HIGH, label: 'High', color: '#f97316', text: 'text-orange-500' },
  { key: Priority.MEDIUM, label: 'Medium', color: '#eab308', text: 'text-yellow-500' },
  { key: Priority.LOW, label: 'Low', color: '#a1a1aa', text: 'text-zinc-400' },
];

export default function TaskPriorityHorizontalBar({ tasks }: Props) {
  const activeTasks = tasks.filter((t) => t.status !== TaskStatus.DONE);

  const counts = priorityConfig.reduce((acc, curr) => {
    acc[curr.key] = activeTasks.filter((t) => t.priority === curr.key).length;
    return acc;
  }, {} as Record<Priority, number>);

  const data = {
    labels: priorityConfig.map(cfg => cfg.label),
    datasets: [
      {
        data: priorityConfig.map(cfg => counts[cfg.key]),
        backgroundColor: priorityConfig.map(cfg => cfg.color),
        borderRadius: 6,
        barThickness: 8,
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
        display: false,
        grid: { display: false },
        beginAtZero: true,
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#94a3b8',
          font: {
            size: 10,
            weight: 'bold' as const,
            family: "'Inter', sans-serif",
          },
        },
      },
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart' as const,
    },
  };

  return (
    <div className="h-full w-full flex items-center px-2">
      <div className="flex-1 h-[140px] relative">
        <Bar data={data} options={options} />
      </div>
      <div className="flex flex-col justify-around h-[140px] pl-4">
        {priorityConfig.map((cfg) => (
          <div key={cfg.key} className="flex items-center">
            <span className={`text-lg font-black ${cfg.text} leading-none`}>
              {counts[cfg.key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

