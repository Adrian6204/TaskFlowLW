
import React from 'react';
import { Task, TaskStatus } from '../../types';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

import { TASK_STATUS_CONFIG } from '../../constants/taskStatusConfig';

interface TaskStatusPieChartProps {
  tasks: Task[];
}

const TaskStatusPieChart: React.FC<TaskStatusPieChartProps> = ({ tasks }) => {
  const statusConfig = TASK_STATUS_CONFIG;
  const totalTasks = tasks.length;

  const counts = {
    [TaskStatus.TODO]: tasks.filter((t: Task) => t.status === TaskStatus.TODO).length,
    [TaskStatus.IN_PROGRESS]: tasks.filter((t: Task) => t.status === TaskStatus.IN_PROGRESS).length,
    [TaskStatus.DONE]: tasks.filter((t: Task) => t.status === TaskStatus.DONE).length,
  };

  if (totalTasks === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs gap-2">
        <div className="w-24 h-24 rounded-full border-4 border-slate-200 dark:border-slate-800 opacity-40" />
        <span className="font-bold uppercase tracking-wider">No task data</span>
      </div>
    );
  }

  const data = {
    labels: ['To Do', 'In Progress', 'Done'],
    datasets: [
      {
        data: [counts[TaskStatus.TODO], counts[TaskStatus.IN_PROGRESS], counts[TaskStatus.DONE]],
        backgroundColor: [
          statusConfig[TaskStatus.TODO].color,
          statusConfig[TaskStatus.IN_PROGRESS].color,
          statusConfig[TaskStatus.DONE].color,
        ],
        borderWidth: 2,
        borderColor: 'transparent',
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    cutout: '70%',
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
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1500,
    },
  };

  return (
    <div className="flex items-center gap-8 h-full w-full">
      {/* Donut chart */}
      <div className="relative shrink-0 w-36 h-36">
        <Doughnut data={data} options={options} />
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{totalTasks}</span>
          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Total</span>
        </div>
      </div>

      {/* Stat legend — right side */}
      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(Object.keys(statusConfig) as TaskStatus[]).map((status) => {
          const cfg = statusConfig[status];
          const count = counts[status];
          const percentage = Math.round((count / totalTasks) * 100);
          return (
            <div key={status} className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 flex flex-col justify-center gap-1 border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.bg} shrink-0`} />
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{cfg.label}</span>
              </div>
              <div className="flex items-end justify-between mt-1">
                <span className={`text-2xl font-black leading-none ${cfg.text}`}>{count}</span>
                <span className="text-xs font-bold text-slate-400 dark:text-white/30">{percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


export default TaskStatusPieChart;

