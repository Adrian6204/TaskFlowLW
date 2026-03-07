import React, { useState } from 'react';
import { Task, Employee, TaskStatus, ActivityLog, Priority } from '../types';

import CompletionHistoryChart from './charts/CompletionHistoryChart';
import { SparklesIcon } from './icons/SparklesIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { FlagIcon } from './icons/FlagIcon';
import BentoCard from './BentoCard';
import { BoltIcon } from './icons/BoltIcon';
import { UsersIcon } from './icons/UsersIcon';
import { isTaskOverdue } from '../utils/taskUtils';
import OverdueTasksModal from './OverdueTasksModal';

interface AdminDashboardProps {
    tasks: Task[];
    employees: Employee[];
    activityLogs: ActivityLog[];
    isAdmin?: boolean;
    onViewTask?: (task: Task) => void;
    onViewOverdueTask?: (task: Task) => void;
    isOverdueModalOpen?: boolean;
    setIsOverdueModalOpen?: (isOpen: boolean) => void;
}

const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const logDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - logDate.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    tasks,
    employees,
    activityLogs,
    isAdmin = true,
    onViewTask,
    onViewOverdueTask,
    isOverdueModalOpen: externalIsOverdueModalOpen,
    setIsOverdueModalOpen: externalSetIsOverdueModalOpen
}) => {
    // Calculations
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: Task) => t.status === TaskStatus.DONE);
    const completionRate = totalTasks ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
    const overdueTasks = tasks.filter((t: Task) => isTaskOverdue(t));
    const criticalTasks = tasks.filter((t: Task) => t.priority === Priority.URGENT && t.status !== TaskStatus.DONE);
    const [internalIsOverdueModalOpen, setInternalIsOverdueModalOpen] = useState(false);

    const isOverdueModalOpen = externalIsOverdueModalOpen !== undefined ? externalIsOverdueModalOpen : internalIsOverdueModalOpen;
    const setIsOverdueModalOpen = externalSetIsOverdueModalOpen !== undefined ? externalSetIsOverdueModalOpen : setInternalIsOverdueModalOpen;

    // New metrics calculations
    const today = new Date().toISOString().split('T')[0];
    const tasksCreatedToday = tasks.filter(t => t.createdAt.startsWith(today)).length;
    const tasksCompletedToday = tasks.filter(t => t.status === TaskStatus.DONE && t.completedAt?.startsWith(today)).length;
    const activeAssignees = new Set(tasks.filter(t => t.status !== TaskStatus.DONE && t.assigneeId).map(t => t.assigneeId)).size;
    const highPriorityActive = tasks.filter(t => (t.priority === Priority.HIGH || t.priority === Priority.URGENT) && t.status !== TaskStatus.DONE).length;

    // Calculate average completion time (mock calculation for demo)
    const avgCompletionTime = "2.5 Days";

    return (
        <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000">

            {/* Top Row — 4 Quick Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <BentoCard className="p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                            <SparklesIcon className="w-5 h-5" />
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{tasksCreatedToday}</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-white/40">Created Today</p>
                </BentoCard>

                <BentoCard className="p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-500/10 text-green-500 rounded-xl">
                            <CheckCircleIcon className="w-5 h-5" />
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{tasksCompletedToday}</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-white/40">Completed Today</p>
                </BentoCard>

                <BentoCard className="p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                            <UsersIcon className="w-5 h-5" />
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{activeAssignees}</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-white/40">Active Assignees</p>
                </BentoCard>

                <BentoCard className="p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl">
                            <FlagIcon className="w-5 h-5" />
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{highPriorityActive}</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-white/40">High Priority Active</p>
                </BentoCard>
            </div>

            {/* Second Row — Project Velocity + Critical Attention */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Main Status Card (Span 2) */}
                <BentoCard className="col-span-1 md:col-span-2 relative overflow-hidden group p-8 flex flex-col gap-4">
                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none">
                        <div className="w-64 h-64 rounded-full bg-gradient-to-br from-orange-400 to-pink-600 blur-[100px]"></div>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-[10px] uppercase tracking-widest font-bold text-primary-400">
                                Command Center
                            </span>
                            <span className="text-xs font-bold text-slate-400 dark:text-white/40 font-mono tracking-widest pl-2 border-l border-white/10">
                                SYSTEM ONLINE
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[0.9] mb-3">
                            Project{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-600">Velocity</span>
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-white/40 font-medium leading-relaxed max-w-md">
                            Real-time overview of your team's task throughput, progress, and critical bottlenecks across all active workloads.
                        </p>
                    </div>

                    {/* Completion Progress Bar */}
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-white/40">Overall Progress</span>
                            <span className="text-[10px] font-bold text-lime-500 dark:text-[#CEFD4A]">{completionRate}% complete</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-lime-400 to-emerald-500 transition-all duration-1000"
                                style={{ width: `${completionRate}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-[10px] text-slate-400 dark:text-white/30">{completedTasks.length} tasks done</span>
                            <span className="text-[10px] text-slate-400 dark:text-white/30">{totalTasks - completedTasks.length} remaining</span>
                        </div>
                    </div>

                    {/* Primary Stats - horizontal row */}
                    <div className="grid grid-cols-3 gap-6 border-t border-white/5 pt-4 relative z-10">
                        <div>
                            <p className="text-4xl font-black text-slate-900 dark:text-white">{totalTasks}</p>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-white/40">Total Active</p>
                        </div>
                        <div>
                            <p className="text-4xl font-black text-lime-500 dark:text-[#CEFD4A]">{completionRate}%</p>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-white/40">Completion Rate</p>
                        </div>
                        <div>
                            <p className="text-4xl font-black text-orange-500">{overdueTasks.length}</p>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-white/40">Critical Overdue</p>
                        </div>
                    </div>
                </BentoCard>

                {/* 2. Critical Attention — 3 stacked cards */}
                <div className="col-span-1 flex flex-col gap-3">

                    {/* Header card */}
                    <BentoCard className="p-4 flex items-center justify-between overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
                        <div className="flex items-center gap-2 relative z-10">
                            <div className="p-1.5 rounded-lg bg-red-500/10">
                                <BoltIcon className="w-3.5 h-3.5 text-red-400" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Critical Attention</h3>
                            <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 text-[10px] font-bold border border-red-500/20">
                                {criticalTasks.length + overdueTasks.length}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsOverdueModalOpen(true)}
                            className="relative z-10 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all hover:shadow-lg hover:shadow-red-500/25 shrink-0"
                        >
                            View All
                        </button>
                    </BentoCard>

                    {/* Task card helper */}
                    {[0, 1].map((idx) => {
                        const task = [...criticalTasks, ...overdueTasks][idx];
                        if (!task) return (
                            <BentoCard key={idx} className="p-4 flex-1 flex flex-col items-center justify-center gap-2 text-slate-300 dark:text-white/20">
                                <CheckCircleIcon className="w-7 h-7 opacity-40" />
                                <p className="text-[10px] font-bold uppercase tracking-wider">{idx === 0 ? 'All Clear' : 'No More Issues'}</p>
                            </BentoCard>
                        );

                        const assignee = employees.find(e => e.id === task.assigneeId);
                        const isUrgent = task.priority === Priority.URGENT;
                        const overdue = isTaskOverdue(task);
                        const priorityColor = isUrgent
                            ? 'bg-red-500'
                            : task.priority === Priority.HIGH
                                ? 'bg-orange-400'
                                : 'bg-yellow-400';
                        const priorityLabel = isUrgent ? 'Urgent' : task.priority === Priority.HIGH ? 'High' : 'Medium';
                        const priorityTextColor = isUrgent ? 'text-red-500 bg-red-500/10' : task.priority === Priority.HIGH ? 'text-orange-500 bg-orange-500/10' : 'text-yellow-600 bg-yellow-500/10';

                        return (
                            <BentoCard
                                key={task.id}
                                className="flex-1 cursor-pointer overflow-hidden transition-all hover:shadow-md group p-4 flex flex-col gap-2"
                                onClick={() => onViewTask && onViewTask(task)}
                            >
                                {/* Top row: priority badge + overdue badge */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityTextColor}`}>
                                        {priorityLabel}
                                    </span>
                                    {overdue && (
                                        <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                            OVERDUE
                                        </span>
                                    )}
                                </div>

                                {/* Task title */}
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-primary-500 transition-colors">
                                    {task.title}
                                </h4>

                                {/* Assignee row */}
                                <div className="flex items-center gap-2 mt-auto">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 dark:from-white/20 dark:to-white/10 flex items-center justify-center shrink-0">
                                        <span className="text-[9px] font-black text-white">
                                            {assignee?.name?.charAt(0).toUpperCase() || '?'}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-medium text-slate-500 dark:text-white/50 line-clamp-1">
                                        {assignee?.name || 'Unassigned'}
                                    </span>
                                </div>
                            </BentoCard>
                        );
                    })}

                </div>
            </div>

            {/* Simple Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BentoCard className="p-6 flex flex-col">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">Task Status</h3>
                    <div className="grid grid-cols-3 gap-4 flex-1">
                        <div className="bg-white dark:bg-white/5 rounded-xl p-4 flex flex-col justify-between border border-slate-100 dark:border-white/5 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To Do</span>
                            <span className="text-3xl font-black text-orange-500 mt-2">{tasks.filter(t => t.status === TaskStatus.TODO).length}</span>
                        </div>
                        <div className="bg-white dark:bg-white/5 rounded-xl p-4 flex flex-col justify-between border border-slate-100 dark:border-white/5 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Progress</span>
                            <span className="text-3xl font-black text-indigo-500 mt-2">{tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length}</span>
                        </div>
                        <div className="bg-white dark:bg-white/5 rounded-xl p-4 flex flex-col justify-between border border-slate-100 dark:border-white/5 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Done</span>
                            <span className="text-3xl font-black text-emerald-500 mt-2">{tasks.filter(t => t.status === TaskStatus.DONE).length}</span>
                        </div>
                    </div>
                </BentoCard>

                <BentoCard className="p-6 flex flex-col">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">Active Priorities</h3>
                    <div className="grid grid-cols-4 gap-3 flex-1">
                        <div className="bg-white dark:bg-white/5 rounded-xl p-3 flex flex-col justify-between border border-slate-100 dark:border-white/5 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Urgent</span>
                            <span className="text-2xl font-black text-red-500 mt-2">{tasks.filter(t => t.status !== TaskStatus.DONE && t.priority === Priority.URGENT).length}</span>
                        </div>
                        <div className="bg-white dark:bg-white/5 rounded-xl p-3 flex flex-col justify-between border border-slate-100 dark:border-white/5 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">High</span>
                            <span className="text-2xl font-black text-orange-500 mt-2">{tasks.filter(t => t.status !== TaskStatus.DONE && t.priority === Priority.HIGH).length}</span>
                        </div>
                        <div className="bg-white dark:bg-white/5 rounded-xl p-3 flex flex-col justify-between border border-slate-100 dark:border-white/5 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Med</span>
                            <span className="text-2xl font-black text-indigo-500 mt-2">{tasks.filter(t => t.status !== TaskStatus.DONE && t.priority === Priority.MEDIUM).length}</span>
                        </div>
                        <div className="bg-white dark:bg-white/5 rounded-xl p-3 flex flex-col justify-between border border-slate-100 dark:border-white/5 shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low</span>
                            <span className="text-2xl font-black text-slate-500 mt-2">{tasks.filter(t => t.status !== TaskStatus.DONE && t.priority === Priority.LOW).length}</span>
                        </div>
                    </div>
                </BentoCard>
            </div>

            <OverdueTasksModal
                isOpen={isOverdueModalOpen}
                onClose={() => setIsOverdueModalOpen(false)}
                tasks={tasks}
                employees={employees}
                onViewTask={(task) => {
                    if (onViewOverdueTask) {
                        onViewOverdueTask(task);
                    } else if (onViewTask) {
                        onViewTask(task);
                    }
                }}
            />
        </div>
    );
};

export default AdminDashboard;
