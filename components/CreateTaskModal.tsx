
import React, { useState, useEffect, useRef } from 'react';
import { Task, Space, Employee, Priority, TaskStatus, List, Subtask } from '../types';
import { UserIcon } from './icons/UserIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { TagIcon } from './icons/TagIcon';
import { FlagIcon } from './icons/FlagIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { PlusIcon } from './icons/PlusIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { ClockIcon } from './icons/ClockIcon';

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
    const dateInputRef = useRef<HTMLInputElement>(null);

    // UI States
    const [isSpaceSelectorOpen, setSpaceSelectorOpen] = useState(false);
    const [isListSelectorOpen, setListSelectorOpen] = useState(false);
    const [isAssigneeSelectorOpen, setAssigneeSelectorOpen] = useState(false);
    const [isPrioritySelectorOpen, setPrioritySelectorOpen] = useState(false);

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

    const handleAssigneeToggle = (id: string) => {
        if (!isSuperAdmin) {
            setAssigneeIds([id]);
            setAssigneeSelectorOpen(false);
            return;
        }

        if (assigneeIds.includes(id)) {
            setAssigneeIds(prev => prev.filter(aId => aId !== id));
        } else {
            setAssigneeIds(prev => [...prev, id]);
        }
    };

    return (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${show ? 'visible' : 'invisible'}`}>
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            <div className={`bg-white dark:bg-[#1E1E1E] w-full max-w-4xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] transition-all duration-300 transform ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                {/* Header / Breadcrumb */}
                <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        {/* Space Selector Trigger */}
                        <div className="relative">
                            <button
                                onClick={() => setSpaceSelectorOpen(!isSpaceSelectorOpen)}
                                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
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
                                onClick={() => setListSelectorOpen(!isListSelectorOpen)}
                                className={`flex items-center gap-2 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors ${!currentList ? 'text-neutral-400' : 'text-slate-700 dark:text-slate-200'}`}
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

                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-700">
                    {/* Title */}
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Task name"
                        className="w-full bg-transparent text-3xl font-bold text-slate-900 dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-700 border-none focus:ring-0 p-0 mb-6"
                        autoFocus
                    />

                    {/* Attributes Bar */}
                    <div className="flex flex-wrap items-center gap-4 mb-8">
                        {/* Status (Read-only for now or simple badge) */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-white/5 rounded-full text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                            <div className={`w-2 h-2 rounded-full ${status === TaskStatus.TODO ? 'bg-slate-400' : status === TaskStatus.IN_PROGRESS ? 'bg-primary-500' : 'bg-green-500'}`} />
                            {status}
                        </div>

                        {/* Assignee Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setAssigneeSelectorOpen(!isAssigneeSelectorOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-full hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
                            >
                                <UserIcon className="w-4 h-4 text-neutral-400" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {selectedAssignees.length === 0 ? 'Unassigned' : selectedAssignees.length === 1 ? selectedAssignees[0].name : `${selectedAssignees.length} Assignees`}
                                </span>
                            </button>
                            {/* Simplified Assignee Dropdown */}
                            {isAssigneeSelectorOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#2A2A2D] border border-neutral-200 dark:border-white/10 rounded-xl shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                                    {employees.map(e => {
                                        const isSelected = assigneeIds.includes(e.id);
                                        return (
                                            <button
                                                key={e.id}
                                                onClick={() => handleAssigneeToggle(e.id)}
                                                className={`w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-white/5 text-sm flex items-center justify-between gap-2 ${isSelected ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10' : 'text-slate-700 dark:text-slate-200'}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <img src={e.avatarUrl} className="w-5 h-5 rounded-full" />
                                                    {e.name}
                                                </div>
                                                {isSelected && <span className="text-xs">✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Priority Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setPrioritySelectorOpen(!isPrioritySelectorOpen)}
                                className={`flex items-center gap-2 px-3 py-1.5 border border-transparent rounded-full hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors
                            ${priority === Priority.HIGH ? 'text-red-500 bg-red-500/10' : priority === Priority.MEDIUM ? 'text-yellow-500 bg-yellow-500/10' : 'text-primary-500 bg-primary-500/10'}
                        `}
                            >
                                <FlagIcon className="w-4 h-4" />
                                <span className="text-sm font-bold">{priority}</span>
                            </button>
                            {isPrioritySelectorOpen && (
                                <div className="absolute top-full left-0 mt-2 w-32 bg-white dark:bg-[#2A2A2D] border border-neutral-200 dark:border-white/10 rounded-xl shadow-xl z-50 py-1">
                                    {([Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT] as Priority[]).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => { setPriority(p); setPrioritySelectorOpen(false); }}
                                            className={`w-full text-left px-4 py-2 hover:bg-neutral-100 dark:hover:bg-white/5 text-sm font-bold
                                        ${p === Priority.HIGH || p === Priority.URGENT ? 'text-red-500' : p === Priority.MEDIUM ? 'text-yellow-500' : 'text-primary-500'}
                                    `}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center gap-2">
                            <div
                                className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-full hover:bg-neutral-50 dark:hover:bg-white/5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer relative group"
                                onClick={() => dateInputRef.current?.showPicker()}
                            >
                                <CalendarIcon className="w-4 h-4" />
                                <input
                                    ref={dateInputRef}
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => {
                                        setDueDate(e.target.value);
                                        if (!e.target.value) setDueTime(''); // Clear time if date is cleared
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-[1px] h-[1px]"
                                    style={{ pointerEvents: 'none' }}
                                />
                                <span className="text-sm font-medium">{dueDate || 'Set Date'}</span>
                            </div>

                            {/* Due Time (Only visible if Date is set) */}
                            {dueDate && (
                                <div
                                    className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-full hover:bg-neutral-50 dark:hover:bg-white/5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer relative group"
                                >
                                    <ClockIcon className="w-4 h-4" />
                                    <input
                                        type="time"
                                        value={dueTime}
                                        onChange={(e) => setDueTime(e.target.value)}
                                        className="bg-transparent border-none text-sm font-medium focus:ring-0 p-0 text-slate-700 dark:text-slate-300 cursor-pointer"
                                    />
                                </div>
                            )}

                            {/* Recurrence Selector */}
                            <div className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-full hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors relative">
                                <select
                                    value={recurrence}
                                    onChange={(e) => setRecurrence(e.target.value as 'none' | 'daily' | 'weekly' | 'monthly')}
                                    className="bg-transparent border-none text-sm font-medium focus:ring-0 p-0 text-neutral-500 cursor-pointer outline-none w-auto pr-6"
                                >
                                    <option value="none">Non-Recurring</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>

                    </div>

                    {/* Description */}
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a description..."
                            rows={4}
                            className="w-full bg-neutral-50 dark:bg-black/20 border border-neutral-200 dark:border-white/10 rounded-xl p-4 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white/20 focus:border-transparent transition-all"
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
                < div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-black/20" >
                    <div className="text-xs text-neutral-400">
                        Press <span className="font-bold">Enter</span> to create
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!title.trim()}
                            className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
                        >
                            Create Task
                        </button>
                    </div>
                </div >
            </div >
        </div >
    );
};

export default CreateTaskModal;
