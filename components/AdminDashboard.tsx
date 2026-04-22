
import React, { useState } from 'react';
import { Task, Employee, TaskStatus, ActivityLog, Priority } from '../types';
import TaskStatusStackedBar from './charts/TaskStatusStackedBar';
import TaskPriorityHorizontalBar from './charts/TaskPriorityHorizontalBar';
import ThroughputChart from './charts/ThroughputChart';
import LeadTimeChart from './charts/LeadTimeChart';
import MemberEfficiencyChart from './charts/MemberEfficiencyChart';
import WorkloadHealth from './charts/WorkloadHealth';
import TaskAgingChart from './charts/TaskAgingChart';
import { SparklesIcon } from './icons/SparklesIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { FlagIcon } from './icons/FlagIcon';
import DashboardCard from './DashboardCard';
import { BoltIcon } from './icons/BoltIcon';
import { UsersIcon } from './icons/UsersIcon';
import { isTaskOverdue } from '../utils/taskUtils';
import OverdueTasksModal from './OverdueTasksModal';
import { TASK_STATUS_CONFIG } from '../constants/taskStatusConfig';

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

    // Period-specific metrics
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

    return (
        <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000 pt-safe-top">

            {/* Top Row — 4 Quick Metric Cards */}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <DashboardCard className="p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 ${TASK_STATUS_CONFIG[TaskStatus.TODO].faint} ${TASK_STATUS_CONFIG[TaskStatus.TODO].text} rounded-xl`}>
                            <SparklesIcon className="w-5 h-5" />
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{periodCreated}</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-white/40">
                        {timeRange === 'today' ? 'Created Today' : timeRange === 'all' ? 'Total Created' : 'Created in Period'}
                    </p>
                </DashboardCard>

                <DashboardCard className="p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 ${TASK_STATUS_CONFIG[TaskStatus.DONE].faint} ${TASK_STATUS_CONFIG[TaskStatus.DONE].text} rounded-xl`}>
                            <CheckCircleIcon className="w-5 h-5" />
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{periodCompleted}</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-white/40">
                        {timeRange === 'today' ? 'Completed Today' : timeRange === 'all' ? 'Total Completed' : 'Completed in Period'}
                    </p>
                </DashboardCard>

                <DashboardCard className="p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 ${TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].faint} ${TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].text} rounded-xl`}>
                            <UsersIcon className="w-5 h-5" />
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{activeAssignees}</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-white/40">Active Assignees</p>
                </DashboardCard>

                <DashboardCard className="p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl">
                            <FlagIcon className="w-5 h-5" />
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{highPriorityActive}</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-white/40">High Priority Active</p>
                </DashboardCard>
            </div>

            {/* Second Row — Project Progress + Critical Attention */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Main Status Card (Span 2) */}
                <DashboardCard className="col-span-1 md:col-span-2 relative overflow-hidden group p-8 flex flex-col gap-4">
                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none">
                        <div className={`w-64 h-64 rounded-full bg-gradient-to-br from-[#FFB347] to-[#046241] blur-[100px]`} />
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
                        <div className="flex flex-wrap items-center gap-1 mb-6 bg-black/10 dark:bg-white/5 p-1 rounded-xl w-fit">
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

                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[0.9] mb-3">
                            Project{' '}
                            <span className={`text-transparent bg-clip-text bg-gradient-to-r from-[#FFB347] to-[#046241]`}>Performance</span>
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-white/40 font-medium leading-relaxed max-w-md">
                            Real-time overview of your team's task throughput, progress, and critical bottlenecks across all active workloads.
                        </p>
                    </div>

                    {/* Completion Progress Bar */}
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-white/40">Overall Progress</span>
                            <span className={`text-[10px] font-bold ${TASK_STATUS_CONFIG[TaskStatus.DONE].text}`}>{completionRate}% complete</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r from-[#FFB347] to-[#10b981] transition-all duration-1000`}
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
                            <p className={`text-4xl font-black ${TASK_STATUS_CONFIG[TaskStatus.DONE].text}`}>{completionRate}%</p>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-white/40">Completion Rate</p>
                        </div>
                        <div>
                            <p className="text-4xl font-black text-orange-500">{overdueTasks.length}</p>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-white/40">Critical Overdue</p>
                        </div>
                    </div>
                </DashboardCard>

                {/* 2. Critical Attention — 3 stacked cards */}
                <div className="col-span-1 flex flex-col gap-3">

                    {/* Header card */}
                    <DashboardCard className="p-4 flex items-center justify-between overflow-hidden relative">
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
                    </DashboardCard>

                    {/* Task card helper */}
                    {[0, 1].map((idx) => {
                        const task = [...criticalTasks, ...overdueTasks][idx];
                        if (!task) return (
                            <DashboardCard key={idx} className="p-4 flex-1 flex flex-col items-center justify-center gap-2 text-slate-300 dark:text-white/20">
                                <CheckCircleIcon className="w-7 h-7 opacity-40" />
                                <p className="text-[10px] font-bold uppercase tracking-wider">{idx === 0 ? 'All Clear' : 'No More Issues'}</p>
                            </DashboardCard>
                        );

                        const assignee = employees.find(e => e.id === task.assigneeId);
                        const isUrgent = task.priority === Priority.URGENT;
                        const overdue = isTaskOverdue(task);
                        const priorityTextColor = isUrgent ? 'text-red-500 bg-red-500/10' : task.priority === Priority.HIGH ? 'text-orange-500 bg-orange-500/10' : 'text-yellow-600 bg-yellow-500/10';
                        const priorityLabel = isUrgent ? 'Urgent' : task.priority === Priority.HIGH ? 'High' : 'Medium';

                        return (
                            <DashboardCard
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
                            </DashboardCard>
                        );
                    })}

                </div>
            </div>

            {/* Analytics Section — 2x2 Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Throughput Trend */}
                <DashboardCard className="p-6 flex flex-col min-h-[320px]">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Project Throughput</h3>
                            <p className="text-[10px] text-slate-500 dark:text-white/20 font-medium">Created vs. Completed (Last 7 Days)</p>
                        </div>
                    </div>
                    <div className="flex-1">
                        <ThroughputChart tasks={filteredTasks} />
                    </div>
                </DashboardCard>

                {/* 2. Workload Health */}
                <div className="min-h-[320px]">
                    <WorkloadHealth tasks={filteredTasks} />
                </div>

                {/* 3. Member Allocation Efficiency */}
                <DashboardCard className="p-6 flex flex-col min-h-[320px]">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Team Workload Balance</h3>
                            <p className="text-[10px] text-slate-500 dark:text-white/20 font-medium">Active vs. Completed tasks per member</p>
                        </div>
                    </div>
                    <div className="flex-1">
                        <MemberEfficiencyChart tasks={filteredTasks} employees={employees} />
                    </div>
                </DashboardCard>

                {/* 4. Speed & Priority Analysis */}
                <DashboardCard className="p-6 flex flex-col min-h-[320px]">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Priority Turnaround</h3>
                            <p className="text-[10px] text-slate-500 dark:text-white/20 font-medium">Average days to completion by priority</p>
                        </div>
                    </div>
                    <div className="flex-1">
                        <LeadTimeChart tasks={filteredTasks} />
                    </div>
                </DashboardCard>
            </div>

            {/* Minor Charts Footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCard className="p-6 flex flex-col min-h-[280px]">
                    <div className="mb-4">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Task Aging</h3>
                        <p className="text-[10px] text-slate-400 dark:text-white/20 font-medium mt-0.5">Bottlenecks by age</p>
                    </div>
                    <div className="flex-1 min-h-0">
                        <TaskAgingChart tasks={filteredTasks} />
                    </div>
                </DashboardCard>
                <DashboardCard className="p-6 flex flex-col min-h-[280px]">
                    <div className="mb-4">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Detailed Status</h3>
                        <p className="text-[10px] text-slate-400 dark:text-white/20 font-medium mt-0.5">Tasks by current state</p>
                    </div>
                    <div className="flex-1 min-h-0">
                        <TaskStatusStackedBar tasks={filteredTasks} />
                    </div>
                </DashboardCard>
                <DashboardCard className="p-6 flex flex-col min-h-[280px]">
                    <div className="mb-4">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Priority Volume</h3>
                        <p className="text-[10px] text-slate-400 dark:text-white/20 font-medium mt-0.5">Active tasks by priority</p>
                    </div>
                    <div className="flex-1 min-h-0">
                        <TaskPriorityHorizontalBar tasks={filteredTasks} />
                    </div>
                </DashboardCard>
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
