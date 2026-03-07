
import React, { useMemo, useState } from 'react';
import { Task, Employee, TaskStatus, Priority } from '../types';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface GanttChartProps {
  tasks: Task[];
  employees: Employee[];
  onViewTask: (task: Task) => void;
}

const GanttChart: React.FC<GanttChartProps> = ({ tasks, employees, onViewTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get 14 days starting from current week
  const days = useMemo(() => {
    const result = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    for (let i = 0; i < 14; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      result.push(day);
    }
    return result;
  }, [currentDate]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getTaskPosition = (task: Task) => {
    const dueDate = new Date(task.dueDate);
    const createdDate = task.createdAt ? new Date(task.createdAt) : new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000);

    const startIndex = days.findIndex(d => d.toDateString() === createdDate.toDateString());
    const endIndex = days.findIndex(d => d.toDateString() === dueDate.toDateString());

    if (startIndex === -1 && endIndex === -1) return null;

    const actualStart = Math.max(0, startIndex === -1 ? 0 : startIndex);
    const actualEnd = Math.min(days.length - 1, endIndex === -1 ? days.length - 1 : endIndex);

    return {
      start: actualStart,
      span: actualEnd - actualStart + 1
    };
  };

  const statusColors = {
    [TaskStatus.DONE]: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
    [TaskStatus.IN_PROGRESS]: 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-500/30',
    [TaskStatus.TODO]: 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10',
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const getEmployee = (id: string) => {
    return employees.find(e => e.id === id);
  };

  // Group tasks by assignee
  const tasksByAssignee = useMemo(() => {
    const grouped: { [key: string]: Task[] } = {};
    tasks.forEach(task => {
      const key = task.assigneeId || 'unassigned';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
    });
    return grouped;
  }, [tasks]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Timeline Analytics</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {days[0]?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Timeline
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => navigateWeek(-1)}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Sync Today
              </button>
              <button
                onClick={() => navigateWeek(1)}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Grid */}
      <div className="overflow-x-auto scrollbar-none">
        <div className="min-w-[1200px]">
          {/* Days Header */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="w-52 flex-shrink-0 p-4 border-r border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Assignee</span>
            </div>
            <div className="flex-1 flex">
              {days.map((day, idx) => (
                <div
                  key={idx}
                  className={`flex-1 p-4 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${isToday(day) ? 'bg-primary-50/30 dark:bg-primary-500/5' : ''
                    }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isToday(day) ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {formatDate(day)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {Object.entries(tasksByAssignee).map(([assigneeId, assigneeTasks]) => (
              <div key={assigneeId} className="flex group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                {/* Assignee Identity */}
                <div className="w-52 flex-shrink-0 p-4 border-r border-slate-200 dark:border-slate-800 flex items-center bg-slate-50/30 dark:bg-slate-900/30">
                  <div className="flex items-center gap-3">
                    {getEmployee(assigneeId) ? (
                      <div className="relative">
                        <img src={getEmployee(assigneeId)?.avatarUrl} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm" alt="" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"></div>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-400 dark:text-slate-500">??</div>
                    )}
                    <div className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">
                        {getEmployee(assigneeId)?.name || 'Unassigned'}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                        {assigneeTasks.length} tasks
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline Data */}
                <div className="flex-1 relative">
                  {/* Grid markers background */}
                  <div className="absolute inset-0 flex pointer-events-none z-0">
                    {days.map((day, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${isToday(day) ? 'bg-primary-50/10 dark:bg-primary-500/5' : ''
                          }`}
                      />
                    ))}
                  </div>

                  {/* Task bars container */}
                  <div className="relative p-4 min-h-[80px] flex flex-col justify-center gap-2 z-10 w-full overflow-hidden">
                    {assigneeTasks.map((task, index) => {
                      const position = getTaskPosition(task);
                      if (!position) return null;

                      // Exact percentage calculations
                      const widthPercent = (position.span / days.length) * 100;
                      // Subtly inset the start so bars don't ride exactly on the grid line
                      const leftPercent = (position.start / days.length) * 100;

                      return (
                        <div key={task.id} className="w-full relative h-8 shrink-0">
                          <div
                            onClick={() => onViewTask(task)}
                            className={`absolute inset-y-0 rounded-lg ${statusColors[task.status]} cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all flex items-center px-3 border shadow-sm group/bar z-10 hover:z-20`}
                            style={{
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                              margin: '0 2px'
                            }}
                          >
                            <span className="text-[10px] font-bold truncate">
                              {task.title}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {tasks.length === 0 && (
            <div className="p-32 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChevronRightIcon className="w-10 h-10 text-slate-300 dark:text-white/5" />
              </div>
              <h4 className="text-lg font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.3em]">No Tasks</h4>
              <p className="text-[10px] font-bold text-slate-400 dark:text-white/10 uppercase tracking-widest mt-2">Zero active tasks detected in this timeline.</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex flex-wrap items-center gap-x-8 gap-y-4">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Legend</span>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"></div>
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">To Do</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-primary-500/20 border border-primary-200 dark:border-primary-500/30"></div>
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30"></div>
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">Done</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
