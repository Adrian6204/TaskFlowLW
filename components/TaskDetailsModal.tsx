import React, { useState, useEffect } from 'react';
import { Task, Employee, Priority, TaskStatus } from '../types';
import { useAuth } from '../auth/AuthContext';
import { XMarkIcon } from './icons/XMarkIcon';
import { ClockIcon } from './icons/ClockIcon';
import { FlagIcon } from './icons/FlagIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import TagPill from './TagPill';
import * as dataService from '../services/supabaseService';
import { isTaskOverdue } from '../utils/taskUtils';


interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  employees: Employee[];
  allTasks: Task[];
  onAddComment: (taskId: number, content: string) => Promise<void>;
  onDeleteTask?: (taskId: number) => void;
  onUpdateTaskStatus?: (taskId: number, newStatus: TaskStatus) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

const priorityConfig = {
  [Priority.URGENT]: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/50' },
  [Priority.HIGH]: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/50' },
  [Priority.MEDIUM]: { text: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-100 dark:bg-primary-900/50' },
  [Priority.LOW]: { text: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700' },
};

const formatDuration = (ms: number) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)));

  return `${hours}h ${minutes}m ${seconds}s`;
};

const formatTime = (time24?: string) => {
  if (!time24) return '';
  const [h, m] = time24.split(':');
  const hours = parseInt(h, 10);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${m} ${suffix}`;
};

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ isOpen, onClose, task, employees, allTasks, onAddComment, onDeleteTask, onUpdateTaskStatus, currentUserId, isAdmin }) => {
  const [newComment, setNewComment] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [dummyState, setDummyState] = useState(false); // Used to force re-render for optimistic updates
  const { user } = useAuth();
  const assignees = employees.filter(e => task.assigneeIds?.includes(e.id) || task.assigneeId === e.id);
  const currentUser = employees.find(e => e.id === user?.employeeId);
  const blockingTask = task.blockedById ? allTasks.find(t => t.id === task.blockedById) : null;
  const canDelete = isAdmin || (currentUserId && (task.assigneeIds?.includes(currentUserId) || task.assigneeId === currentUserId));
  const isOverdue = isTaskOverdue(task);

  const [show, setShow] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const commentText = newComment.trim();
    setNewComment('');

    // Optimistic UI Update
    const optimisticComment = {
      id: Date.now(), // Temporary ID until the parent component pulls the real one from the DB
      authorId: user.employeeId,
      content: commentText,
      timestamp: new Date().toISOString(),
    };

    task.comments = [...(task.comments || []), optimisticComment];
    setDummyState(prev => !prev);

    try {
      await onAddComment(task.id, commentText);
    } catch (error) {
      console.error("Failed to add comment:", error);
      // Revert if failed
      task.comments = task.comments.filter(c => c.id !== optimisticComment.id);
      setDummyState(prev => !prev);
    }
  };

  const handleAddSubtask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim() || !user) return;
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

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const commentDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }

  const completedSubtasks = (task.subtasks || []).filter(st => st.isCompleted).length;
  const totalSubtasks = (task.subtasks || []).length;
  const progressPercentage = totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);

  const totalLoggedTime = (task.timeLogs || []).reduce((acc, log) => acc + log.duration, 0);
  const totalTimeDisplay = formatDuration(totalLoggedTime + (task.timerStartTime ? elapsedTime : 0));

  if (!isOpen && !show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex justify-center items-center p-4 sm:p-6 transition-all duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm transition-all duration-500"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className={`w-full max-w-3xl max-h-[90vh] flex flex-col relative z-10 transform transition-all duration-500 ${show ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}`}>
        {/* Glow effect behind modal */}
        <div className="absolute -inset-4 bg-gradient-to-br from-primary-500/20 via-primary-500/20 to-lime-500/20 rounded-[48px] blur-2xl -z-10 opacity-50 dark:opacity-30"></div>

        <div className="bg-white/70 dark:bg-[#0A0A0A]/80 backdrop-blur-3xl rounded-[32px] sm:rounded-[40px] border border-white/50 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <header className="p-6 sm:p-8 flex justify-between items-start flex-shrink-0 relative overflow-hidden">
            {/* Header background gradient */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary-500/10 dark:from-primary-500/5 to-transparent pointer-events-none"></div>

            <div className="flex-1 mr-4 relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-2.5 h-2.5 rounded-full ${task.status === TaskStatus.DONE ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-primary-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]'}`}></div>
                <p className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.3em]">{task.status === TaskStatus.DONE ? 'Completed' : 'Task Details'}</p>
                {isOverdue && (
                  <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-widest border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                    Overdue
                  </span>
                )}
              </div>
              <h2
                className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-tight"
                title={task.title}
              >
                {task.title}
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 relative z-10">
              {onUpdateTaskStatus && task.status !== TaskStatus.DONE && (
                <button
                  onClick={() => setShowCompleteConfirm(true)}
                  className="px-4 py-3 flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white rounded-2xl transition-all duration-300 border border-emerald-500/20 hover:border-emerald-500 shadow-sm group hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  title="Mark as Complete"
                >
                  <CheckCircleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold tracking-wide">Mark Complete</span>
                </button>
              )}
              {onDeleteTask && canDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-3 bg-white/50 dark:bg-white/5 hover:bg-red-500 hover:text-white text-slate-400 dark:text-white/40 rounded-2xl transition-all duration-300 border border-white/50 dark:border-white/5 shadow-sm group"
                  title="Delete Task"
                >
                  <TrashIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              )}
              <button onClick={onClose} className="p-3 bg-white/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-slate-900 rounded-2xl transition-all duration-300 border border-white/50 dark:border-white/5 shadow-sm group">
                <XMarkIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </header>

          {/* Body */}
          <main className="px-6 sm:px-8 pb-8 overflow-y-auto flex-grow scrollbar-none space-y-6 sm:space-y-8">

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
              <div className="p-5 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/5 rounded-[24px] hover:border-primary-500/30 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-primary-500/5 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] block mb-3">
                  {assignees.length > 1 ? 'Assignees' : 'Assignee'}
                </span>
                <div className="flex items-center gap-3">
                  {assignees.length > 0 ? (
                    <div className="flex -space-x-3 overflow-hidden items-center">
                      {assignees.map((emp, idx) => (
                        <div key={emp.id} className="relative inline-block" style={{ zIndex: assignees.length - idx }}>
                          <img src={emp.avatarUrl} alt={emp.name} className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-[#0A0A0A] shadow-sm" title={emp.name} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 border-2 border-white dark:border-[#0A0A0A] shadow-sm flex items-center justify-center relative z-10">
                      <span className="text-[10px] font-bold text-slate-400">-</span>
                    </div>
                  )}
                  <span className="text-sm font-bold text-slate-800 dark:text-white/90 truncate">
                    {assignees.length === 0 ? 'Unassigned' : assignees.length === 1 ? assignees[0].name : `${assignees.length} Assignees`}
                  </span>
                </div>
              </div>

              <div className="p-5 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/5 rounded-[24px] hover:border-orange-500/30 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-orange-500/5 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] block mb-3">Priority</span>
                <div className={`inline-flex items-center gap-2 ${priorityConfig[task.priority].text}`}>
                  <div className={`p-1.5 rounded-lg ${priorityConfig[task.priority].bg}`}>
                    <FlagIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-wide">
                    {task.priority}
                  </span>
                </div>
              </div>

              <div className={`p-5 bg-white/50 dark:bg-white/5 border ${isOverdue ? 'border-red-500/30 shadow-red-500/5' : 'border-white/60 dark:border-white/5'} rounded-[24px] hover:border-rose-500/30 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-rose-500/5 shadow-sm`}>
                <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] block mb-3">Deadline</span>
                <p className={`text-sm font-bold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white/90'}`}>
                  {task.dueDate ? (
                    <>
                      {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {task.dueTime && <span className="text-slate-500 dark:text-white/50 ml-1.5 font-medium">{formatTime(task.dueTime)}</span>}
                    </>
                  ) : 'No deadline'}
                </p>
              </div>

              <div className="p-5 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/5 rounded-[24px] hover:border-emerald-500/30 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-emerald-500/5 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] block mb-3">Created</span>
                <p className="text-sm font-bold text-slate-800 dark:text-white/90">
                  {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {task.recurrence && task.recurrence !== 'none' && (
                <div className="p-5 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/5 rounded-[24px] hover:border-primary-500/30 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-primary-500/5 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] block mb-3">Recurrence</span>
                  <p className="text-sm font-bold text-primary-600 dark:text-primary-400 flex items-center gap-2">
                    <ArrowPathIcon className="w-4 h-4 stroke-[2px]" />
                    <span className="uppercase tracking-wide">{task.recurrence}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Body Sections Grid */}
            <div className="flex flex-col gap-6">
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2 mb-3">Description</h3>
                  <div className="p-6 bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/5 rounded-[32px] shadow-sm min-h-[140px]">
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
                                  ? 'bg-primary-500 hover:bg-primary-600 border border-primary-500'
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
                        disabled={!newSubtaskTitle.trim()}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="Add a new subtask..."
                        className="bg-transparent border-none focus:ring-0 text-sm font-medium w-full p-0 placeholder:text-slate-400 dark:placeholder:text-white/30 text-slate-800 dark:text-white"
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

            {/* Comments Section */}
            <div className="pt-4 mt-8 border-t border-slate-200 dark:border-white/5">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.2em] ml-2 mb-6">Activity & Comments</h3>
              <div className="space-y-5 mb-6">
                {task.comments.map(comment => {
                  const author = employees.find(e => e.id === comment.authorId);
                  return (
                    <div key={comment.id} className="flex items-end gap-3 group">
                      <img src={author?.avatarUrl} alt={author?.name} className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-[#1E1E1E] shadow-sm mb-1" />
                      <div className="flex-1 bg-white/60 dark:bg-[#1A1A1A] border border-white/60 dark:border-white/5 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm relative group-hover:border-primary-500/20 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wide">{author?.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">{getRelativeTime(comment.timestamp)}</p>
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-white/70 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  );
                })}
                {task.comments.length === 0 && (
                  <div className="py-10 flex flex-col items-center justify-center bg-white/30 dark:bg-white/[0.02] border border-dashed border-slate-300 dark:border-white/10 rounded-[32px]">
                    <div className="w-10 h-10 rounded-full bg-white/50 dark:bg-white/5 flex items-center justify-center mb-3">
                      <span className="text-xl opacity-50">💭</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">No comments yet</p>
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Comment Input Footer */}
          <footer className="p-4 sm:p-6 bg-white/60 dark:bg-black/20 border-t border-white/50 dark:border-white/5 backdrop-blur-xl shrink-0">
            <form onSubmit={handleCommentSubmit} className="flex items-center gap-3 sm:gap-4 max-w-4xl mx-auto">
              {currentUser && <img src={currentUser.avatarUrl} alt={currentUser.name} className="hidden sm:block w-10 h-10 rounded-full border-2 border-white dark:border-[#1E1E1E] shadow-md object-cover" />}
              <div className="flex-1 relative group">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type your comment here..."
                  className="w-full px-5 py-3.5 sm:py-4 bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[20px] text-slate-900 dark:text-white text-sm font-medium placeholder-slate-400 dark:placeholder-white/20 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500/50 transition-all outline-none shadow-sm group-hover:border-slate-300 dark:group-hover:border-white/20"
                />
              </div>
              <button
                type="submit"
                className="p-3.5 sm:p-4 bg-primary-600 text-white rounded-[20px] hover:bg-primary-500 disabled:opacity-40 disabled:hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 active:scale-95 disabled:active:scale-100 flex-shrink-0"
                disabled={!newComment.trim()}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </footer>
        </div>
      </div >

      {/* Confirmation Modal */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCompleteConfirm(false)} />
          <div className="relative bg-white dark:bg-[#1A1A1A] rounded-[32px] p-8 max-w-sm w-full border border-slate-200 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 mb-6">
              <CheckCircleIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-center text-slate-900 dark:text-white mb-2 tracking-tight">Complete Task?</h3>
            <p className="text-center text-sm text-slate-500 dark:text-white/60 mb-8 font-medium">
              Are you sure you want to mark "{task.title}" as complete?
              {task.recurrence && task.recurrence !== 'none' && (
                <span className="block mt-2 text-primary-600 dark:text-primary-400">
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
                className="flex-1 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[20px] font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-95"
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
    </div >
  );
};

export default TaskDetailsModal;
