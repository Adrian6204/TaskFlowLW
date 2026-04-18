import React, { useState, useEffect } from 'react';
import { Task, Employee, Priority, TaskStatus } from '../types';
import { useAuth } from '../auth/AuthContext';
import { XMarkIcon } from './icons/XMarkIcon';
import { FlagIcon } from './icons/FlagIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import TagPill from './TagPill';
import * as dataService from '../services/supabaseService';
import { isTaskOverdue } from '../utils/taskUtils';
import { TASK_STATUS_CONFIG } from '../constants/taskStatusConfig';


interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  employees: Employee[];
  allTasks: Task[];
  onDeleteTask?: (taskId: number) => void;
  onUpdateTaskStatus?: (taskId: number, newStatus: TaskStatus) => void;
  onEditTask?: (task: Task) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

const priorityConfig = {
  [Priority.URGENT]: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/50' },
  [Priority.HIGH]: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/50' },
  [Priority.MEDIUM]: { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/50' },
  [Priority.LOW]: { text: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700' },
};

const formatDuration = (ms: number) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)));

  return `${hours}h ${minutes}m ${seconds}s`;
};


const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ isOpen, onClose, task, employees, allTasks, onDeleteTask, onUpdateTaskStatus, onEditTask, currentUserId, isAdmin }) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [dummyState, setDummyState] = useState(false); // Used to force re-render for optimistic updates
  const { user } = useAuth();
  const assignees = employees.filter(e => task.assigneeIds?.includes(e.id) || task.assigneeId === e.id);
  const currentUser = employees.find(e => e.id === user?.employeeId);
  const blockingTask = task.blockedById ? allTasks.find(t => t.id === task.blockedById) : null;
  const canDelete = isAdmin || (currentUserId && (task.assigneeIds?.includes(currentUserId) || task.assigneeId === currentUserId));
  const canEdit = isAdmin || (currentUserId && (task.assigneeIds?.includes(currentUserId) || task.assigneeId === currentUserId));
  const isOverdue = isTaskOverdue(task);

  const [show, setShow] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAssigneesList, setShowAssigneesList] = useState(false);

  // Timer State
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 10);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      setShow(false);
    }
  }, [isOpen, onClose, task]);



  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (task.timerStartTime) {
      const start = new Date(task.timerStartTime).getTime();
      const update = () => {
        setElapsedTime(Date.now() - start);
      };
      update();
      interval = setInterval(update, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [task.timerStartTime]);


  const handleAddSubtask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim() || !user || !canEdit) return;
    const title = newSubtaskTitle.trim();
    setNewSubtaskTitle('');

    const newSubtask = { id: Date.now().toString(), title, isCompleted: false };
    const currentSubtasks = task.subtasks || [];
    const updatedSubtasks = [...currentSubtasks, newSubtask];

    task.subtasks = updatedSubtasks; // Optimistic update
    setDummyState(prev => !prev);    // Force re-render

    try {
      await dataService.upsertTask({
        ...task,
        subtasks: updatedSubtasks
      });
    } catch (error) {
      console.error("Failed to add subtask", error);
      task.subtasks = currentSubtasks; // Revert locally
      setDummyState(prev => !prev);
    }
  };


  const completedSubtasks = (task.subtasks || []).filter(st => st.isCompleted).length;
  const totalSubtasks = (task.subtasks || []).length;
  const progressPercentage = totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);

  const totalLoggedTime = (task.timeLogs || []).reduce((acc, log) => acc + log.duration, 0);
  const totalTimeDisplay = formatDuration(totalLoggedTime + (task.timerStartTime ? elapsedTime : 0));

  if (!isOpen && !show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex justify-center items-end sm:items-center p-0 sm:p-6 transition-all duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm transition-all duration-500"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className={`w-full sm:max-w-5xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col relative z-10 transform transition-all duration-500 ${show ? 'translate-y-0 scale-100' : 'translate-y-full sm:translate-y-8 sm:scale-95'}`}>
        {/* Glow effect behind modal (Desktop only) */}
        <div className="absolute -inset-4 bg-gradient-to-br from-primary-500/20 via-primary-500/20 to-lime-500/20 rounded-[48px] blur-2xl -z-10 opacity-50 dark:opacity-30 hidden sm:block"></div>

        <div className="bg-white dark:bg-black/60 sm:bg-white/70 sm:dark:bg-black/40 sm:backdrop-blur-3xl rounded-t-[32px] sm:rounded-[40px] border-t sm:border border-white/50 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col h-full">
          {/* Header */}
          <header className="p-6 sm:p-8 flex-shrink-0 relative overflow-hidden pt-safe-top">
            {/* Header background gradient */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary-500/10 dark:from-primary-500/5 to-transparent pointer-events-none"></div>

            {/* Top row: status badge + actions */}
            <div className="relative z-10 flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${TASK_STATUS_CONFIG[task.status as TaskStatus].bg} ${TASK_STATUS_CONFIG[task.status as TaskStatus].glow}`}></div>
                <p className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.3em]">{task.status === TaskStatus.DONE ? 'Completed' : 'Task Details'}</p>
                {isOverdue && (
                  <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-widest border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                    Overdue
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onEditTask && canEdit && (
                  <button
                    onClick={() => { onEditTask(task); onClose(); }}
                    className="px-4 py-2.5 flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 dark:text-indigo-400 hover:text-white rounded-2xl transition-all duration-300 border border-indigo-500/20 hover:border-indigo-500 shadow-sm group"
                    title="Edit Task"
                  >
                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    <span className="text-sm font-bold tracking-wide">Edit</span>
                  </button>
                )}
                {onUpdateTaskStatus && task.status !== TaskStatus.DONE && canEdit && (
                  <button
                    onClick={() => setShowCompleteConfirm(true)}
                    className={`px-4 py-2.5 flex items-center gap-2 ${TASK_STATUS_CONFIG[TaskStatus.DONE].faint} hover:${TASK_STATUS_CONFIG[TaskStatus.DONE].bg} ${TASK_STATUS_CONFIG[TaskStatus.DONE].text} hover:text-white rounded-2xl transition-all duration-300 border border-emerald-500/20 hover:border-emerald-500 shadow-sm group hover:${TASK_STATUS_CONFIG[TaskStatus.DONE].glow}`}
                    title="Mark as Complete"
                  >
                    <CheckCircleIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold tracking-wide">Mark Complete</span>
                  </button>
                )}
                {onDeleteTask && canDelete && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2.5 bg-white/50 dark:bg-white/5 hover:bg-red-500 hover:text-white text-slate-400 dark:text-white/40 rounded-2xl transition-all duration-300 border border-white/50 dark:border-white/5 shadow-sm group"
                    title="Delete Task"
                  >
                    <TrashIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </button>
                )}
                <button onClick={onClose} className="p-2.5 bg-white/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white rounded-2xl transition-all duration-300 border border-white/50 dark:border-white/5 shadow-sm group">
                  <XMarkIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>
            </div>

            {/* Title — full width, no competition */}
            <h2
              className="relative z-10 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-tight"
              title={task.title}
            >
              {task.title}
            </h2>
          </header>

          {/* Body */}
          <main className="px-6 sm:px-8 pb-10 sm:pb-8 overflow-y-auto flex-grow scrollbar-none space-y-6 sm:space-y-8 pb-safe">

            {blockingTask && (
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-[24px] p-5 flex items-center gap-4 animate-pulse shadow-lg shadow-amber-500/5">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <LockClosedIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] items-center font-black text-amber-700/70 dark:text-amber-500/70 uppercase tracking-[0.2em] mb-0.5">Blocked By</p>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-100">{blockingTask.title}</p>
                </div>
              </div>
            )}

            {/* Grid Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {/* Assignees */}
              <div
                onClick={() => assignees.length > 0 && setShowAssigneesList(true)}
                className={`p-5 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/5 rounded-[24px] hover:border-primary-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-primary-500/5 shadow-sm ${assignees.length > 0 ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] block mb-3">
                  {assignees.length > 1 ? 'Assignees' : 'Assignee'}
                </span>
                {assignees.length === 0 ? (
                  <span className="text-sm font-black uppercase tracking-wide text-slate-400 dark:text-slate-500">Unassigned</span>
                ) : assignees.length === 1 ? (
                  <div className="flex flex-col gap-2">
                    <img src={assignees[0].avatarUrl} alt={assignees[0].name} className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-zinc-700 shadow-sm" />
                    <span className="text-sm font-black text-primary-600 dark:text-primary-400 truncate">{assignees[0].name.split(' ')[0]}</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex -space-x-2.5">
                      {assignees.slice(0, 4).map((emp, i) => (
                        <img key={emp.id} src={emp.avatarUrl} alt={emp.name} className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-zinc-700 shadow-sm" style={{ zIndex: 4 - i }} />
                      ))}
                      {assignees.length > 4 && (
                        <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/50 border-2 border-white dark:border-zinc-700 flex items-center justify-center" style={{ zIndex: 0 }}>
                          <span className="text-[10px] font-black text-primary-600 dark:text-primary-400">+{assignees.length - 4}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-black text-primary-600 dark:text-primary-400">{assignees.length} Members</span>
                  </div>
                )}
              </div>

              {/* Priority */}
              <div className="p-5 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/5 rounded-[24px] hover:border-orange-500/30 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-orange-500/5 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] block mb-3">Priority</span>
                <div className={`inline-flex items-center gap-2 ${priorityConfig[task.priority].text}`}>
                  <div className={`p-1.5 rounded-lg ${priorityConfig[task.priority].bg}`}>
                    <FlagIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-wide">{task.priority}</span>
                </div>
              </div>

              {/* Deadline */}
              <div className={`p-5 bg-white/50 dark:bg-white/5 border ${isOverdue ? 'border-red-500/30 shadow-red-500/5' : 'border-white/60 dark:border-white/5'} rounded-[24px] hover:border-rose-500/30 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-rose-500/5 shadow-sm`}>
                <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] block mb-3">Deadline</span>
                <div className="flex items-center gap-1.5">
                  <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isOverdue ? 'text-red-500' : 'text-slate-400 dark:text-white/30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className={`text-sm font-bold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white/90'}`}>
                    {task.dueDate ? (
                      <>
                        {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        {task.endDate && (
                          <span className="text-slate-500 dark:text-white/50 ml-1 font-medium">
                            – {new Date(task.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </>
                    ) : 'No deadline'}
                  </p>
                </div>
              </div>

              {/* Created */}
              <div className="p-5 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/5 rounded-[24px] hover:border-emerald-500/30 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-emerald-500/5 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] block mb-3">Created</span>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 dark:text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-sm font-bold text-slate-800 dark:text-white/90">
                    {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Recurrence */}
              {task.recurrence && task.recurrence !== 'none' && (
                <div className="p-5 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/5 rounded-[24px] hover:border-primary-500/30 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-primary-500/5 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] block mb-3">Recurrence</span>
                  <p className="text-sm font-bold text-primary-600 dark:text-primary-400 flex items-center gap-2">
                    <ArrowPathIcon className="w-4 h-4 stroke-[2px]" />
                    <span className="uppercase tracking-wide">{task.recurrence}</span>
                  </p>
                </div>
              )}

              {/* Time Tracked */}
              {(task.timeLogs?.length > 0 || task.timerStartTime) && (
                <div className="p-5 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/5 rounded-[24px] hover:border-violet-500/30 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-violet-500/5 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] block mb-3">Time Tracked</span>
                  <div className="flex items-center gap-1.5">
                    {task.timerStartTime && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse flex-shrink-0" />
                    )}
                    <span className={`text-sm font-black font-mono tracking-wide ${task.timerStartTime ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white/90'}`}>
                      {totalTimeDisplay}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map(tag => <TagPill key={tag} text={tag} />)}
                </div>
              </div>
            )}

            {/* Body Sections Grid */}
            <div className="flex flex-col gap-6">
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2 mb-3">Description</h3>
                  <div className="p-6 bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/5 rounded-[32px] shadow-sm">
                    <p className="text-sm font-medium text-slate-700 dark:text-white/80 leading-relaxed whitespace-pre-wrap">
                      {task.description || <span className="text-slate-400 italic font-normal">No description provided.</span>}
                    </p>
                  </div>
                </div>

                {/* Subtasks */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end ml-2">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.2em]">Subtasks</h3>
                    <span className="text-[10px] font-bold text-slate-500 font-mono bg-white/50 dark:bg-white/10 px-2 py-0.5 rounded-md border border-white/50 dark:border-white/5">{completedSubtasks}/{totalSubtasks}</span>
                  </div>

                  {totalSubtasks > 0 && (
                    <div className="w-full bg-white/50 dark:bg-black/20 rounded-full h-1.5 border border-white/40 dark:border-white/5 overflow-hidden">
                      <div className="bg-gradient-to-r from-primary-500 to-primary-500 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.3)]" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                  )}

                  <div className="bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/5 rounded-[28px] p-4 shadow-sm max-h-[160px] overflow-y-auto scrollbar-none flex flex-col gap-3">
                    {totalSubtasks > 0 ? (
                      <ul className="space-y-2">
                        {(task.subtasks || []).map((subtask, index) => (
                          <li key={subtask.id} className="flex items-center bg-white/60 dark:bg-[#1A1A1A] p-3 rounded-[16px] border border-white/60 dark:border-white/5 shadow-sm group">
                            <button
                              onClick={async () => {
                                if (!canEdit) return;
                                const currentSubtasks = task.subtasks || [];
                                const updatedSubtasks = [...currentSubtasks];
                                updatedSubtasks[index] = { ...updatedSubtasks[index], isCompleted: !updatedSubtasks[index].isCompleted };

                                task.subtasks = updatedSubtasks; // Optimistic update
                                setDummyState(prev => !prev);    // Force re-render

                                try {
                                  await dataService.upsertTask({
                                    ...task,
                                    subtasks: updatedSubtasks
                                  });
                                } catch (error) {
                                  console.error("Failed to update subtask", error);
                                  task.subtasks = currentSubtasks; // Revert
                                  setDummyState(prev => !prev);
                                }
                              }}
                              className={`h-4 w-4 rounded-[6px] flex items-center justify-center flex-shrink-0 transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 focus:outline-none
                                ${subtask.isCompleted
                                  ? `${TASK_STATUS_CONFIG[TaskStatus.DONE].bg} hover:brightness-110 border ${TASK_STATUS_CONFIG[TaskStatus.DONE].bg.replace('bg-', 'border-')}`
                                  : 'bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 border border-transparent'
                                }`}
                            >
                              {subtask.isCompleted && <CheckCircleIcon className="w-2.5 h-2.5 text-white" />}
                            </button>
                            <span className={`ml-3 text-xs font-bold line-clamp-1 ${subtask.isCompleted ? 'text-slate-400 dark:text-white/30 line-through' : 'text-slate-700 dark:text-white/80'}`}>
                              {subtask.title}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="py-2 flex justify-center opacity-50">
                        <p className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] italic">No subtasks found</p>
                      </div>
                    )}

                    {/* Add Subtask Input */}
                    <div className="flex items-center gap-2 mt-1 pt-3 border-t border-slate-200 dark:border-white/5 text-slate-500 focus-within:text-slate-900 dark:focus-within:text-white transition-colors">
                      <button
                        onClick={() => handleAddSubtask()}
                        disabled={!newSubtaskTitle.trim() || !canEdit}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        disabled={!canEdit}
                        placeholder={canEdit ? "Add a new subtask..." : "Only assignees can add subtasks"}
                        className="bg-transparent border-none focus:ring-0 text-sm font-medium w-full p-0 placeholder:text-slate-400 dark:placeholder:text-white/30 text-slate-800 dark:text-white disabled:opacity-50"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubtask();
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCompleteConfirm(false)} />
          <div className="relative bg-white dark:bg-[#1A1A1A] rounded-[32px] p-8 max-w-sm w-full border border-slate-200 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300">
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
                onClick={() => setShowCompleteConfirm(false)}
                className="flex-1 py-3.5 px-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white/70 rounded-[20px] font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onUpdateTaskStatus) {
                    onUpdateTaskStatus(task.id, TaskStatus.DONE);
                  }
                  setShowCompleteConfirm(false);
                  onClose();
                }}
                className={`flex-1 py-3.5 px-4 ${TASK_STATUS_CONFIG[TaskStatus.DONE].bg} hover:brightness-110 text-white rounded-[20px] font-bold shadow-lg ${TASK_STATUS_CONFIG[TaskStatus.DONE].glow} transition-all active:scale-95`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white dark:bg-[#1A1A1A] rounded-[32px] p-8 max-w-sm w-full border border-slate-200 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-500/20 mb-6">
              <TrashIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-black text-center text-slate-900 dark:text-white mb-2 tracking-tight">Delete Task?</h3>
            <p className="text-center text-sm text-slate-500 dark:text-white/60 mb-8 font-medium">
              Are you sure you want to delete "{task.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3.5 px-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white/70 rounded-[20px] font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeleteTask) {
                    onDeleteTask(task.id);
                  }
                  setShowDeleteConfirm(false);
                  onClose();
                }}
                className="flex-1 py-3.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-[20px] font-bold shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignees List Modal */}
      {showAssigneesList && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAssigneesList(false)} />
          <div className="relative bg-white dark:bg-[#1A1A1A] rounded-[32px] p-8 max-w-sm w-full border border-slate-200 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-black text-center text-slate-900 dark:text-white mb-6 tracking-tight">Assignees</h3>
            <div className="max-h-60 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10">
              {assignees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <img src={emp.avatarUrl} alt={emp.name} className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-zinc-800 shadow-sm" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white/90">{emp.name}</p>
                    {emp.position && <p className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest mt-0.5">{typeof emp.position === 'string' ? emp.position.split(',')[0] : emp.position}</p>}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowAssigneesList(false)}
              className="mt-6 w-full py-3.5 px-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white/70 rounded-[20px] font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div >
  );
};

export default TaskDetailsModal;
