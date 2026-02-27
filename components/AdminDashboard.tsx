import React, { useState } from 'react';
import { Task, Employee, TaskStatus, ActivityLog, Priority } from '../types';
import TaskStatusPieChart from './charts/TaskStatusPieChart';
import TasksPerEmployeeBarChart from './charts/TasksPerEmployeeBarChart';
import TaskPriorityBarChart from './charts/TaskPriorityBarChart';
import CompletionHistoryChart from './charts/CompletionHistoryChart';
import { SparklesIcon } from './icons/SparklesIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { FlagIcon } from './icons/FlagIcon';
import BentoCard from './BentoCard';
import { BoltIcon } from './icons/BoltIcon';
import { UsersIcon } from './icons/UsersIcon';

interface AdminDashboardProps {
    tasks: Task[];
    employees: Employee[];
    activityLogs: ActivityLog[];
    isAdmin?: boolean;
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ tasks, employees, activityLogs, isAdmin = true }) => {
    // Calculations
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: Task) => t.status === TaskStatus.DONE);
    const completionRate = totalTasks ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
    const overdueTasks = tasks.filter((t: Task) => new Date(t.dueDate) < new Date() && t.status !== TaskStatus.DONE);
    const criticalTasks = tasks.filter((t: Task) => t.priority === Priority.URGENT && t.status !== TaskStatus.DONE);

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
            {/* Header / Hero Section - Bento Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Main Status Card (Span 2) */}
                <BentoCard className="col-span-1 md:col-span-2 relative overflow-hidden group min-h-[320px] p-8 flex flex-col justify-between">
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

                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[0.9] mb-4">
                            Project{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-600">Velocity</span>
                        </h1>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 mt-8">
                        {/* Primary Stats */}
                        <div className="lg:w-1/3 flex flex-col gap-6 justify-end relative z-10 border-t border-white/5 pt-6 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-6">
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

                        {/* Quick Metric Cards Grid */}
                        <div className="lg:w-2/3 grid grid-cols-2 gap-4 relative z-10 border-t border-white/5 pt-6 lg:border-t-0 lg:pt-0 pl-0 lg:pl-6">
                            <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/40 dark:border-white/10 flex flex-col justify-between hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                                        <SparklesIcon className="w-5 h-5" />
                                    </div>
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">{tasksCreatedToday}</span>
                                </div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-white/40">Created Today</p>
                            </div>

                            <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/40 dark:border-white/10 flex flex-col justify-between hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
                                        <CheckCircleIcon className="w-5 h-5" />
                                    </div>
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">{tasksCompletedToday}</span>
                                </div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-white/40">Completed Today</p>
                            </div>

                            <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/40 dark:border-white/10 flex flex-col justify-between hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                        <UsersIcon className="w-5 h-5" />
                                    </div>
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">{activeAssignees}</span>
                                </div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-white/40">Active Assignees</p>
                            </div>

                            <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/40 dark:border-white/10 flex flex-col justify-between hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                                        <FlagIcon className="w-5 h-5" />
                                    </div>
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">{highPriorityActive}</span>
                                </div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-white/40">High Priority Active</p>
                            </div>
                        </div>
                    </div>
                </BentoCard>

                {/* 2. Critical Attention List (Span 1) */}
                <BentoCard className="col-span-1 p-0 flex flex-col h-full min-h-[320px]">
                    <div className="p-6 border-b border-white/5 bg-red-500/5 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                            <BoltIcon className="w-4 h-4" />
                            Critical Attention
                        </h3>
                        <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px] font-bold">
                            {criticalTasks.length + overdueTasks.length} Issues
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-none">
                        {[...criticalTasks, ...overdueTasks].slice(0, 5).map(task => (
                            <div key={task.id} className="group p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">{task.spaceId}</span>
                                    {new Date(task.dueDate) < new Date() && (
                                        <span className="text-[9px] font-bold text-red-400">OVERDUE</span>
                                    )}
                                </div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 line-clamp-1">{task.title}</h4>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${task.priority === Priority.URGENT ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-orange-500'}`}></div>
                                    <span className="text-[10px] font-medium text-slate-500 dark:text-white/60">
                                        Assigned to {employees.find(e => e.id === task.assigneeId)?.name || 'Unassigned'}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {criticalTasks.length === 0 && overdueTasks.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-white/20">
                                <CheckCircleIcon className="w-10 h-10 mb-2 opacity-50" />
                                <p className="text-xs font-bold uppercase tracking-wider">All Clear</p>
                            </div>
                        )}
                    </div>
                </BentoCard>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BentoCard className="h-[350px] p-6 flex flex-col">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">Task Distribution</h3>
                    <div className="flex-1 min-h-0">
                        <TaskStatusPieChart tasks={tasks} />
                    </div>
                </BentoCard>
                <BentoCard className="h-[350px] p-6 flex flex-col">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">Workload Layers</h3>
                    <div className="flex-1 min-h-0">
                        <TaskPriorityBarChart tasks={tasks} />
                    </div>
                </BentoCard>
            </div>
        </div>
    );
};

export default AdminDashboard;
