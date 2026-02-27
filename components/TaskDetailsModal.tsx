import React, { useState, useEffect } from 'react';
import { Task, Employee, Priority, TaskStatus } from '../types';
import { useAuth } from '../auth/AuthContext';
import { XMarkIcon } from './icons/XMarkIcon';
import { FlagIcon } from './icons/FlagIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { TrashIcon } from './icons/TrashIcon';

import { ClockIcon } from './icons/ClockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import TagPill from './TagPill';
import * as dataService from '../services/supabaseService';


interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  employees: Employee[];
  allTasks: Task[];
  onAddComment: (taskId: number, content: string) => Promise<void>;
  onDeleteTask?: (taskId: number) => void;
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

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ isOpen, onClose, task, employees, allTasks, onAddComment, onDeleteTask, currentUserId, isAdmin }) => {
  const [newComment, setNewComment] = useState('');
  const [dummyState, setDummyState] = useState(false); // Used to force re-render for optimistic updates
  const { user } = useAuth();
  const assignee = employees.find(e => e.id === task.assigneeId);
  const currentUser = employees.find(e => e.id === user?.employeeId);
  const blockingTask = task.blockedById ? allTasks.find(t => t.id === task.blockedById) : null;
  const canDelete = isAdmin || (currentUserId && task.assigneeId === currentUserId);

  const [show, setShow] = useState(false);

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
              </div>
              <h2
                className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-tight"
                title={task.title}
              >
                {task.title}
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 relative z-10">
              {onDeleteTask && canDelete && (
                <button
                  onClick={() => { onDeleteTask(task.id); onClose(); }}
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
                <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] block mb-3">Assignee</span>
                <div className="flex items-center gap-3">
                  {assignee ? (
                    <img src={assignee.avatarUrl} alt={assignee.name} className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 border-2 border-white shadow-sm flex items-center justify-center">
                      <span className="text-[10px] font-bold text-slate-400">-</span>
                    </div>
                  )}
                  <span className="text-sm font-bold text-slate-800 dark:text-white/90 truncate">
                    {assignee?.name || 'Unassigned'}
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

              <div className="p-5 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/5 rounded-[24px] hover:border-rose-500/30 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-rose-500/5 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] block mb-3">Deadline</span>
                <p className="text-sm font-bold text-slate-800 dark:text-white/90">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}
                </p>
              </div>

              <div className="p-5 bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/5 rounded-[24px] hover:border-emerald-500/30 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-emerald-500/5 shadow-sm">
                <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] block mb-3">Created</span>
                <p className="text-sm font-bold text-slate-800 dark:text-white/90">
                  {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
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
                {totalSubtasks > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-end ml-2">
                      <h3 className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.2em]">Subtasks</h3>
                      <span className="text-[10px] font-bold text-slate-500 font-mono bg-white/50 dark:bg-white/10 px-2 py-0.5 rounded-md border border-white/50 dark:border-white/5">{completedSubtasks}/{totalSubtasks}</span>
                    </div>

                    <div className="w-full bg-white/50 dark:bg-black/20 rounded-full h-1.5 border border-white/40 dark:border-white/5 overflow-hidden">
                      <div className="bg-gradient-to-r from-primary-500 to-primary-500 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.3)]" style={{ width: `${progressPercentage}%` }}></div>
                    </div>

                    <div className="bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/5 rounded-[28px] p-4 shadow-sm max-h-[160px] overflow-y-auto scrollbar-none">
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
                    </div>
                  </div>
                )}
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
    </div >
  );
};

export default TaskDetailsModal;
