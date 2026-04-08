import React from 'react';
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

import { TASK_STATUS_CONFIG } from '../../constants/taskStatusConfig';

interface Props {
  tasks: Task[];
}

export default function TaskStatusStackedBar({ tasks }: Props) {
  const statusConfig = TASK_STATUS_CONFIG;
  const counts = {
    [TaskStatus.TODO]: tasks.filter((t: Task) => t.status === TaskStatus.TODO).length,
    [TaskStatus.IN_PROGRESS]: tasks.filter((t: Task) => t.status === TaskStatus.IN_PROGRESS).length,
    [TaskStatus.DONE]: tasks.filter((t: Task) => t.status === TaskStatus.DONE).length,
  };

  const data = {
    labels: ['Tasks'],
    datasets: [
      {
        label: 'To Do',
        data: [counts[TaskStatus.TODO]],
        backgroundColor: statusConfig[TaskStatus.TODO].color,
        borderRadius: tasks.length > 0 && counts[TaskStatus.IN_PROGRESS] === 0 && counts[TaskStatus.DONE] === 0 ? 8 : 0,
      },
      {
        label: 'In Progress',
        data: [counts[TaskStatus.IN_PROGRESS]],
        backgroundColor: statusConfig[TaskStatus.IN_PROGRESS].color,
      },
      {
        label: 'Done',
        data: [counts[TaskStatus.DONE]],
        backgroundColor: statusConfig[TaskStatus.DONE].color,
        borderRadius: tasks.length > 0 && counts[TaskStatus.TODO] === 0 && counts[TaskStatus.IN_PROGRESS] === 0 ? 8 : 0,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 12, weight: 'bold' as const },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        display: false,
        grid: { display: false },
      },
      y: {
        stacked: true,
        display: false,
        grid: { display: false },
      },
    },
    animation: {
      duration: 1500,
      easing: 'easeOutQuart' as const,
    },
  };

  return (
    <div className="flex flex-col justify-center h-full gap-6 px-4">
      {/* The Legend */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {(Object.keys(statusConfig) as TaskStatus[]).map((status) => {
          const count = counts[status];
          const cfg = statusConfig[status];
          return (
            <div key={status} className="flex flex-col items-center">
              <span className="text-[10px] items-center gap-1.5 font-bold text-slate-400 uppercase tracking-widest mb-1 flex">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                {cfg.label}
              </span>
              <span className="text-4xl font-black text-slate-800 dark:text-white transition-all duration-300">
                {count}
              </span>
            </div>
          );
        })}
      </div>


      {/* The Chart.js Bar */}
      <div className="w-full h-8 relative">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

