import React, { useState, useEffect, useMemo } from 'react';
import { Task, Employee, Priority, Subtask } from '../types';
import { PRIORITIES } from '../constants';
import { suggestTaskPriority } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { PlusIcon } from './icons/PlusIcon';
import TagPill from './TagPill';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'spaceId' | 'status' | 'comments' | 'createdAt' | 'subtasks' | 'tags' | 'timeLogs' | 'timerStartTime' | 'completedAt'> & { subtasks?: Subtask[], tags?: string[], spaceId?: string }, id: number | null) => void;
  employees: Employee[];
  taskToEdit: Task | Partial<Task> | null;
  allTasks: Task[];
  currentUserId?: string;
  isAdmin?: boolean;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onSave, employees, taskToEdit, allTasks, currentUserId, isAdmin }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [blockedById, setBlockedById] = useState<number | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [show, setShow] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [spaceId, setSpaceId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 10);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      setShow(false);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setDescription(taskToEdit.description || '');
      setAssigneeId(taskToEdit.assigneeId || currentUserId || (employees.length > 0 ? employees[0].id : ''));
      setDueDate(taskToEdit.dueDate || new Date().toISOString().split('T')[0]);
      setPriority(taskToEdit.priority || Priority.MEDIUM);
      setBlockedById(taskToEdit.blockedById || null);
      setSubtasks(taskToEdit.subtasks || []);
      setTags(taskToEdit.tags || []);
      setSpaceId(taskToEdit.spaceId || '');
    } else {
      setTitle('');
      setDescription('');
      setAssigneeId(currentUserId || (employees.length > 0 ? employees[0].id : ''));
      setDueDate(new Date().toISOString().split('T')[0]);
      setPriority(Priority.MEDIUM);
      setBlockedById(null);
      setSubtasks([]);
      setTags([]);
      setSpaceId('');
    }
  }, [taskToEdit, employees, isOpen, currentUserId]);

  const existingTags = useMemo(() => {
    const allTags = new Set(allTasks.flatMap(task => task.tags || []));
    return Array.from(allTags).sort();
  }, [allTasks]);

  const suggestedTags = useMemo(() => {
    return existingTags.filter(tag =>
      !tags.includes(tag) &&
      tag.toLowerCase().includes(newTag.toLowerCase())
    );
  }, [existingTags, tags, newTag]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title, description, assigneeId, dueDate, priority, blockedById, subtasks, tags, spaceId }, taskToEdit && 'id' in taskToEdit ? taskToEdit.id as number : null);
  };

  const handleSuggestPriority = async () => {
    if (!title.trim() && !description.trim()) return;
    setIsAiLoading(true);
    try {
      const suggested = await suggestTaskPriority(title, description);
      if (suggested) setPriority(suggested);
    } catch (error) {
      console.error('Priority suggestion failed:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const selectTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setNewTag('');
    setShowTagSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const potentialBlockingTasks = allTasks.filter(t => t.id !== (taskToEdit?.id || -1));

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 transition-all duration-500 overflow-hidden ${show ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-xl transition-all" onClick={onClose}></div>

      <div className={`relative w-full max-w-2xl max-h-[90vh] bg-white/80 dark:bg-[#121212]/90 backdrop-blur-3xl border border-black/10 dark:border-white/10 rounded-[40px] shadow-2xl flex flex-col transition-all duration-500 transform ${show ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}`}>
        {/* Header */}
        <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/5 dark:bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl ${isAdmin ? 'bg-slate-900 shadow-slate-900/20' : 'bg-blue-500 shadow-blue-500/20'}`}>
              <PlusIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                {taskToEdit && (taskToEdit.id || taskToEdit.title) ? 'Edit Task' : 'New Task'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] mt-1">
                {taskToEdit?.id ? `ID: #${taskToEdit.id}` : 'Create New'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-2xl transition-all border border-black/5 dark:border-white/5 group">
            <PlusIcon className="w-5 h-5 text-slate-400 dark:text-white/40 group-hover:text-slate-900 dark:group-hover:text-white rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-8 space-y-6 scrollbar-none">
          <div className="space-y-2">
            <label htmlFor="title" className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-1">
              Task Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-6 py-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl text-slate-900 dark:text-white font-bold placeholder-slate-400 dark:placeholder-white/20 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 outline-none shadow-inner"
              required
              placeholder="e.g., Q3 Financial Report"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-6 py-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl text-slate-700 dark:text-white/80 font-medium placeholder-slate-400 dark:placeholder-white/20 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 resize-none outline-none shadow-inner"
              placeholder="Add details about this task..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="tags" className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3 bg-black/[0.02] dark:bg-white/[0.02] p-3 rounded-2xl border border-black/5 dark:border-white/5 min-h-[48px]">
              {tags.map(tag => (
                <TagPill key={tag} text={tag} onRemove={() => removeTag(tag)} />
              ))}
              {tags.length === 0 && <span className="text-[10px] font-bold text-slate-400 dark:text-white/10 uppercase tracking-widest italic flex items-center pl-1">No tokens assigned</span>}
            </div>
            <div className="relative">
              <input
                type="text"
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
                onFocus={() => setShowTagSuggestions(true)}
                onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                placeholder="Add new tag..."
                className="w-full px-6 py-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl text-slate-900 dark:text-white font-bold placeholder-slate-400 dark:placeholder-white/20 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 outline-none shadow-inner"
                autoComplete="off"
              />
              {showTagSuggestions && suggestedTags.length > 0 && (
                <ul className="absolute z-[110] w-full bg-white dark:bg-[#2A2A2D] border border-black/5 dark:border-white/10 rounded-2xl shadow-2xl mt-2 max-h-48 overflow-y-auto scrollbar-none p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {suggestedTags.map(tag => (
                    <li
                      key={tag}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectTag(tag);
                      }}
                      className="px-4 py-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 text-sm font-bold text-slate-700 dark:text-white/80 rounded-xl transition-all"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="assignee" className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-1">
                Assignee
              </label>
              <select
                id="assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-6 py-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl text-slate-700 dark:text-white font-bold focus:ring-2 focus:ring-blue-500/50 appearance-none transition-all cursor-pointer outline-none shadow-inner"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id} className="bg-white dark:bg-[#1E1E1E] text-slate-900 dark:text-white">{emp.name}{emp.id === currentUserId ? ' (Active Self)' : ''}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="dueDate" className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-1">
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-6 py-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl text-slate-700 dark:text-white font-black uppercase focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer outline-none shadow-inner"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
            <div className="space-y-2">
              <label htmlFor="priority" className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-1">
                Priority
              </label>
              <div className="flex items-center gap-3">
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="flex-1 px-6 py-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl text-slate-700 dark:text-white font-black uppercase focus:ring-2 focus:ring-blue-500/50 appearance-none transition-all cursor-pointer outline-none shadow-inner"
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p} className="bg-white dark:bg-[#1E1E1E] text-slate-900 dark:text-white">{p}</option>
                  ))}
                </select>
                <button type="button" onClick={handleSuggestPriority} disabled={isAiLoading} className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl hover:bg-blue-500/20 transition-all group" title="Suggest Priority with AI">
                  <SparklesIcon className={`w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:text-blue-300 ${isAiLoading ? 'animate-pulse scale-110' : ''}`} />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="blockedBy" className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest ml-1">
                Blocked By
              </label>
              <select
                id="blockedBy"
                value={blockedById || ''}
                onChange={(e) => setBlockedById(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-6 py-4 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl text-slate-700 dark:text-white font-bold focus:ring-2 focus:ring-blue-500/50 appearance-none transition-all cursor-pointer outline-none shadow-inner"
              >
                <option value="" className="bg-white dark:bg-[#1E1E1E] text-slate-400 dark:text-white/40">None Detected</option>
                {potentialBlockingTasks.map(task => (
                  <option key={task.id} value={task.id} className="bg-white dark:bg-[#1E1E1E] text-slate-900 dark:text-white">{task.title}</option>
                ))}
              </select>
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 p-6 border-t border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.01]">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all duration-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-10 py-4 bg-blue-500 hover:bg-blue-400 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-xl shadow-blue-500/20 active:scale-95"
          >
            {taskToEdit && (taskToEdit.id || taskToEdit.title) ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </div >
    </div >
  );
};

export default AddTaskModal;