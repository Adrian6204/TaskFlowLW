import React, { useState } from 'react';
import { Task, Priority, TaskStatus } from '../types';
import { usePreferences } from './hooks/usePreferences';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface CalendarViewProps {
  tasks: Task[];
  onViewTask: (task: Task) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onViewTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [preferences] = usePreferences();

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);

  // Adjust start date based on weekStartDay preference
  const dayOffset = preferences.weekStartDay === 'monday' ? 1 : 0;
  const currentDay = startDate.getDay();
  const diff = currentDay >= dayOffset ? currentDay - dayOffset : 6;
  startDate.setDate(startDate.getDate() - diff);

  const endDate = new Date(endOfMonth);
  const endDay = endDate.getDay();
  const endDiff = preferences.weekStartDay === 'monday'
    ? (7 - endDay) % 7
    : 6 - endDay;
  endDate.setDate(endDate.getDate() + endDiff);

  const days = [];
  let day = new Date(startDate);

  while (day <= endDate) {
    days.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  const tasksByDate: { [key: string]: Task[] } = {};
  tasks.forEach(task => {
    if (task.status === TaskStatus.DONE && preferences.showCompletedTasks === 'never') return;

    // Use dueDate as the key
    const dateKey = task.dueDate;
    if (!tasksByDate[dateKey]) {
      tasksByDate[dateKey] = [];
    }
    tasksByDate[dateKey].push(task);
  });

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT: return 'bg-red-500';
      case Priority.HIGH: return 'bg-orange-500';
      case Priority.MEDIUM: return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="h-full flex flex-col pt-2">
      {/* Glass Container */}
      <div className="flex-1 flex flex-col bg-white/40 dark:bg-[#1E1E20]/60 backdrop-blur-2xl border border-white/60 dark:border-white/5 rounded-[32px] overflow-hidden shadow-2xl shadow-black/5 ring-1 ring-black/5 dark:ring-white/5">

        {/* Header */}
        <div className="px-8 py-6 flex justify-between items-center border-b border-white/20 dark:border-white/5 bg-white/30 dark:bg-white/5">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">
                {currentDate.toLocaleString('default', { month: 'long' })}
              </h2>
              <p className="text-sm font-bold text-slate-400 dark:text-white/40 mt-1 uppercase tracking-widest">
                {currentDate.getFullYear()}
              </p>
            </div>

            <div className="h-10 w-px bg-slate-200 dark:bg-white/10 mx-2"></div>

            <button
              onClick={goToToday}
              className="px-4 py-2 rounded-xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/5 text-xs font-bold text-slate-600 dark:text-white/70 hover:bg-white/80 dark:hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-black/20 p-1.5 rounded-2xl border border-white/40 dark:border-white/5">
            <button onClick={() => changeMonth(-1)} className="p-3 rounded-xl hover:bg-white dark:hover:bg-white/10 transition-all text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:shadow-sm">
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button onClick={() => changeMonth(1)} className="p-3 rounded-xl hover:bg-white dark:hover:bg-white/10 transition-all text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:shadow-sm">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-white/20 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
          {(preferences.weekStartDay === 'monday'
            ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          ).map(dayName => (
            <div key={dayName} className="py-4 text-center">
              <span className="text-[11px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">
                {dayName}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-slate-200/50 dark:bg-black/20 gap-px border-b border-slate-200/50 dark:border-white/5">
          {days.map((d, index) => {
            const dateKey = d.toISOString().split('T')[0];
            const tasksForDay = tasksByDate[dateKey] || [];
            const isCurrentMonth = d.getMonth() === currentDate.getMonth();
            const isTodayDate = isToday(d);

            return (
              <div
                key={d.toISOString()}
                className={`
                   relative flex flex-col p-2 transition-colors duration-200 group
                   ${isCurrentMonth ? 'bg-white/60 dark:bg-[#1E1E20]/90 hover:bg-white/80 dark:hover:bg-white/5' : 'bg-slate-50/40 dark:bg-black/40'}
                   ${!isCurrentMonth ? 'text-slate-300 dark:text-white/10' : 'text-slate-700 dark:text-white/80'}
                `}
                onClick={() => {
                  // Optional: Open day view or create task for this day
                }}
              >
                {/* Date Number */}
                <div className="flex justify-between items-start mb-1">
                  <span className={`
                        text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all
                        ${isTodayDate
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-500/20'
                      : 'bg-transparent'}
                    `}>
                    {d.getDate()}
                  </span>
                </div>

                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto scrollbar-none space-y-1 relative pr-1">
                  {tasksForDay.slice(0, 4).map(task => (
                    <button
                      key={task.id}
                      onClick={(e) => { e.stopPropagation(); onViewTask(task); }}
                      className={`
                             w-full text-left px-2 py-1.5 rounded-lg text-[10px] font-bold truncate transition-all
                             border border-transparent hover:scale-[1.02] active:scale-95
                             flex items-center gap-2 group/task
                             ${task.status === TaskStatus.DONE
                          ? 'bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-white/20 line-through'
                          : 'bg-white dark:bg-white/10 text-slate-600 dark:text-white/70 shadow-sm hover:shadow-md dark:hover:bg-white/20 dark:hover:text-white'}
                          `}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`}></div>
                      <span className="truncate flex-1">{task.title}</span>
                      {task.dueDate && preferences.timeFormat && (
                        <span className="opacity-0 group-hover/task:opacity-50 text-[9px]">
                          {preferences.timeFormat === '24h' ? '23:59' : '11pm'}
                        </span>
                      )}
                    </button>
                  ))}
                  {tasksForDay.length > 4 && (
                    <div className="text-[9px] font-bold text-slate-400 dark:text-white/30 text-center pt-1 hover:text-indigo-500 cursor-pointer">
                      + {tasksForDay.length - 4} more
                    </div>
                  )}
                </div>

                {/* Add Task Hover Trigger (Visual Cue) */}
                <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/0 to-transparent pointer-events-none group-hover:from-indigo-500/5 transition-all"></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;