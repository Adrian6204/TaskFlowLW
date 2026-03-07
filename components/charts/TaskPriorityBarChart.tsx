
import React from 'react';
import { Task, Priority, TaskStatus } from '../../types';

interface TaskPriorityBarChartProps {
  tasks: Task[];
}

const priorityConfig = [
  {
    key: Priority.URGENT,
    label: 'Urgent',
    bar: 'bg-red-500',
    bg: 'bg-white/40 dark:bg-white/5 border border-red-500/10',
    badge: 'text-red-600 dark:text-red-400 font-black',
    track: 'bg-black/5 dark:bg-white/5',
    dot: 'bg-red-500',
  },
  {
    key: Priority.HIGH,
    label: 'High',
    bar: 'bg-orange-500',
    bg: 'bg-white/40 dark:bg-white/5 border border-orange-500/10',
    badge: 'text-orange-600 dark:text-orange-400 font-black',
    track: 'bg-black/5 dark:bg-white/5',
    dot: 'bg-orange-500',
  },
  {
    key: Priority.MEDIUM,
    label: 'Medium',
    bar: 'bg-indigo-500',
    bg: 'bg-white/40 dark:bg-white/5 border border-indigo-500/10',
    badge: 'text-indigo-600 dark:text-indigo-400 font-black',
    track: 'bg-black/5 dark:bg-white/5',
    dot: 'bg-indigo-500',
  },
  {
    key: Priority.LOW,
    label: 'Low',
    bar: 'bg-slate-400',
    bg: 'bg-white/40 dark:bg-white/5 border border-slate-500/10',
    badge: 'text-slate-600 dark:text-slate-400 font-black',
    track: 'bg-black/5 dark:bg-white/5',
    dot: 'bg-slate-400',
  },
];

const TaskPriorityBarChart: React.FC<TaskPriorityBarChartProps> = ({ tasks }) => {
  const activeTasks = tasks.filter(t => t.status !== TaskStatus.DONE);
  const total = activeTasks.length;

  const counts = {
    [Priority.URGENT]: activeTasks.filter(t => t.priority === Priority.URGENT).length,
    [Priority.HIGH]: activeTasks.filter(t => t.priority === Priority.HIGH).length,
    [Priority.MEDIUM]: activeTasks.filter(t => t.priority === Priority.MEDIUM).length,
    [Priority.LOW]: activeTasks.filter(t => t.priority === Priority.LOW).length,
  };

  const maxCount = Math.max(...Object.values(counts), 1);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs gap-2">
        <span className="font-bold uppercase tracking-wider">No active tasks</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center gap-3 h-full">
      {priorityConfig.map(({ key, label, bar, bg, badge, track, dot }) => {
        const count = counts[key];
        const barWidth = (count / maxCount) * 100;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;

        return (
          <div key={key} className={`rounded-xl p-3 ${bg} transition-all`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
                <span className="text-xs font-bold text-slate-700 dark:text-white/80 uppercase tracking-wider">
                  {label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 dark:text-white/40 font-medium">{pct}%</span>
                <span className={`text-sm ${badge}`}>
                  {count}
                </span>
              </div>
            </div>
            {/* Bar */}
            <div className={`w-full h-2 rounded-full ${track} overflow-hidden`}>
              <div
                className={`h-full rounded-full ${bar} transition-all duration-700`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskPriorityBarChart;
