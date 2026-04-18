
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Task, Employee, TaskStatus, Priority } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { ClockIcon } from './icons/ClockIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { isTaskOverdue } from '../utils/taskUtils';
import { TASK_STATUS_CONFIG } from '../constants/taskStatusConfig';

import TagPill from './TagPill';

interface TaskCardProps {
  task: Task;
  allTasks: Task[];
  assignees?: Employee[];
  onEditTask: (task: Task) => void;
  onDeleteTask?: (taskId: number) => void;
  onUpdateTaskStatus: (taskId: number, newStatus: TaskStatus) => void;
  onViewTask: (task: Task) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

const priorityConfig = {
  [Priority.URGENT]: { glow: 'bg-red-500 shadow-red-500/50', border: 'border-red-500/20' },
  [Priority.HIGH]: { glow: 'bg-orange-500 shadow-orange-500/50', border: 'border-orange-500/20' },
  [Priority.MEDIUM]: { glow: 'bg-yellow-500 shadow-yellow-500/50', border: 'border-yellow-500/20' },
  [Priority.LOW]: { glow: 'bg-slate-400 shadow-slate-400/50', border: 'border-slate-500/20' },
};


const TaskCard: React.FC<TaskCardProps> = ({ task, allTasks, assignees = [], onEditTask, onDeleteTask, onUpdateTaskStatus, onViewTask, currentUserId, isAdmin }) => {
  // Use the new centralized helper for overdue check
  const isOverdue = isTaskOverdue(task);
  const [isDragging, setIsDragging] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Permission Logic
  const canEdit = isAdmin || (currentUserId && (task.assigneeIds?.includes(currentUserId) || task.assigneeId === currentUserId));
  const canDelete = isAdmin || (currentUserId && (task.assigneeIds?.includes(currentUserId) || task.assigneeId === currentUserId));

  const isBlocked = !!task.blockedById;
  const completedSubtasks = (task.subtasks || []).filter(st => st.isCompleted).length;
  const totalSubtasks = (task.subtasks || []).length;
  const progressPercentage = totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (isBlocked || !canEdit) {
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
      draggable={(!isBlocked && canEdit) ? true : undefined}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
            bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-[24px] p-5 border border-black/5 dark:border-white/5 shadow-lg shadow-black/5 dark:shadow-none
            group relative transition-all duration-300 hover:z-10
            ${isOverdue ? 'border-red-500/50 bg-red-50 dark:bg-red-500/10 shadow-red-500/20' : priorityConfig[task.priority].border}
            ${isDragging ? 'opacity-30 scale-95 grayscale' : 'hover:-translate-y-1 hover:bg-white/60 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/20'}
            ${(isBlocked || !canEdit) ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
            ${!canEdit ? 'opacity-80' : ''}
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
          {canEdit && task.status !== TaskStatus.DONE && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowCompleteConfirm(true); }}
              className={`p-2 text-slate-400 dark:text-white/40 hover:${TASK_STATUS_CONFIG[TaskStatus.DONE].text} hover:${TASK_STATUS_CONFIG[TaskStatus.DONE].faint} rounded-lg transition-all`}
              title="Mark as Complete"
            >
              <CheckCircleIcon className="w-3.5 h-3.5" />
            </button>
          )}
          {canEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEditTask(task); }} className="p-2 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all" title="Edit Task">
              <PencilIcon className="w-3.5 h-3.5" />
            </button>
          )}
          {onDeleteTask && canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
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
          {assignees.length > 0 ? (
            <div className="flex -space-x-2 overflow-hidden items-center">
              {assignees.map((emp, idx) => (
                <div key={emp.id} className="relative inline-block" style={{ zIndex: assignees.length - idx }}>
                  <img src={emp.avatarUrl} alt={emp.name} className="w-7 h-7 rounded-lg object-cover border-2 border-white dark:border-[#1E1E1E]" title={emp.name} />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-[#1E1E1E]"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg border border-dashed border-white/20 bg-white/5"></div>
          )}
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black font-mono tracking-tight uppercase ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-400 dark:text-white/30'}`}>
              {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              {task.endDate && ` - ${new Date(task.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
            </span>
            {isOverdue && (
              <span className="text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                Overdue
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`w-1.5 h-1.5 rounded-full ${priorityConfig[task.priority].glow} shadow-[0_0_8px]`}></div>

          {(totalSubtasks > 0 || (task.recurrence && task.recurrence !== 'none')) && (
            <div className="h-4 w-px bg-white/5"></div>
          )}

          {task.recurrence && task.recurrence !== 'none' && (
            <div className="flex items-center gap-1 bg-primary-500/10 text-primary-500 px-1.5 py-0.5 rounded" title={`Repeats ${task.recurrence}`}>
              <ArrowPathIcon className="w-3 h-3 stroke-[2px]" />
              <span className="text-[9px] font-bold uppercase tracking-wider">{task.recurrence}</span>
            </div>
          )}

          {totalSubtasks > 0 && (
            <div className="flex items-center text-slate-400 dark:text-white/20 group-hover:text-slate-900 dark:group-hover:text-white/40 gap-1.5 transition-colors">
              <ListBulletIcon className="w-3.5 h-3.5 stroke-[2.5px]" />
              <span className="text-[10px] font-black font-mono">{progressPercentage}%</span>
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

      {/* Confirmation Modal */}
      {showCompleteConfirm && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setShowCompleteConfirm(false); }} />
          <div className="relative bg-white dark:bg-black/80 dark:backdrop-blur-xl rounded-[32px] p-8 max-w-sm w-full border border-slate-200 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${TASK_STATUS_CONFIG[TaskStatus.DONE].faint} mb-6`}>
              <CheckCircleIcon className={`h-8 w-8 ${TASK_STATUS_CONFIG[TaskStatus.DONE].text}`} />
            </div>
            <h3 className="text-xl font-black text-center text-slate-900 dark:text-white mb-2 tracking-tight">Complete Task?</h3>
            <p className="text-center text-sm text-slate-500 dark:text-white/60 mb-8 font-medium">
              Are you sure you want to mark "{task.title}" as complete?
              {task.recurrence && task.recurrence !== 'none' && (
                <span className={`block mt-2 ${TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].text}`}>
                  This will automatically generate the next recurring task.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); setShowCompleteConfirm(false); }}
                className="flex-1 py-3.5 px-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white/70 rounded-[20px] font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateTaskStatus(task.id, TaskStatus.DONE);
                  setShowCompleteConfirm(false);
                }}
                className={`flex-1 py-3.5 px-4 ${TASK_STATUS_CONFIG[TaskStatus.DONE].bg} hover:brightness-110 text-white rounded-[20px] font-bold shadow-lg ${TASK_STATUS_CONFIG[TaskStatus.DONE].glow} transition-all active:scale-95`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }} />
          <div className="relative bg-white dark:bg-[#1A1A1A] rounded-[32px] p-8 max-w-sm w-full border border-slate-200 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-500/20 mb-6">
              <TrashIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-black text-center text-slate-900 dark:text-white mb-2 tracking-tight">Delete Task?</h3>
            <p className="text-center text-sm text-slate-500 dark:text-white/60 mb-8 font-medium">
              Are you sure you want to delete "{task.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                className="flex-1 py-3.5 px-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white/70 rounded-[20px] font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDeleteTask) onDeleteTask(task.id);
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 py-3.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-[20px] font-bold shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TaskCard;
