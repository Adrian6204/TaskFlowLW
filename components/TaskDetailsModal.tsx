import React, { useState, useEffect, useMemo } from 'react';
import { Task, Employee, Priority, Subtask, TaskStatus } from '../types';
import { useAuth } from '../auth/AuthContext';
import { XMarkIcon } from './icons/XMarkIcon';
import { FlagIcon } from './icons/FlagIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { getTaskAdviceFromAI, generateSubtasks } from '../services/geminiService';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { ClockIcon } from './icons/ClockIcon';
import TagPill from './TagPill';
import { PRIORITIES } from '../constants'; // Ensure this matches AddTaskModal

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  employees: Employee[];
  allTasks: Task[];
  onAddComment: (taskId: number, content: string) => void;
  onUpdateTask: (task: Task) => void;
  onToggleTimer: (taskId: number) => void;
}

const priorityConfig = {
  [Priority.URGENT]: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/50' },
  [Priority.HIGH]: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/50' },
  [Priority.MEDIUM]: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/50' },
  [Priority.LOW]: { text: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700' },
};

const formatDuration = (ms: number) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)));

  return `${hours}h ${minutes}m ${seconds}s`;
};

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ isOpen, onClose, task, employees, allTasks, onAddComment, onUpdateTask, onToggleTimer }) => {
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();
  const assignee = employees.find(e => e.id === task.assigneeId);
  const currentUser = employees.find(e => e.id === user?.employeeId);
  const blockingTask = task.blockedById ? allTasks.find(t => t.id === task.blockedById) : null;

  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  // Subtasks State
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);

  // Tags State
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Timer State
  const [elapsedTime, setElapsedTime] = useState(0);

  // Edit State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 10);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);

      // Initialize edit fields
      setEditTitle(task.title);
      setEditDesc(task.description || '');

      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      setShow(false);
    }
  }, [isOpen, onClose, task]); // Added task dependency so it updates if task changes

  useEffect(() => {
    if (isOpen) {
      setAiQuestion('');
      setAiResponse('');
      setAiError(null);
      setNewSubtaskTitle('');
      setNewTag('');
      setIsAddingTag(false);
      setShowTagSuggestions(false);
      setIsEditingTitle(false);
      setIsEditingDesc(false);
    }
  }, [isOpen])

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

  const existingTags = useMemo(() => {
    const allTags = new Set(allTasks.flatMap(t => t.tags || []));
    return Array.from(allTags).sort();
  }, [allTasks]);

  const suggestedTags = useMemo(() => {
    return existingTags.filter(tag =>
      !(task.tags || []).includes(tag) &&
      tag.toLowerCase().includes(newTag.toLowerCase())
    );
  }, [existingTags, task.tags, newTag]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(task.id, newComment.trim());
    setNewComment('');
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setIsAiLoading(true);
    setAiResponse('');
    setAiError(null);
    try {
      const response = await getTaskAdviceFromAI(task.title, task.description, aiQuestion);
      setAiResponse(response);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: Subtask = {
      id: `manual-${Date.now()}`,
      title: newSubtaskTitle,
      isCompleted: false
    };

    onUpdateTask({
      ...task,
      subtasks: [...(task.subtasks || []), newSubtask]
    });
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = (task.subtasks || []).map(st =>
      st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
    );
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const updatedSubtasks = (task.subtasks || []).filter(st => st.id !== subtaskId);
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  const handleGenerateSubtasks = async () => {
    setIsGeneratingSubtasks(true);
    try {
      const generatedTitles = await generateSubtasks(task.title, task.description);
      const newSubtasks: Subtask[] = generatedTitles.map((title, index) => ({
        id: `ai-${Date.now()}-${index}`,
        title,
        isCompleted: false
      }));

      onUpdateTask({
        ...task,
        subtasks: [...(task.subtasks || []), ...newSubtasks]
      });
    } catch (error) {
      console.error("Failed to generate subtasks", error);
    } finally {
      setIsGeneratingSubtasks(false);
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;

    const currentTags = task.tags || [];
    if (!currentTags.includes(newTag.trim())) {
      onUpdateTask({
        ...task,
        tags: [...currentTags, newTag.trim()]
      });
    }
    setNewTag('');
    setIsAddingTag(false);
    setShowTagSuggestions(false);
  };

  const handleSelectTag = (tag: string) => {
    const currentTags = task.tags || [];
    if (!currentTags.includes(tag)) {
      onUpdateTask({
        ...task,
        tags: [...currentTags, tag]
      });
    }
    setNewTag('');
    setIsAddingTag(false);
    setShowTagSuggestions(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = task.tags || [];
    onUpdateTask({
      ...task,
      tags: currentTags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      onUpdateTask({ ...task, title: editTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleSaveDesc = () => {
    if (editDesc !== task.description) {
      onUpdateTask({ ...task, description: editDesc });
    }
    setIsEditingDesc(false);
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
      className={`fixed inset-0 z-[100] flex justify-center items-center p-4 transition-all duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-xl transition-all duration-500"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className={`bg-white/80 dark:bg-[#1E1E1E]/90 backdrop-blur-3xl rounded-[40px] border border-black/10 dark:border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-all duration-500 relative z-10 transform ${show ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}`}>
        <header className="p-8 border-b border-black/5 dark:border-white/5 flex justify-between items-center flex-shrink-0 bg-black/5 dark:bg-white/[0.02]">
          <div className="flex-1 mr-4">
            {isEditingTitle ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                autoFocus
                className="w-full text-2xl font-black text-slate-900 dark:text-white bg-transparent border-b-2 border-blue-500 focus:outline-none"
                placeholder="Task Title"
              />
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase truncate max-w-[400px] cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Click to edit"
              >
                {task.title}
              </h2>
            )}
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${task.status === TaskStatus.DONE ? 'bg-green-500' : 'bg-blue-500'} shadow-[0_0_8px_rgba(59,130,246,0.5)]`}></div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.2em]">{task.status === TaskStatus.DONE ? 'Completed' : 'Task Details'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-2xl transition-all border border-black/5 dark:border-white/5 group">
            <XMarkIcon className="w-5 h-5 text-slate-400 dark:text-white/40 group-hover:text-slate-900 dark:group-hover:text-white" />
          </button>
        </header>

        <main className="p-8 overflow-y-auto flex-grow scrollbar-none space-y-8">
          {blockingTask && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[24px] p-4 flex items-center gap-4 animate-pulse">
              <LockClosedIcon className="w-6 h-6 text-amber-600 dark:text-amber-500 flex-shrink-0" />
              <p className="text-xs font-bold text-amber-700 dark:text-amber-200 uppercase tracking-wide">Blocked by: <span className="font-black text-slate-900 dark:text-white">"{blockingTask.title}"</span></p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl shadow-sm">
              <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest block mb-2">Assignee</span>
              <div className="flex items-center gap-3">
                {assignee ? (
                  <img src={assignee.avatarUrl} alt={assignee.name} className="w-6 h-6 rounded-full border border-black/10 dark:border-white/10 shadow-sm" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 border border-black/10 dark:border-white/10 shadow-sm"></div>
                )}
                <select
                  value={task.assigneeId ? task.assigneeId.toString() : ''}
                  onChange={(e) => onUpdateTask({ ...task, assigneeId: e.target.value })}
                  className="text-xs font-bold text-slate-700 dark:text-white outline-none bg-transparent w-full cursor-pointer"
                >
                  <option value="" disabled>Unassigned</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl shadow-sm">
              <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest block mb-2">Priority</span>
              <div className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${priorityConfig[task.priority].text}`}>
                <FlagIcon className="w-3 h-3" />
                <select
                  value={task.priority}
                  onChange={(e) => onUpdateTask({ ...task, priority: e.target.value as Priority })}
                  className="bg-transparent outline-none cursor-pointer uppercase font-black"
                >
                  {Object.values(Priority).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl shadow-sm">
              <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest block mb-2">Deadline</span>
              <input
                type="date"
                value={task.dueDate}
                onChange={(e) => onUpdateTask({ ...task, dueDate: e.target.value })}
                className="text-xs font-bold text-slate-700 dark:text-white bg-transparent outline-none cursor-pointer w-full"
              />
            </div>

            <div className="p-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl shadow-sm">
              <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest block mb-2">Created</span>
              <p className="text-xs font-bold text-slate-700 dark:text-white">{new Date(task.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-1">Tags</span>
            <div className="flex flex-wrap items-center gap-2 bg-black/[0.02] dark:bg-white/[0.02] p-4 rounded-3xl border border-black/5 dark:border-white/5 min-h-[60px] shadow-inner">
              {(task.tags || []).map(tag => (
                <TagPill key={tag} text={tag} onRemove={() => handleRemoveTag(tag)} />
              ))}
              {isAddingTag ? (
                <div className="relative">
                  <form onSubmit={handleAddTag} className="flex items-center">
                    <input
                      type="text"
                      autoFocus
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onFocus={() => setShowTagSuggestions(true)}
                      onBlur={() => {
                        setTimeout(() => {
                          if (!newTag) setIsAddingTag(false);
                          setShowTagSuggestions(false);
                        }, 200);
                      }}
                      className="px-4 py-2 text-[10px] font-bold bg-white dark:bg-[#2A2A2D] border border-black/5 dark:border-white/10 rounded-xl focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-white/20 outline-none shadow-sm"
                      placeholder="New tag..."
                    />
                  </form>
                  {showTagSuggestions && suggestedTags.length > 0 && (
                    <ul className="absolute z-[120] left-0 top-full mt-2 bg-white dark:bg-[#1E1E1E] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl max-h-40 overflow-y-auto w-40 p-1 animate-in fade-in zoom-in duration-200">
                      {suggestedTags.map(tag => (
                        <li
                          key={tag}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectTag(tag);
                          }}
                          className="px-3 py-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 text-[10px] font-bold text-slate-400 dark:text-white/60 hover:text-slate-900 dark:hover:text-white rounded-lg transition-all"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingTag(true)}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-black/5 dark:bg-white/5 text-slate-400 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border border-black/5 dark:border-white/5 transition-all shadow-sm"
                >
                  <PlusIcon className="w-3 h-3 mr-2" /> Add Tag
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-1">Description</h3>
            <div className="p-6 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[32px] shadow-inner group relative hover:border-black/10 dark:hover:border-white/10 transition-colors">
              {isEditingDesc ? (
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  onBlur={handleSaveDesc}
                  rows={6}
                  autoFocus
                  className="w-full bg-transparent text-sm font-medium text-slate-700 dark:text-white/80 leading-relaxed outline-none resize-none"
                  placeholder="Add a detailed description..."
                />
              ) : (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  className="min-h-[100px] cursor-pointer"
                  title="Click to edit"
                >
                  <p className="text-sm font-medium text-slate-700 dark:text-white/80 leading-relaxed whitespace-pre-wrap">
                    {task.description || <span className="text-slate-400 italic">No description provided. Click to add one.</span>}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-black/5 dark:border-white/5 rounded-[40px] p-8 shadow-inner relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${task.timerStartTime ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 animate-pulse' : 'bg-black/5 dark:bg-white/5 text-slate-400 dark:text-white/20'}`}>
                    <ClockIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Time Tracking</h3>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-wider mt-0.5">{task.timerStartTime ? 'Timer Active' : 'Start Timer'}</p>
                  </div>
                </div>
                {task.timerStartTime && (
                  <div className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest animate-pulse">Running</span>
                  </div>
                )}
              </div>

              <div className="text-center mb-8">
                <div className={`text-6xl font-black font-mono tracking-tighter ${task.timerStartTime
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-300 dark:text-white/20'
                  }`}>
                  {task.timerStartTime ? formatDuration(elapsedTime) : totalTimeDisplay}
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => onToggleTimer(task.id)}
                  className={`flex items-center justify-center gap-4 px-10 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl ${task.timerStartTime
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/30'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30'
                    }`}
                >
                  {task.timerStartTime ? (
                    <>
                      <StopIcon className="w-6 h-6" /> Stop Timer
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-6 h-6" /> Start Timer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center ml-1">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest">Subtasks ({completedSubtasks}/{totalSubtasks})</h3>
              <button
                onClick={handleGenerateSubtasks}
                disabled={isGeneratingSubtasks}
                className="flex items-center text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 disabled:opacity-30 group"
              >
                <SparklesIcon className={`w-4 h-4 mr-2 group-hover:scale-110 transition-all ${isGeneratingSubtasks ? 'animate-spin' : ''}`} />
                {isGeneratingSubtasks ? 'Thinking...' : 'Generate with AI'}
              </button>
            </div>

            <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-1.5 overflow-hidden shadow-inner">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.3)]" style={{ width: `${progressPercentage}%` }}></div>
            </div>

            <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-[32px] p-6 space-y-4 shadow-inner">
              <ul className="space-y-3">
                {(task.subtasks || []).map(subtask => (
                  <li key={subtask.id} className="flex items-center group bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/[0.08] transition-all shadow-sm">
                    <input
                      type="checkbox"
                      checked={subtask.isCompleted}
                      onChange={() => handleToggleSubtask(subtask.id)}
                      className="h-5 w-5 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 rounded-lg text-blue-500 focus:ring-blue-500/50 cursor-pointer transition-all"
                    />
                    <span className={`ml-4 text-xs font-bold flex-grow transition-all ${subtask.isCompleted ? 'text-slate-300 dark:text-white/20 line-through' : 'text-slate-700 dark:text-white/80'}`}>
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="p-2 text-slate-300 dark:text-white/10 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </li>
                ))}
                {(task.subtasks || []).length === 0 && (
                  <p className="text-[10px] font-bold text-slate-400 dark:text-white/10 uppercase tracking-widest text-center py-4">No subtasks yet</p>
                )}
              </ul>

              <form onSubmit={handleAddSubtask} className="flex gap-3 pt-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a subtask..."
                  className="flex-grow text-xs font-bold px-5 py-4 bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-white/10 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none shadow-sm"
                />
                <button type="submit" disabled={!newSubtaskTitle.trim()} className="p-4 bg-black/5 dark:bg-white/10 text-slate-400 dark:text-white rounded-2xl hover:bg-black/10 dark:hover:bg-white/20 disabled:opacity-30 transition-all shadow-sm">
                  <PlusIcon className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>

          <div className="bg-black/5 dark:bg-[#2A2A2D]/50 border border-black/5 dark:border-white/5 rounded-[40px] p-8 shadow-inner">
            <div className="flex items-center gap-3 mb-6">
              <SparklesIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">AI Assistant</h3>
            </div>
            <form onSubmit={handleAskAI} className="space-y-4">
              <textarea
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="Ask about this task or get next steps..."
                rows={3}
                className="w-full px-6 py-4 bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl text-slate-700 dark:text-white font-medium placeholder-slate-300 dark:placeholder-white/10 focus:ring-2 focus:ring-blue-500/50 transition-all resize-none outline-none shadow-sm"
              />
              <button type="submit" className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl disabled:opacity-30 transition-all shadow-xl shadow-blue-500/20 active:scale-95" disabled={!aiQuestion.trim() || isAiLoading}>
                {isAiLoading ? 'Thinking...' : 'Ask AI'}
              </button>
            </form>
            {isAiLoading && <div className="text-center py-8 text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.3em] animate-pulse">Processing...</div>}
            {aiError && <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">{aiError}</div>}
            {aiResponse && (
              <div className="mt-6 p-6 bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-3xl text-sm font-medium text-slate-700 dark:text-white/80 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm">
                {aiResponse}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-1">Activity & Comments</h3>
            <div className="space-y-4">
              {task.comments.map(comment => {
                const author = employees.find(e => e.id === comment.authorId);
                return (
                  <div key={comment.id} className="flex items-start gap-4">
                    <img src={author?.avatarUrl} alt={author?.name} className="w-10 h-10 rounded-2xl object-cover border border-black/10 dark:border-white/10 shadow-sm" />
                    <div className="flex-1 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-[24px] px-6 py-4 shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">{author?.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-tighter">{getRelativeTime(comment.timestamp)}</p>
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-white/70 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                );
              })}
              {task.comments.length === 0 && (
                <div className="py-12 flex flex-col items-center gap-3 bg-black/[0.01] dark:bg-white/[0.01] border border-dashed border-black/5 dark:border-white/5 rounded-[40px]">
                  <p className="text-[10px] font-bold text-slate-300 dark:text-white/10 uppercase tracking-[0.3em]">No comments yet</p>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="p-8 bg-black/5 dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 rounded-b-[40px]">
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-4">
            {currentUser && <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-10 h-10 rounded-2xl border border-black/10 dark:border-white/10 shadow-md" />}
            <div className="flex-1 relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-6 py-4 bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl text-slate-900 dark:text-white font-bold placeholder-slate-300 dark:placeholder-white/10 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none shadow-sm"
              />
            </div>
            <button type="submit" className="p-4 bg-blue-500 text-white rounded-2xl hover:bg-blue-400 disabled:opacity-30 transition-all shadow-lg shadow-blue-500/20 active:scale-95" disabled={!newComment.trim()}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
