
import React from 'react';
import { Task, Employee, TaskStatus } from '../types';
import { usePreferences } from './hooks/usePreferences';
import { TASK_STATUSES } from '../constants';
import TaskColumn from './TaskColumn';

interface TaskBoardProps {
  tasks: Task[];
  allTasks: Task[]; // For dependency checking
  employees: Employee[];
  onEditTask: (task: Task) => void;
  onDeleteTask?: (taskId: number) => void;
  onUpdateTaskStatus: (taskId: number, newStatus: TaskStatus) => void;
  onViewTask: (task: Task) => void;
  onToggleTimer: (taskId: number) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, allTasks, employees, onEditTask, onDeleteTask, onUpdateTaskStatus, onViewTask, onToggleTimer, currentUserId, isAdmin }) => {
  const [preferences] = usePreferences();

  const filteredTasks = tasks.filter(task => {
    if (task.status !== 'Done') return true;
    if (preferences.showCompletedTasks === 'always') return true;
    if (preferences.showCompletedTasks === 'never') return false;
    // recent (24h)
    const completedAt = task.updated_at ? new Date(task.updated_at) : new Date(); // fallback if no updated_at
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return completedAt > cutoff;
  });

  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white/10 dark:bg-black/20 backdrop-blur-[40px] border border-white/20 dark:border-white/5 rounded-[40px] shadow-2xl shadow-black/5 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-slate-400 dark:text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h4 className="text-lg font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.3em]">No Tasks Found</h4>
        <p className="text-[10px] font-bold text-slate-400 dark:text-white/10 uppercase tracking-widest mt-2 px-8 text-center">Either your board is clear or nothing matches your current search filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {TASK_STATUSES.map(status => (
        <div key={status} className="h-full">
          <TaskColumn
            status={status}
            tasks={filteredTasks.filter(task => task.status === status)}
            allTasks={allTasks}
            employees={employees}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onUpdateTaskStatus={onUpdateTaskStatus}
            onViewTask={onViewTask}
            onToggleTimer={onToggleTimer}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />
        </div>
      ))}
    </div>
  );
};

export default TaskBoard;
