import React, { useState } from 'react';
import { Task } from '../types';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface CalendarViewProps {
  tasks: Task[];
  onViewTask: (task: Task) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onViewTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(endOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const days = [];
  let day = new Date(startDate);

  while (day <= endDate) {
    days.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  const tasksByDate: { [key: string]: Task[] } = {};
  tasks.forEach(task => {
    const dateKey = task.dueDate;
    if (!tasksByDate[dateKey]) {
      tasksByDate[dateKey] = [];
    }
    tasksByDate[dateKey].push(task);
  });

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="h-full flex flex-col bg-white/60 dark:bg-black/20 backdrop-blur-[40px] border border-white/40 dark:border-white/5 rounded-[32px] overflow-hidden animate-in fade-in duration-1000 shadow-xl shadow-black/5 dark:shadow-none">
      {/* Header */}
      <div className="p-10 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Task Calendar</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.2em]">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })} Schedule
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/40 dark:bg-black/20 p-2 rounded-2xl border border-white/40 dark:border-white/5">
            <button onClick={() => changeMonth(-1)} className="p-3 rounded-xl hover:bg-white/60 dark:hover:bg-white/5 transition-all text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white">
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-black/5 dark:bg-white/5"></div>
            <button onClick={() => changeMonth(1)} className="p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-black/5 dark:bg-white/5">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(dayName => (
          <div key={dayName} className="text-center font-black text-[10px] text-slate-600 dark:text-white/20 uppercase tracking-[0.3em] py-6 bg-white/10 dark:bg-black/20">
            {dayName}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-black/5 dark:bg-white/5 mt-px">
        {days.map(d => {
          const dateKey = d.toISOString().split('T')[0];
          const tasksForDay = tasksByDate[dateKey] || [];
          const isCurrentMonth = d.getMonth() === currentDate.getMonth();

          return (
            <div key={d.toString()} className={`p-4 h-40 overflow-y-auto scrollbar-none transition-all duration-300 group ${isCurrentMonth ? 'bg-white/10 dark:bg-white/5 backdrop-blur-xl hover:bg-white/30 dark:hover:bg-white/10' : 'bg-black/5 dark:bg-black/40 opacity-30 shadow-inner'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`text-xs font-black font-mono tracking-tighter ${isToday(d) ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : isCurrentMonth ? 'text-slate-400 dark:text-white/40' : 'text-slate-300 dark:text-white/10'}`}>
                  {d.getDate().toString().padStart(2, '0')}
                </span>
                {tasksForDay.length > 0 && isCurrentMonth && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                )}
              </div>
              <div className="space-y-2">
                {tasksForDay.map(task => (
                  <div
                    key={task.id}
                    onClick={() => onViewTask(task)}
                    className="text-[10px] font-bold p-2.5 bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/5 text-slate-600 dark:text-white/60 rounded-xl truncate cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white hover:border-white/60 dark:hover:border-white/10 transition-all duration-300 group/task shadow-sm dark:shadow-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-slate-400 dark:bg-white/20 group-hover/task:bg-blue-500"></div>
                      <span className="truncate">{task.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;