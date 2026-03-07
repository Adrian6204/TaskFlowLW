
import React from 'react';
import { Task, TaskStatus } from '../../types';

interface TaskStatusPieChartProps {
  tasks: Task[];
}

const statusConfig = {
  [TaskStatus.TODO]: { color: '#fb923c', bg: 'bg-orange-500', faint: 'bg-orange-500/10', text: 'text-orange-500', name: 'To Do' },
  [TaskStatus.IN_PROGRESS]: { color: '#6366f1', bg: 'bg-indigo-500', faint: 'bg-indigo-500/10', text: 'text-indigo-500', name: 'In Progress' },
  [TaskStatus.DONE]: { color: '#10b981', bg: 'bg-emerald-500', faint: 'bg-emerald-500/10', text: 'text-emerald-500', name: 'Done' },
};

const TaskStatusPieChart: React.FC<TaskStatusPieChartProps> = ({ tasks }) => {
  const totalTasks = tasks.length;

  const counts = {
    [TaskStatus.TODO]: tasks.filter(t => t.status === TaskStatus.TODO).length,
    [TaskStatus.IN_PROGRESS]: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    [TaskStatus.DONE]: tasks.filter(t => t.status === TaskStatus.DONE).length,
  };

  if (totalTasks === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs gap-2">
        <div className="w-24 h-24 rounded-full border-4 border-slate-200 dark:border-slate-800 opacity-40" />
        <span className="font-bold uppercase tracking-wider">No task data</span>
      </div>
    );
  }

  let cumulativePercentage = 0;
  const segments = (Object.keys(statusConfig) as TaskStatus[]).map(status => {
    const percentage = (counts[status] / totalTasks) * 100;
    if (percentage === 0) return null;

    const startAngle = (cumulativePercentage / 100) * 360;
    cumulativePercentage += percentage;
    const endAngle = (cumulativePercentage / 100) * 360;

    const r = 40;
    const startX = 50 + r * Math.cos(startAngle * Math.PI / 180);
    const startY = 50 + r * Math.sin(startAngle * Math.PI / 180);
    const endX = 50 + r * Math.cos(endAngle * Math.PI / 180);
    const endY = 50 + r * Math.sin(endAngle * Math.PI / 180);
    const largeArcFlag = percentage > 50 ? 1 : 0;

    const pathData = percentage === 100
      ? `M 50,50 m -${r},0 a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`
      : `M 50,50 L ${startX},${startY} A ${r},${r} 0 ${largeArcFlag},1 ${endX},${endY} Z`;

    return {
      path: pathData,
      color: statusConfig[status].color,
      status,
      percentage: Math.round(percentage),
      count: counts[status],
    };
  }).filter(Boolean);

  return (
    <div className="flex items-center gap-8 h-full w-full">
      {/* Donut chart */}
      <div className="relative shrink-0 w-36 h-36 drop-shadow-xl">
        <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
          {segments.map((seg: any) => (
            <path
              key={seg.status}
              d={seg.path}
              fill={seg.color}
              className="hover:opacity-80 transition-opacity cursor-pointer stroke-white dark:stroke-slate-900 stroke-[2]"
            />
          ))}
          {/* Inner hole */}
          <circle cx="50" cy="50" r="26" fill="white" className="dark:fill-slate-900" />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{totalTasks}</span>
          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">Total</span>
        </div>
      </div>

      {/* Stat legend — right side */}
      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
        {segments.map((seg: any) => {
          const cfg = statusConfig[seg.status as TaskStatus];
          return (
            <div key={seg.status} className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 flex flex-col justify-center gap-1 border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.bg} shrink-0`} />
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{cfg.name}</span>
              </div>
              <div className="flex items-end justify-between mt-1">
                <span className={`text-2xl font-black leading-none ${cfg.text}`}>{seg.count}</span>
                <span className="text-xs font-bold text-slate-400 dark:text-white/30">{seg.percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskStatusPieChart;
