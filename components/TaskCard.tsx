
import React, { useState } from 'react';
import { Task, Employee, TaskStatus, Priority } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { ClockIcon } from './icons/ClockIcon';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import TagPill from './TagPill';

interface TaskCardProps {
  task: Task;
  allTasks: Task[];
  employee?: Employee;
  onEditTask: (task: Task) => void;
  onDeleteTask?: (taskId: number) => void;
  onUpdateTaskStatus: (taskId: number, newStatus: TaskStatus) => void;
  onViewTask: (task: Task) => void;
  onToggleTimer: (taskId: number) => void;
}

const priorityConfig = {
  [Priority.URGENT]: { glow: 'bg-red-500 shadow-red-500/50', border: 'border-red-500/20' },
  [Priority.HIGH]: { glow: 'bg-orange-500 shadow-orange-500/50', border: 'border-orange-500/20' },
  [Priority.MEDIUM]: { glow: 'bg-blue-500 shadow-blue-500/50', border: 'border-blue-500/20' },
  [Priority.LOW]: { glow: 'bg-slate-200 dark:bg-white/20 shadow-white/10', border: 'border-black/5 dark:border-white/5' },
};

const TaskCard: React.FC<TaskCardProps> = ({ task, allTasks, employee, onEditTask, onDeleteTask, onUpdateTaskStatus, onViewTask, onToggleTimer }) => {
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE;
  const [isDragging, setIsDragging] = useState(false);
  const isBlocked = !!task.blockedById;
  const completedSubtasks = (task.subtasks || []).filter(st => st.isCompleted).length;
  const totalSubtasks = (task.subtasks || []).length;
  const isTracking = !!task.timerStartTime;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (isBlocked) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('application/json', JSON.stringify(task));
    setTimeout(() => setIsDragging(true), 0);
  };

  const handleDragEnd = () => setIsDragging(false);

  return (
    <div
      onClick={() => onViewTask(task)}
      draggable={!isBlocked}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
            bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-[24px] p-5 border border-black/5 dark:border-white/5 shadow-lg shadow-black/5 dark:shadow-none
            group relative transition-all duration-300
            ${priorityConfig[task.priority].border}
            ${isDragging ? 'opacity-30 scale-95 grayscale' : 'hover:-translate-y-1 hover:bg-white/60 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/20'}
            ${isBlocked ? 'cursor-not-allowed opacity-50 grayscale' : 'cursor-grab active:cursor-grabbing'}
        `}
    >
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-sm text-slate-800 dark:text-white/90 leading-relaxed line-clamp-2 tracking-tight group-hover:text-slate-950 dark:group-hover:text-white transition-colors">{task.title}</h3>
          {task.description && (
            <p className="text-xs text-slate-500 dark:text-white/50 mt-1 line-clamp-2 font-medium">{task.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 p-1.5 bg-black/5 dark:bg-black/40 rounded-xl border border-black/5 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleTimer(task.id); }}
            className={`p-2 rounded-lg transition-all ${isTracking ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
          >
            {isTracking ? <StopIcon className="w-3.5 h-3.5" /> : <PlayIcon className="w-3.5 h-3.5" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEditTask(task); }} className="p-2 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all">
            <PencilIcon className="w-3.5 h-3.5" />
          </button>
          {onDeleteTask && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
              className="p-2 text-slate-400 dark:text-white/40 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {task.tags.map(tag => (
            <TagPill key={tag} text={tag} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
        <div className="flex items-center gap-3">
          {employee ? (
            <div className="relative">
              <img src={employee.avatarUrl} alt={employee.name} className="w-7 h-7 rounded-lg object-cover border border-white/10" title={employee.name} />
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#1E1E1E]"></div>
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg border border-dashed border-white/20 bg-white/5"></div>
          )}
          <span className={`text-[10px] font-black font-mono tracking-tight uppercase ${isOverdue ? 'text-red-500' : 'text-slate-400 dark:text-white/30'}`}>
            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className={`w-1.5 h-1.5 rounded-full ${priorityConfig[task.priority].glow} shadow-[0_0_8px]`}></div>

          {(totalSubtasks > 0 || task.comments.length > 0) && (
            <div className="h-4 w-px bg-white/5"></div>
          )}

          {totalSubtasks > 0 && (
            <div className="flex items-center text-slate-400 dark:text-white/20 group-hover:text-slate-900 dark:group-hover:text-white/40 gap-1.5 transition-colors">
              <ListBulletIcon className="w-3.5 h-3.5 stroke-[2.5px]" />
              <span className="text-[10px] font-black font-mono">{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}
          {task.comments.length > 0 && (
            <div className="flex items-center text-slate-400 dark:text-white/20 group-hover:text-slate-900 dark:group-hover:text-white/40 gap-1.5 transition-colors">
              <ChatBubbleIcon className="w-3.5 h-3.5 stroke-[2.5px]" />
              <span className="text-[10px] font-black font-mono">{task.comments.length}</span>
            </div>
          )}
        </div>
      </div>

      {isBlocked && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-[24px] flex items-center justify-center pointer-events-none border border-white/5 shadow-inner">
          <div className="flex flex-col items-center gap-2">
            <LockClosedIcon className="w-8 h-8 text-white/40" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Context Locked</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
