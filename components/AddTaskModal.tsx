import React, { useState, useEffect, useMemo } from 'react';
import { Task, Employee, Priority, Subtask } from '../types';
import { PRIORITIES } from '../constants';
import { SparklesIcon } from './icons/SparklesIcon';
import { PlusIcon } from './icons/PlusIcon';
import TagPill from './TagPill';
import { TagIcon } from './icons/TagIcon';

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
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const [show, setShow] = useState(false);
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

  // Reset focus when suggestions change
  useEffect(() => {
    setFocusedSuggestionIndex(-1);
  }, [suggestedTags]);

  // Focus input when adding tag
  useEffect(() => {
    if (isAddingTag) {
      const input = document.getElementById('tags-input');
      if (input) input.focus();
    }
  }, [isAddingTag]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      // Include any pending tag in the input that wasn't added yet
      const finalTags = [...tags];
      if (newTag.trim() && !tags.includes(newTag.trim())) {
        finalTags.push(newTag.trim());
      }

      console.log('Submitting task form:', { title, description, assigneeId, dueDate, priority, blockedById, subtasks, tags: finalTags, spaceId });
      await onSave({ title, description, assigneeId, dueDate, priority, blockedById, subtasks, tags: finalTags, spaceId }, taskToEdit && 'id' in taskToEdit ? taskToEdit.id as number : null);
    } catch (error) {
      console.error('Failed to save task from modal:', error);
    }
  };



  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showTagSuggestions && focusedSuggestionIndex >= 0 && suggestedTags[focusedSuggestionIndex]) {
        selectTag(suggestedTags[focusedSuggestionIndex]);
      } else if (newTag.trim()) {
        if (!tags.includes(newTag.trim())) {
          setTags([...tags, newTag.trim()]);
        }
        setNewTag('');
      }
    } else if (e.key === 'Backspace' && !newTag && tags.length > 0) {
      setTags(tags.slice(0, -1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedSuggestionIndex(prev =>
        prev < suggestedTags.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedSuggestionIndex(prev => prev > -1 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setIsAddingTag(false);
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
            <div className="group flex flex-wrap items-center gap-2 p-3 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-black/5 dark:border-white/5 min-h-[56px] focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all shadow-inner relative hover:bg-black/[0.04] dark:hover:bg-white/[0.04]">
              <TagIcon className="w-5 h-5 text-slate-400 dark:text-white/30 mr-1 flex-shrink-0 group-focus-within:text-blue-500 transition-colors" />

              {tags.map(tag => (
                <TagPill key={tag} text={tag} onRemove={() => removeTag(tag)} />
              ))}

              <div className="relative flex-grow min-w-[120px]">
                {isAddingTag ? (
                  <>
                    <input
                      type="text"
                      id="tags-input"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={handleAddTag}
                      onFocus={() => setShowTagSuggestions(true)}
                      onBlur={() => {
                        // Delay hiding needed for clicking suggestions
                        setTimeout(() => {
                          setShowTagSuggestions(false);
                          if (!newTag.trim()) setIsAddingTag(false);
                        }, 200);
                      }}
                      placeholder={tags.length === 0 ? "Add tags..." : "Add another..."}
                      className="w-full px-2 py-1 bg-transparent text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 outline-none animate-in fade-in zoom-in duration-200"
                      autoComplete="off"
                    />

                    {showTagSuggestions && suggestedTags.length > 0 && (
                      <ul className="absolute left-0 top-full mt-3 w-full min-w-[200px] bg-white dark:bg-[#1E1E1E] border border-black/5 dark:border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto scrollbar-none p-1.5 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                        <li className="px-3 py-1.5 text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-wider">
                          Suggestions
                        </li>
                        {suggestedTags.map((tag, index) => (
                          <li
                            key={tag}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              selectTag(tag);
                              // Keep adding mode active
                              const input = document.getElementById('tags-input');
                              if (input) input.focus();
                            }}
                            onMouseEnter={() => setFocusedSuggestionIndex(index)}
                            className={`px-3 py-2.5 cursor-pointer text-sm font-bold rounded-lg transition-all flex items-center justify-between group ${index === focusedSuggestionIndex
                              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                              : 'text-slate-700 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5'
                              }`}
                          >
                            <span>{tag}</span>
                            {index === focusedSuggestionIndex && (
                              <span className="text-[10px] uppercase tracking-wide opacity-80">Enter</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-all group"
                  >
                    <PlusIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">Add Tag</span>
                  </button>
                )}
              </div>
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
            className="px-5 py-3 md:px-8 md:py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all duration-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-3 md:px-10 md:py-4 bg-blue-500 hover:bg-blue-400 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all duration-300 shadow-xl shadow-blue-500/20 active:scale-95"
          >
            {taskToEdit && (taskToEdit.id || taskToEdit.title) ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </div >
    </div >
  );
};

export default AddTaskModal;