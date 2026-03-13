import React, { useState } from 'react';
import { Task, Employee, TaskStatus, ActivityLog, Priority } from '../types';
import TaskStatusStackedBar from './charts/TaskStatusStackedBar';
import TaskPriorityHorizontalBar from './charts/TaskPriorityHorizontalBar';
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

type TimeRange = 'today' | 'weekly' | 'monthly' | 'yearly' | 'all';

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
    const [timeRange, setTimeRange] = React.useState<TimeRange>('all');
    
    // Filtering logic based on timeRange
    const { filteredTasks, periodStart, periodEnd } = React.useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        let start = 0;
        let end = now.getTime() + (100 * 365 * oneDayMs); // Far future
        
        if (timeRange === 'today') {
            start = startOfToday;
            end = startOfToday + oneDayMs;
        } else if (timeRange === 'weekly') {
            start = now.getTime() - 7 * oneDayMs;
        } else if (timeRange === 'monthly') {
            start = now.getTime() - 30 * oneDayMs;
        } else if (timeRange === 'yearly') {
            start = now.getTime() - 365 * oneDayMs;
        }
        
        if (timeRange === 'all') {
            return { filteredTasks: tasks, periodStart: 0, periodEnd: end };
        }

        const filtered = tasks.filter(t => {
            const dueDate = t.dueDate ? new Date(t.dueDate).getTime() : null;
            const createdAt = new Date(t.createdAt).getTime();
            const completedAt = t.completedAt ? new Date(t.completedAt).getTime() : null;
            
            // Period includes any task with a significant event (due, created, or completed) in the window
            return (dueDate && dueDate >= start && dueDate < end) ||
                   (createdAt >= start && createdAt < end) ||
                   (completedAt && completedAt >= start && completedAt < end);
        });

        return { filteredTasks: filtered, periodStart: start, periodEnd: end };
    }, [tasks, timeRange]);

    // Calculations using filteredTasks
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter((t: Task) => t.status === TaskStatus.DONE);
    const completionRate = totalTasks ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
    const overdueTasks = filteredTasks.filter((t: Task) => isTaskOverdue(t));
    const criticalTasks = filteredTasks.filter((t: Task) => t.priority === Priority.URGENT && t.status !== TaskStatus.DONE);
    const [internalIsOverdueModalOpen, setInternalIsOverdueModalOpen] = useState(false);

    const isOverdueModalOpen = externalIsOverdueModalOpen !== undefined ? externalIsOverdueModalOpen : internalIsOverdueModalOpen;
    const setIsOverdueModalOpen = externalSetIsOverdueModalOpen !== undefined ? externalSetIsOverdueModalOpen : setInternalIsOverdueModalOpen;

    // Period-specific metrics (Precise)
    const periodCreated = filteredTasks.filter(t => {
        const createdAt = new Date(t.createdAt).getTime();
        return createdAt >= periodStart && createdAt < periodEnd;
    }).length;

    const periodCompleted = filteredTasks.filter(t => {
        const completedAt = t.completedAt ? new Date(t.completedAt).getTime() : null;
        return completedAt && completedAt >= periodStart && completedAt < periodEnd;
    }).length;

    const activeAssignees = new Set(filteredTasks.filter(t => t.status !== TaskStatus.DONE && t.assigneeId).map(t => t.assigneeId)).size;
    const highPriorityActive = filteredTasks.filter(t => (t.priority === Priority.HIGH || t.priority === Priority.URGENT) && t.status !== TaskStatus.DONE).length;

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
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{periodCreated}</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-white/40">
                        {timeRange === 'today' ? 'Created Today' : timeRange === 'all' ? 'Total Created' : 'Created in Period'}
                    </p>
                </BentoCard>

                <BentoCard className="p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-500/10 text-green-500 rounded-xl">
                            <CheckCircleIcon className="w-5 h-5" />
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{periodCompleted}</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-white/40">
                        {timeRange === 'today' ? 'Completed Today' : timeRange === 'all' ? 'Total Completed' : 'Completed in Period'}
                    </p>
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
                                Filter By
                            </span>
                            <span className="text-xs font-bold text-slate-400 dark:text-white/40 font-mono tracking-widest pl-2 border-l border-white/10">
                                SYSTEM ONLINE
                            </span>
                        </div>

                        {/* Time Range Selector */}
                        <div className="flex items-center gap-1 mb-6 bg-black/10 dark:bg-white/5 p-1 rounded-xl w-fit">
                            {(['today', 'weekly', 'monthly', 'yearly', 'all'] as TimeRange[]).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                        timeRange === range
                                            ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/60'
                                    }`}
                                >
                                    {range}
                                </button>
                            ))}
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

            {/* Recommended Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BentoCard className="p-6 flex flex-col min-h-[200px]">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">Task Status</h3>
                    <div className="flex-1">
                        <TaskStatusStackedBar tasks={filteredTasks} />
                    </div>
                </BentoCard>

                <BentoCard className="p-6 flex flex-col min-h-[200px]">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">Active Priorities</h3>
                    <div className="flex-1">
                        <TaskPriorityHorizontalBar tasks={filteredTasks} />
                    </div>
                </BentoCard>
            </div>

            <OverdueTasksModal
                isOpen={isOverdueModalOpen}
                onClose={() => setIsOverdueModalOpen(false)}
                tasks={filteredTasks}
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
