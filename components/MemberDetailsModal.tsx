
import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Employee, Task, TaskStatus, Priority } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface MemberDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: Employee;
    tasks: Task[];
    onViewTask: (task: Task) => void;
}

const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
    isOpen,
    onClose,
    member,
    tasks,
    onViewTask,
}) => {
    // Filter tasks for this member
    const memberTasks = useMemo(() => {
        return tasks.filter(t => t.assigneeId === member.id);
    }, [tasks, member.id]);

    // Calculate stats
    const stats = useMemo(() => {
        return {
            total: memberTasks.length,
            completed: memberTasks.filter(t => t.status === TaskStatus.DONE).length,
            inProgress: memberTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
            pending: memberTasks.filter(t => t.status === TaskStatus.TODO).length,
        };
    }, [memberTasks]);

    // Sort tasks: In Progress -> Pending -> Done
    const sortedTasks = useMemo(() => {
        return [...memberTasks].sort((a, b) => {
            const statusOrder = { [TaskStatus.IN_PROGRESS]: 0, [TaskStatus.TODO]: 1, [TaskStatus.DONE]: 2 };
            return statusOrder[a.status] - statusOrder[b.status];
        });
    }, [memberTasks]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-[40px] overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[85vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header / Profile Section */}
                <div className="p-8 bg-slate-50 dark:bg-white/5 border-b border-black/5 dark:border-white/5 flex flex-col md:flex-row items-center gap-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full bg-black/5 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>

                    <div className="relative shrink-0">
                        <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-[#2A2A2D] shadow-lg"
                        />
                        {/* Status dot could go here if we had online status */}
                    </div>

                    <div className="text-center md:text-left flex-1 min-w-0">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white truncate">{member.name}</h2>
                        <div className="flex flex-col md:flex-row items-center gap-2 mt-1 flex-wrap justify-center md:justify-start">
                            <span className="text-sm font-bold text-slate-500 dark:text-white/40 truncate max-w-[200px] md:max-w-xs">{member.email}</span>
                            <span className="hidden md:inline text-slate-300 dark:text-white/20">•</span>
                            <span className="px-2 py-0.5 rounded-md bg-lime-500/10 dark:bg-[#CEFD4A]/10 text-lime-600 dark:text-[#CEFD4A] text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                                {member.id === 'emp-1' ? 'Owner' : 'Member'}
                                {/* Fallback role logic or pass plain role if available in Employee */}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-4 md:gap-8">
                        <div className="text-center">
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">Total</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-lime-600 dark:text-[#CEFD4A]">{stats.completed}</p>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">Done</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-black text-blue-500 dark:text-blue-400">{stats.inProgress}</p>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">Active</p>
                        </div>
                    </div>
                </div>

                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                    <div className="p-6 md:p-8">
                        <h3 className="text-sm font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-6">Assigned Tasks</h3>

                        {sortedTasks.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 dark:bg-white/5 rounded-[20px] border border-dashed border-slate-200 dark:border-white/10">
                                <CheckCircleIcon className="w-10 h-10 text-slate-300 dark:text-white/20 mx-auto mb-3" />
                                <p className="text-slate-400 dark:text-white/30 font-bold">No tasks assigned yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {sortedTasks.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => onViewTask(task)}
                                        className="group flex items-center gap-4 p-4 bg-white dark:bg-black/20 border border-slate-100 dark:border-white/5 hover:border-lime-500/30 dark:hover:border-[#CEFD4A]/30 rounded-[20px] transition-all cursor-pointer shadow-sm hover:shadow-md"
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${task.status === TaskStatus.DONE
                                            ? 'bg-lime-500/10 border-lime-500/20 text-lime-600 dark:text-[#CEFD4A]'
                                            : task.status === TaskStatus.IN_PROGRESS
                                                ? 'border-blue-500 text-blue-500'
                                                : 'border-slate-200 dark:border-white/10 text-transparent'
                                            }`}>
                                            {task.status === TaskStatus.DONE && <CheckCircleIcon className="w-5 h-5" />}
                                            {task.status === TaskStatus.IN_PROGRESS && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className={`text-base font-bold truncate pr-4 ${task.status === TaskStatus.DONE ? 'text-slate-400 dark:text-white/40 line-through' : 'text-slate-900 dark:text-white'}`}>
                                                    {task.title}
                                                </h4>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${task.priority === Priority.URGENT ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' :
                                                    task.priority === Priority.HIGH ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' :
                                                        task.priority === Priority.MEDIUM ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' :
                                                            'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/40'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-white/40 font-medium">
                                                <span className="uppercase tracking-wider">{task.spaceId}</span>
                                                <span>•</span>
                                                <div className="flex items-center gap-1">
                                                    <ClockIcon className="w-3.5 h-3.5" />
                                                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                                            <span className="text-2xl text-slate-300 dark:text-white/20">&rarr;</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default MemberDetailsModal;
