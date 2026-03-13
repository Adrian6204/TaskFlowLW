import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Task, Space, Employee, Priority, TaskStatus, List, Subtask } from '../types';
import { UserIcon } from './icons/UserIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { TrashIcon } from './icons/TrashIcon';
import CalendarPicker from './CalendarPicker';
import { FlagIcon } from './icons/FlagIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { PlusIcon } from './icons/PlusIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { ClockIcon } from './icons/ClockIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Partial<Task>, id: number | null) => Promise<void>;
    taskToEdit?: Task | Partial<Task> | null;
    employees: Employee[];
    activeSpaceId: string;
    spaces: Space[];
    lists: List[];
    currentUserId: string;
    isAdmin?: boolean;
    isSuperAdmin?: boolean;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
    isOpen,
    onClose,
    onSave,
    taskToEdit,
    employees,
    activeSpaceId,
    spaces,
    lists,
    currentUserId,
    isSuperAdmin,
}) => {
    const [show, setShow] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [spaceId, setSpaceId] = useState(activeSpaceId);
    const [listId, setListId] = useState<number | null>(null);
    const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO);
    const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
    const [assigneeIds, setAssigneeIds] = useState<string[]>([currentUserId]);
    const [dueDate, setDueDate] = useState<string>('');
    const [dueTime, setDueTime] = useState<string>('');
    const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
    const [tags, setTags] = useState<string[]>([]);
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    // UI States
    const [isSpaceSelectorOpen, setSpaceSelectorOpen] = useState(false);
    const [isListSelectorOpen, setListSelectorOpen] = useState(false);
    const [isAssigneeSelectorOpen, setAssigneeSelectorOpen] = useState(false);
    const [isPrioritySelectorOpen, setPrioritySelectorOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
    const [pendingToggleId, setPendingToggleId] = useState<string | null>(null);
    const [assigneeSearchTerm, setAssigneeSearchTerm] = useState('');
    const [isCalendarOpen, setCalendarOpen] = useState(false);
    const [isRecurrenceSelectorOpen, setRecurrenceSelectorOpen] = useState(false);

    const closeAllDropdowns = () => {
        setSpaceSelectorOpen(false);
        setListSelectorOpen(false);
        setAssigneeSelectorOpen(false);
        setPrioritySelectorOpen(false);
        setCalendarOpen(false);
        setRecurrenceSelectorOpen(false);
    };

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setShow(true), 10);
            if (taskToEdit) {
                setTitle(taskToEdit.title || '');
                setDescription(taskToEdit.description || '');
                setSpaceId(taskToEdit.spaceId || activeSpaceId);
                setListId(taskToEdit.listId || null);
                setStatus(taskToEdit.status || TaskStatus.TODO);
                setPriority(taskToEdit.priority || Priority.MEDIUM);
                setAssigneeIds(taskToEdit.assigneeIds || (taskToEdit.assigneeId ? [taskToEdit.assigneeId] : [currentUserId]));
                setDueDate(taskToEdit.dueDate || '');
                setDueTime(taskToEdit.dueTime || '');
                setRecurrence(taskToEdit.recurrence || 'none');
                setTags(taskToEdit.tags || []);
                setSubtasks(taskToEdit.subtasks || []);
            } else {
                // Reset defaults
                setTitle('');
                setDescription('');
                setSpaceId(activeSpaceId);
                setListId(null);
                setStatus(TaskStatus.TODO);
                setPriority(Priority.MEDIUM);
                setAssigneeIds([currentUserId]);
                setDueDate('');
                setDueTime('');
                setRecurrence('none');
                setTags([]);
                setSubtasks([]);
            }
        } else {
            setShow(false);
        }
    }, [isOpen, taskToEdit, activeSpaceId, currentUserId]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!title.trim() || !spaceId) return;

        const taskData: Partial<Task> = {
            spaceId,
            listId,
            title,
            description,
            status,
            priority,
            assigneeId: assigneeIds[0] || '',
            assigneeIds,
            creatorId: taskToEdit ? taskToEdit.creatorId : currentUserId,
            dueDate,
            dueTime,
            recurrence,
            tags,
            subtasks,
        };

        await onSave(taskData, taskToEdit?.id as number | null);
        onClose();
    };

    const handleAddSubtask = () => {
        if (newSubtaskTitle.trim()) {
            setSubtasks([...subtasks, { id: Date.now().toString(), title: newSubtaskTitle.trim(), isCompleted: false }]);
            setNewSubtaskTitle('');
        }
    };

    const currentSpace = spaces.find((s) => s.id === spaceId);
    const spaceLists = lists.filter((l) => l.spaceId === spaceId);
    const currentList = lists.find((l) => l.id === listId);

    // UI Helpers for multiple assignees
    const selectedAssignees = employees.filter((e) => assigneeIds.includes(e.id));

    const handleAssigneeToggle = (id: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }

        if (assigneeIds.includes(id)) {
            if (id === currentUserId) {
                setPendingToggleId(id);
                setConfirmMessage("Are you sure you want to unassign yourself from this task?");
                return;
            }
            setAssigneeIds(prev => prev.filter(aId => aId !== id));
        } else {
            setAssigneeIds(prev => [...prev, id]);
        }
    };

    const confirmAssigneeToggle = () => {
        if (pendingToggleId) {
            setAssigneeIds(prev => prev.filter(aId => aId !== pendingToggleId));
            setPendingToggleId(null);
            setConfirmMessage(null);
        }
    };

    const cancelAssigneeToggle = () => {
        setPendingToggleId(null);
        setConfirmMessage(null);
    };

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${show ? 'visible' : 'invisible'}`}>
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            <div className={`bg-white dark:bg-[#1E1E1E] w-full max-w-5xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[95vh] transition-all duration-300 transform border border-neutral-200/80 dark:border-white/5 overflow-hidden ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                {/* Gradient accent strip */}
                <div className="h-1 w-full bg-gradient-to-r from-lime-400 via-emerald-400 to-lime-400" />

                {/* Header / Breadcrumb */}
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between bg-neutral-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-2 text-sm">
                        {/* Space Selector Trigger */}
                        <div className="relative">
                            <button
                            onClick={() => {
                                const wasOpen = isSpaceSelectorOpen;
                                closeAllDropdowns();
                                setSpaceSelectorOpen(!wasOpen);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-slate-200"
                        >
                                <div className="w-2 h-2 rounded-full bg-neutral-400" />
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{currentSpace?.name || 'Select Space'}</span>
                            </button>

                            {isSpaceSelectorOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#2A2A2D] border border-neutral-200 dark:border-white/10 rounded-xl shadow-xl z-50 py-1">
                                    {spaces.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => { setSpaceId(s.id); setListId(null); setSpaceSelectorOpen(false); }}
                                            className="w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-white/5 text-sm text-slate-700 dark:text-slate-200"
                                        >
                                            {s.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <span className="text-neutral-400">/</span>

                        {/* List Selector Trigger */}
                        <div className="relative">
                            <button
                            onClick={() => {
                                const wasOpen = isListSelectorOpen;
                                closeAllDropdowns();
                                setListSelectorOpen(!wasOpen);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors text-slate-700 dark:text-slate-200"
                        >
                                <div className={`w-2 h-2 rounded-full ${currentList?.color ? '' : 'bg-transparent'}`} style={{ backgroundColor: currentList?.color }} />
                                <span className="font-semibold">{currentList?.name || 'Select List'}</span>
                            </button>

                            {isListSelectorOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#2A2A2D] border border-neutral-200 dark:border-white/10 rounded-xl shadow-xl z-50 py-1">
                                    <button
                                        onClick={() => { setListId(null); setListSelectorOpen(false); }}
                                        className="w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-white/5 text-sm text-neutral-500 italic"
                                    >
                                        No List
                                    </button>
                                    {spaceLists.map(l => (
                                        <button
                                            key={l.id}
                                            onClick={() => { setListId(l.id); setListSelectorOpen(false); }}
                                            className="w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-white/5 text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2"
                                        >
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                                            {l.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button onClick={onClose} className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-all">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-700">
                    {/* Title */}
                    <div className="mb-6 group">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task name"
                            className="w-full bg-transparent text-3xl font-bold text-slate-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-600 border-none focus:ring-0 p-0 pb-2"
                            autoFocus
                        />
                        <div className={`h-0.5 rounded-full transition-all duration-300 ${title ? 'bg-gradient-to-r from-lime-400 to-emerald-400 w-full' : 'bg-neutral-100 dark:bg-white/5 w-full group-focus-within:bg-gradient-to-r group-focus-within:from-lime-400 group-focus-within:to-emerald-400'}`} />
                    </div>

                    {/* Attributes Bar */}
                    <div className="flex flex-wrap items-center gap-3 mb-10 p-4 bg-neutral-50 dark:bg-white/[0.03] rounded-2xl border border-neutral-100 dark:border-white/5">
                        {/* Status badge */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider h-9 w-fit
                            ${status === TaskStatus.TODO ? 'bg-slate-100 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400'
                            : status === TaskStatus.IN_PROGRESS ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
                            : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${status === TaskStatus.TODO ? 'bg-slate-400' : status === TaskStatus.IN_PROGRESS ? 'bg-primary-500' : 'bg-green-500'}`} />
                            {status}
                        </div>

                        {/* Assignee Selector */}
                        <div className="relative w-fit">
                            <button
                            onClick={() => {
                                const wasOpen = isAssigneeSelectorOpen;
                                closeAllDropdowns();
                                setAssigneeSelectorOpen(!wasOpen);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 h-9 bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl hover:border-lime-400 dark:hover:border-lime-400/50 hover:shadow-sm text-slate-700 dark:text-slate-300 transition-all duration-200"
                        >
                                <UserIcon className="w-4 h-4 text-neutral-400" />
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {selectedAssignees.length === 0 ? 'Unassigned' : selectedAssignees.length === 1 ? selectedAssignees[0].name : `${selectedAssignees.length} Assignees`}
                                </span>
                            </button>
                            {/* Enhanced Assignee Dropdown */}
                            {isAssigneeSelectorOpen && (
                                <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-[#2A2A2D] border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                                    {/* Search Input */}
                                    <div className="p-3 border-b border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-white/[0.02]">
                                        <div className="relative">
                                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            <input
                                                type="text"
                                                value={assigneeSearchTerm}
                                                onChange={(e) => setAssigneeSearchTerm(e.target.value)}
                                                placeholder="Search members..."
                                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-lime-400/50 focus:border-lime-400/50 transition-all outline-none"
                                                autoFocus
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>

                                    {/* List */}
                                    <div className="max-h-80 overflow-y-auto p-1 scrollbar-thin">
                                        {employees
                                            .filter(e => e.name.toLowerCase().includes(assigneeSearchTerm.toLowerCase()))
                                            .map(e => {
                                                const isSelected = assigneeIds.includes(e.id);
                                                return (
                                                    <button
                                                        key={e.id}
                                                        onClick={(event) => handleAssigneeToggle(e.id, event)}
                                                        className={`w-full text-left px-3 py-2.5 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-xl transition-all flex items-center justify-between gap-3 group
                                                            ${isSelected ? 'bg-lime-50 dark:bg-lime-400/10' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="relative flex-shrink-0">
                                                                <img src={e.avatarUrl} className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-neutral-800" />
                                                                {isSelected && (
                                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-lime-500 rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center">
                                                                        <span className="text-[10px] text-white font-black">✓</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className={`text-sm font-bold truncate ${isSelected ? 'text-lime-700 dark:text-lime-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                                    {e.name}
                                                                </p>
                                                                <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold truncate">
                                                                    {e.position || 'Member'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {!isSelected && (
                                                            <div className="w-5 h-5 rounded-full border-2 border-neutral-200 dark:border-neutral-700 group-hover:border-lime-400 transition-colors flex-shrink-0" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        
                                        {employees.filter(e => e.name.toLowerCase().includes(assigneeSearchTerm.toLowerCase())).length === 0 && (
                                            <div className="py-8 text-center">
                                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">No members found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Priority Selector */}
                        <div className="relative w-fit">
                            <button
                            onClick={() => {
                                const wasOpen = isPrioritySelectorOpen;
                                closeAllDropdowns();
                                setPrioritySelectorOpen(!wasOpen);
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 h-9 border rounded-xl hover:shadow-sm transition-all duration-200
                                    ${priority === Priority.LOW ? 'bg-neutral-50 dark:bg-neutral-500/10 border-neutral-200 dark:border-neutral-500/20 text-neutral-600 dark:text-neutral-400' : ''}
                                    ${priority === Priority.MEDIUM ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400' : ''}
                                    ${priority === Priority.HIGH ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400' : ''}
                                    ${priority === Priority.URGENT ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400' : ''}
                                `}
                            >
                                <FlagIcon className={`w-4 h-4 
                                    ${priority === Priority.LOW ? 'text-neutral-500' : ''}
                                    ${priority === Priority.MEDIUM ? 'text-amber-500' : ''}
                                    ${priority === Priority.HIGH ? 'text-orange-500' : ''}
                                    ${priority === Priority.URGENT ? 'text-rose-500' : ''}
                                `} />
                                <span className="text-sm font-bold">Priority: {priority}</span>
                            </button>
                            {isPrioritySelectorOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#2A2A2D] border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                                    {(Object.values(Priority)).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => { setPriority(p); setPrioritySelectorOpen(false); }}
                                            className={`w-full text-left px-4 py-2 hover:bg-neutral-50 dark:hover:bg-white/5 text-sm font-bold flex items-center gap-3 transition-colors
                                                ${priority === p ? 'bg-neutral-50 dark:bg-white/5' : ''}
                                            `}
                                        >
                                            <FlagIcon className={`w-4 h-4 
                                                ${p === Priority.LOW ? 'text-neutral-500' : ''}
                                                ${p === Priority.MEDIUM ? 'text-amber-500' : ''}
                                                ${p === Priority.HIGH ? 'text-orange-500' : ''}
                                                ${p === Priority.URGENT ? 'text-rose-500' : ''}
                                            `} />
                                            <span className={`
                                                ${p === Priority.LOW ? 'text-neutral-600 dark:text-neutral-300' : ''}
                                                ${p === Priority.MEDIUM ? 'text-amber-600 dark:text-amber-400' : ''}
                                                ${p === Priority.HIGH ? 'text-orange-600 dark:text-orange-400' : ''}
                                                ${p === Priority.URGENT ? 'text-rose-600 dark:text-rose-400' : ''}
                                            `}>
                                                {p}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Date Picker Section - Flattened */}
                        <div className="relative w-fit">
                            <button
                                onClick={() => {
                                    const wasOpen = isCalendarOpen;
                                    closeAllDropdowns();
                                    setCalendarOpen(!wasOpen);
                                }}
                            className={`flex items-center gap-2 px-3 py-1.5 h-9 bg-white dark:bg-white/5 border rounded-xl hover:shadow-sm text-slate-800 dark:text-white transition-all duration-200 w-fit active:scale-95
                                    ${dueDate ? 'border-lime-400/50 shadow-sm' : 'border-neutral-200 dark:border-white/10 hover:border-lime-400 dark:hover:border-lime-400/50 hover:shadow-sm'}
                                `}
                        >
                                <CalendarIcon className={`w-4 h-4 ${dueDate ? 'text-lime-600 dark:text-lime-400' : ''}`} />
                                <span className="text-sm font-bold whitespace-nowrap">
                                    {dueDate ? format(new Date(dueDate), 'MMM d, yyyy') : 'Set Date'}
                                </span>
                            </button>
                            
                            {isCalendarOpen && (
                                <CalendarPicker
                                    selectedDate={dueDate}
                                    onSelect={(date) => {
                                        setDueDate(date);
                                        setCalendarOpen(false);
                                    }}
                                    onClear={() => {
                                        setDueDate('');
                                        setDueTime('');
                                        setCalendarOpen(false);
                                    }}
                                    onClose={() => setCalendarOpen(false)}
                                />
                            )}
                        </div>

                        {/* Due Time (Only visible if Date is set) - Flattened */}
                        {dueDate && (
                            <div
                                className="flex items-center gap-2 px-3 py-1.5 h-9 bg-white dark:bg-white/5 border border-lime-400/30 dark:border-lime-400/20 rounded-xl hover:border-lime-400 dark:hover:border-lime-400/50 hover:shadow-sm text-slate-800 dark:text-white transition-all duration-200 w-fit"
                            >
                                <ClockIcon className="w-4 h-4 text-lime-600 dark:text-lime-400" />
                                <input
                                    type="time"
                                    value={dueTime}
                                    onChange={(e) => setDueTime(e.target.value)}
                                    className="bg-transparent border-none text-sm font-bold focus:ring-0 p-0 text-slate-800 dark:text-white cursor-pointer [color-scheme:light] dark:[color-scheme:dark] w-20"
                                />
                            </div>
                        )}

                        {/* Recurrence Selector - Flattened */}
                        <div className="relative w-fit">
                        <button
                            onClick={() => {
                                const wasOpen = isRecurrenceSelectorOpen;
                                closeAllDropdowns();
                                setRecurrenceSelectorOpen(!wasOpen);
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 h-9 border rounded-xl hover:shadow-sm transition-all duration-200
                                    ${recurrence !== 'none' 
                                        ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' 
                                        : 'bg-white dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-500 hover:border-lime-400 dark:hover:border-lime-400/50'}
                                `}
                            >
                                <ArrowPathIcon className={`w-4 h-4 ${recurrence !== 'none' ? 'text-indigo-500' : 'text-neutral-400'}`} />
                                <span className="text-sm font-bold">
                                    {recurrence === 'none' ? 'Non-Recurring' : recurrence.charAt(0).toUpperCase() + recurrence.slice(1)}
                                </span>
                                <ChevronDownIcon className="w-3 h-3 ml-0.5 opacity-50" />
                            </button>

                            {isRecurrenceSelectorOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#2A2A2D] border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                                    {[
                                        { value: 'none', label: 'Non-Recurring' },
                                        { value: 'daily', label: 'Daily' },
                                        { value: 'weekly', label: 'Weekly' },
                                        { value: 'monthly', label: 'Monthly' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => { 
                                                setRecurrence(opt.value as any); 
                                                setRecurrenceSelectorOpen(false); 
                                            }}
                                            className={`w-full text-left px-4 py-2 hover:bg-neutral-50 dark:hover:bg-white/5 text-sm font-bold flex items-center gap-3 transition-colors
                                                ${recurrence === opt.value ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-500/5' : 'text-slate-700 dark:text-slate-200'}
                                            `}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${recurrence === opt.value ? 'bg-indigo-500' : 'bg-transparent'}`} />
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-neutral-400 dark:text-white/30 uppercase tracking-widest mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a description..."
                            rows={4}
                            className="w-full bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 rounded-2xl p-4 text-slate-700 dark:text-slate-300 placeholder:text-neutral-300 dark:placeholder:text-neutral-600 focus:ring-2 focus:ring-lime-400/40 dark:focus:ring-lime-400/20 focus:border-lime-400/50 transition-all resize-none"
                        />
                    </div>


                    {/* Subtasks (Simplified) */}
                    <div>
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Subtasks</label>
                        <div className="space-y-2">
                            {subtasks.map((st, index) => (
                                <div key={index} className="flex items-center gap-3 p-2 bg-neutral-50 dark:bg-black/20 rounded-lg group">
                                    <button
                                        onClick={() => {
                                            const newSubtasks = [...subtasks];
                                            newSubtasks[index].isCompleted = !newSubtasks[index].isCompleted;
                                            setSubtasks(newSubtasks);
                                        }}
                                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500
                                            ${st.isCompleted
                                                ? 'bg-green-500 border-green-500'
                                                : 'border-neutral-300 dark:border-neutral-600 hover:border-green-400 dark:hover:border-green-400 focus:border-green-400'
                                            }`}
                                    />
                                    <span className={`text-sm ${st.isCompleted ? 'line-through text-neutral-400' : 'text-slate-700 dark:text-slate-300'}`}>{st.title}</span>
                                    <button
                                        onClick={() => setSubtasks(subtasks.filter((_, i) => i !== index))}
                                        className="ml-auto text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <div className="flex items-center gap-2 text-neutral-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white">
                                <button
                                    onClick={handleAddSubtask}
                                    disabled={!newSubtaskTitle.trim()}
                                    className="p-1 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-md transition-colors disabled:opacity-50"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                                <input
                                    type="text"
                                    value={newSubtaskTitle}
                                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                    placeholder="Add subtask..."
                                    className="bg-transparent border-none focus:ring-0 text-sm p-0 w-full placeholder:text-neutral-400 text-slate-700 dark:text-slate-300"
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
                </div >

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between bg-neutral-50/50 dark:bg-white/[0.02]">
                    <div className="text-xs text-neutral-400 dark:text-white/20">
                        Press <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-white/10 rounded text-[10px] font-bold">Enter</kbd> to create
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5">
                            Cancel
                        </button>
                        <div className="relative group">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-400 blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none" />
                            <button
                                onClick={handleSave}
                                disabled={!title.trim()}
                                className="relative px-6 py-2.5 rounded-xl text-sm font-black overflow-hidden
                                    bg-gradient-to-r from-lime-400 via-emerald-400 to-lime-400
                                    text-black shadow-md shadow-lime-500/20
                                    hover:shadow-lg hover:shadow-lime-500/30 hover:scale-[1.04]
                                    active:scale-[0.97] transition-all duration-200
                                    disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none"
                            >
                                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none" />
                                {taskToEdit ? 'Save Changes' : 'Create Task'}
                            </button>
                        </div>
                    </div>
                </div>
            </div >

            {/* Custom Confirmation Modal */}
            {confirmMessage && (
                <div className="absolute inset-0 z-[70] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 rounded-2xl" onClick={cancelAssigneeToggle} />
                    <div className="bg-white dark:bg-[#2A2A2D] rounded-xl shadow-2xl p-6 max-w-sm w-full relative z-10 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-4 text-amber-500">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Action</h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
                            {confirmMessage}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={cancelAssigneeToggle}
                                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmAssigneeToggle}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default CreateTaskModal;
