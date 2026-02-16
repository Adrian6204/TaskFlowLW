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
import { PlusIcon } from './icons/PlusIcon';
import { BoltIcon } from './icons/BoltIcon';

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
                            <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] uppercase tracking-widest font-bold text-purple-400">
                                Command Center
                            </span>
                            <span className="text-xs font-bold text-slate-400 dark:text-white/40 font-mono tracking-widest pl-2 border-l border-white/10">
                                SYSTEM ONLINE
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[0.9] mb-4">
                            Project <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-600">Velocity</span>
                        </h1>
                    </div>

                    <div className="grid grid-cols-3 gap-8 relative z-10 mt-8">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Visuals */}
                <div className="lg:col-span-2 space-y-6">
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
                    {isAdmin && (
                        <BentoCard className="p-6">
                            <h3 className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">Historical Momentum</h3>
                            <div className="h-[300px]">
                                <CompletionHistoryChart tasks={tasks} />
                            </div>
                        </BentoCard>
                    )}
                </div>

                {/* Right Column - Activity Feed */}
                <BentoCard className="col-span-1 p-0 flex flex-col h-full max-h-[724px]">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Live Activity</h3>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
                        {activityLogs.slice(0, 20).map((log) => (
                            <div key={log.id} className="flex gap-4 items-start group">
                                <div className="relative flex-shrink-0 mt-1">
                                    <img src={log.user.avatarUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-black rounded-full flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-lime-500 rounded-full"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">{log.user.name}</span>
                                        <span className="text-[9px] text-slate-500 dark:text-white/30 font-bold uppercase tracking-wide">{getRelativeTime(log.timestamp)}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed">
                                        {log.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </BentoCard>
            </div>

            {/* Squad Overview Grid */}
            <div>
                <div className="flex items-center gap-4 mb-6 px-2">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Squad Overview</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map(employee => {
                        const employeeTasks = tasks.filter((t: Task) => t.assigneeId === employee.id && t.status !== TaskStatus.DONE);

                        return (
                            <BentoCard key={employee.id} className="p-0 flex flex-col group overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                                    <div className="flex items-center gap-4">
                                        <img src={employee.avatarUrl} alt={employee.name} className="w-10 h-10 rounded-xl object-cover" />
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{employee.name}</p>
                                            <p className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider">{employeeTasks.length} Active Tasks</p>
                                        </div>
                                    </div>
                                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-lime-500/10 text-lime-600 dark:text-[#CEFD4A] hover:bg-lime-500 hover:text-black transition-all">
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="p-4 flex-1 space-y-2 min-h-[160px] max-h-[300px] overflow-y-auto scrollbar-none">
                                    {employeeTasks.length > 0 ? (
                                        employeeTasks.map((task: Task) => (
                                            <div key={task.id} className="p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-all group/item cursor-pointer">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-xs font-bold text-slate-800 dark:text-white/90 line-clamp-1">{task.title}</p>
                                                    {task.priority === Priority.URGENT && <BoltIcon className="w-3 h-3 text-red-500" />}
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-500/10 text-slate-400'
                                                        }`}>{task.status}</span>
                                                    {task.dueDate && (
                                                        <span className="text-[9px] font-bold text-slate-400 dark:text-white/30 flex items-center gap-1">
                                                            <ClockIcon className="w-3 h-3" />
                                                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-white/20 py-8">
                                            <CheckCircleIcon className="w-8 h-8 mb-2 opacity-30" />
                                            <p className="text-[9px] font-bold uppercase tracking-wider">All Set</p>
                                        </div>
                                    )}
                                </div>
                            </BentoCard>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
