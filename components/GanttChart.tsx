
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
    [TaskStatus.DONE]: 'bg-lime-500 shadow-lime-500/30 text-black',
    [TaskStatus.IN_PROGRESS]: 'bg-blue-500 shadow-blue-500/30 text-white',
    [TaskStatus.TODO]: 'bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/5 text-slate-600 dark:text-white/60 shadow-sm dark:shadow-white/5',
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
    <div className="bg-white/60 dark:bg-[#1E1E1E]/40 backdrop-blur-[40px] rounded-[40px] border border-slate-200 dark:border-white/10 overflow-hidden animate-in fade-in duration-1000 shadow-xl shadow-black/5 dark:shadow-black/40">
      {/* Header */}
      <div className="p-10 border-b border-slate-200 dark:border-white/10 bg-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Timeline Analytics</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.2em]">
                {days[0]?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Timeline
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/40 dark:bg-black/20 p-2 rounded-2xl border border-white/40 dark:border-white/5">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-3 hover:bg-white/5 rounded-xl transition-all duration-300 text-white/40 hover:text-white"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-lime-600 dark:text-[#CEFD4A] bg-lime-500/10 hover:bg-lime-500/20 rounded-xl transition-all duration-300 border border-lime-500/20"
            >
              Sync Today
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className="p-3 hover:bg-white/5 rounded-xl transition-all duration-300 text-white/40 hover:text-white"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Gantt Grid */}
      <div className="overflow-x-auto scrollbar-none">
        <div className="min-w-[1200px]">
          {/* Days Header */}
          <div className="flex border-b border-slate-200 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="w-64 flex-shrink-0 p-6 border-r border-slate-200 dark:border-white/10">
              <span className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">Assignee</span>
            </div>
            <div className="flex-1 flex">
              {days.map((day, idx) => (
                <div
                  key={idx}
                  className={`flex-1 p-6 text-center border-r border-slate-200 dark:border-white/10 last:border-r-0 ${isToday(day) ? 'bg-white/20 dark:bg-white/10' : ''
                    }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isToday(day) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-white/30'}`}>
                    {formatDate(day)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks Rows */}
          <div className="divide-y divide-slate-200 dark:divide-white/10">
            {Object.entries(tasksByAssignee).map(([assigneeId, assigneeTasks]) => (
              <div key={assigneeId} className="flex group hover:bg-white/[0.01] transition-all duration-300">
                {/* Assignee Identity */}
                <div className="w-64 flex-shrink-0 p-6 border-r border-slate-200 dark:border-white/10 flex items-center bg-white/[0.01]">
                  <div className="flex items-center gap-4">
                    {getEmployee(assigneeId) ? (
                      <div className="relative">
                        <img src={getEmployee(assigneeId)?.avatarUrl} className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-lg" alt="" />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1E1E1E]"></div>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-black text-white/20">??</div>
                    )}
                    <div className="min-w-0">
                      <span className="block text-sm font-bold text-slate-700 dark:text-white/80 truncate">
                        {getEmployee(assigneeId)?.name || 'Unassigned Context'}
                      </span>
                      <span className="text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest block mt-1">
                        {assigneeTasks.length} Operations
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline Data */}
                <div className="flex-1 relative min-h-[100px]">
                  {/* Grid markers */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {days.map((day, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 border-r border-slate-200 dark:border-white/10 last:border-r-0 ${isToday(day) ? 'bg-white/[0.02]' : ''
                          }`}
                      />
                    ))}
                  </div>

                  {/* Task bars */}
                  <div className="relative p-6 space-y-3">
                    {assigneeTasks.map((task) => {
                      const position = getTaskPosition(task);
                      if (!position) return null;

                      const widthPercent = (position.span / days.length) * 100;
                      const leftPercent = (position.start / days.length) * 100;

                      return (
                        <div
                          key={task.id}
                          onClick={() => onViewTask(task)}
                          className={`h-10 rounded-2xl ${statusColors[task.status]} cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center px-4 shadow-xl border border-white/10 group/bar`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            minWidth: '100px',
                            position: 'relative' // Using relative within the grid for stacking
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent pointer-events-none rounded-2xl"></div>
                          <span className={`text-[10px] font-black uppercase tracking-widest truncate relative z-10 ${task.status === TaskStatus.DONE ? 'text-black' : 'text-white'}`}>
                            {task.title}
                          </span>
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
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChevronRightIcon className="w-10 h-10 text-white/5" />
              </div>
              <h4 className="text-lg font-black text-white/20 uppercase tracking-[0.3em]">No Tasks</h4>
              <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest mt-2">Zero active tasks detected in this timeline.</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="p-8 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] flex items-center gap-10">
        <span className="text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.3em]">Status Legend</span>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-white/20 shadow-[0_0_8px_rgba(255,255,255,0.2)]"></div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">In Queue</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"></div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Active</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-lime-500 shadow-[0_0_8px_rgba(206,253,74,0.3)]"></div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Processed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
