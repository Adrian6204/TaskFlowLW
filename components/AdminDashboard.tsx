
import React, { useState } from 'react';
import { Task, Employee, TaskStatus, ActivityLog } from '../types';
import TaskStatusPieChart from './charts/TaskStatusPieChart';
import TasksPerEmployeeBarChart from './charts/TasksPerEmployeeBarChart';
import TaskPriorityBarChart from './charts/TaskPriorityBarChart';
import CompletionHistoryChart from './charts/CompletionHistoryChart';
import { generateWeeklySummary } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { FlagIcon } from './icons/FlagIcon';

interface AdminDashboardProps {
    tasks: Task[];
    employees: Employee[];
    activityLogs: ActivityLog[];
    isAdmin?: boolean;
}

// Reusable Dashboard Card Component
const DashboardCard: React.FC<{ title: string; children: React.ReactNode; className?: string; action?: React.ReactNode }> = ({ title, children, className = '', action }) => (
    <div className={`bg-white/60 dark:bg-black/20 backdrop-blur-[40px] border border-white/40 dark:border-white/5 rounded-[32px] p-8 flex flex-col shadow-xl shadow-black/5 dark:shadow-black/40 ${className}`}>
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-[0.2em]">{title}</h3>
            {action}
        </div>
        <div className="flex-1 min-h-0">
            {children}
        </div>
    </div>
);

// Metric Component
const MetricItem: React.FC<{ label: string; value: string | number; trend?: string; icon?: React.ReactNode; color?: string }> = ({ label, value, trend, icon, color }) => {
    return (
        <div className="p-6 rounded-[28px] bg-white/60 dark:bg-black/20 backdrop-blur-[40px] border border-white/40 dark:border-white/5 flex items-center justify-between group hover:bg-white/80 dark:hover:bg-white/5 transition-all duration-300 shadow-lg shadow-black/5 dark:shadow-none">
            <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest mb-2">{label}</p>
                <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-black text-slate-900 dark:text-white`}>{value}</span>
                    {trend && <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400">{trend}</span>}
                </div>
            </div>
            {icon && <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl text-slate-400 dark:text-white/40 group-hover:text-slate-900 dark:group-hover:text-white group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-all duration-300">{icon}</div>}
        </div>
    );
};

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
    const [summary, setSummary] = useState('');
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);

    // Calculations
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: Task) => t.status === TaskStatus.DONE);
    const completionRate = totalTasks ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    const overdueTasks = tasks.filter((t: Task) => new Date(t.dueDate) < new Date() && t.status !== TaskStatus.DONE);

    // Calculate average completion time (mock calculation for demo)
    const avgCompletionTime = "2.5 Days";

    const handleGenerateSummary = async () => {
        setIsSummaryLoading(true);
        try {
            const result = await generateWeeklySummary(tasks, employees);
            setSummary(result);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSummaryLoading(false);
        }
    };

    return (
        <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full"></div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-[0.3em]">Executive Overview</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">Project <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-600">Velocity</span></h2>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-[10px] font-bold text-slate-600 dark:text-white/40 uppercase tracking-[0.2em] mb-1">Last Synced</p>
                    <p className="text-slate-600 dark:text-white/60 font-medium text-sm">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </div>

            {/* Top Level Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricItem
                    label="Total Tasks"
                    value={totalTasks}
                    icon={<FlagIcon className="w-6 h-6" />}
                />
                <MetricItem
                    label="Completion Rate"
                    value={`${completionRate}%`}
                    icon={<CheckCircleIcon className="w-6 h-6" />}
                />
                <MetricItem
                    label="Critical Overdue"
                    value={overdueTasks.length}
                    icon={<ClockIcon className="w-6 h-6" />}
                />
                <MetricItem
                    label="Avg Turnaround"
                    value={avgCompletionTime}
                    icon={<SparklesIcon className="w-6 h-6" />}
                />
            </div>

            {/* Main Grid Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column (Charts) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DashboardCard title="Task Distribution" className="h-[400px]">
                            <TaskStatusPieChart tasks={tasks} />
                        </DashboardCard>
                        <DashboardCard title="Priority Layers" className="h-[400px]">
                            <TaskPriorityBarChart tasks={tasks} />
                        </DashboardCard>
                    </div>

                    {isAdmin && (
                        <DashboardCard title="Historical Velocity">
                            <div className="h-[400px]">
                                <CompletionHistoryChart tasks={tasks} />
                            </div>
                        </DashboardCard>
                    )}

                    {/* AI Summary Section */}
                    <div className="relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-pink-500/5 to-transparent z-0 opacity-50"></div>
                        <div className="relative z-10 bg-white/10 dark:bg-white/5 backdrop-blur-[40px] border border-white/20 dark:border-white/10 rounded-[32px] p-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-gradient-to-br from-orange-400 to-pink-600 rounded-2xl shadow-lg shadow-orange-500/20">
                                    <SparklesIcon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Intelligence Report</h3>
                            </div>

                            {!summary ? (
                                <div className="text-center py-12">
                                    <p className="text-white/40 mb-8 text-sm max-w-md mx-auto leading-relaxed">Let AI analyze your project flow and generate a comprehensive natural-language progress report.</p>
                                    <button
                                        onClick={handleGenerateSummary}
                                        disabled={isSummaryLoading}
                                        className="px-8 py-4 bg-white text-black text-sm font-bold rounded-2xl shadow-2xl shadow-white/10 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isSummaryLoading ? 'Analyzing Workspace...' : 'Generate AI Report'}
                                    </button>
                                </div>
                            ) : (
                                <div className="prose prose-sm max-w-none">
                                    <div className="whitespace-pre-wrap text-white/70 leading-relaxed bg-black/40 p-8 rounded-3xl border border-white/5 font-medium">
                                        {summary}
                                    </div>
                                    <button
                                        onClick={() => setSummary('')}
                                        className="mt-6 text-[10px] text-white/30 hover:text-white font-bold uppercase tracking-[0.2em] transition-colors"
                                    >
                                        Reset Analysis
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column (Team & Activity) */}
                <div className="space-y-8 flex flex-col">
                    <DashboardCard title="Resource Allocation" className="min-h-[400px]">
                        <TasksPerEmployeeBarChart tasks={tasks} employees={employees} />
                    </DashboardCard>

                    <DashboardCard title="Real-time Activity" className="flex-1 min-h-[500px]">
                        <div className="space-y-6 overflow-y-auto pr-4 max-h-[600px] scrollbar-none">
                            {activityLogs.slice(0, 15).map((log) => (
                                <div key={log.id} className="flex gap-4 items-start group">
                                    <div className="relative flex-shrink-0">
                                        <img src={log.user.avatarUrl} alt="" className="w-10 h-10 rounded-2xl object-cover border-2 border-[#1E1E1E] ring-1 ring-white/10" />
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white/20 rounded-full border-2 border-[#1E1E1E]"></div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-slate-900 dark:text-white leading-none">{log.user.name}</span>
                                            <span className="text-[10px] text-slate-600 dark:text-white/40 font-bold uppercase tracking-wider">{getRelativeTime(log.timestamp)}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-white/50 leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white/80 transition-colors">
                                            {log.message}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {activityLogs.length === 0 && (
                                <div className="text-center py-20 text-slate-400 dark:text-white/20 font-bold uppercase tracking-widest text-xs">Awaiting Activity...</div>
                            )}
                        </div>
                    </DashboardCard>
                </div>
            </div>

            {/* Team Task Overview */}
            <div className="pt-10 px-4">
                <div className="flex items-center gap-4 mb-10">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Squad Overview</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {employees.map(employee => {
                        const employeeTasks = tasks.filter((t: Task) => t.assigneeId === employee.id && t.status !== TaskStatus.DONE);

                        return (
                            <div key={employee.id} className="bg-white/60 dark:bg-black/20 backdrop-blur-[40px] border border-white/40 dark:border-white/5 rounded-[32px] overflow-hidden flex flex-col hover:bg-white/80 dark:hover:bg-white/5 transition-all duration-300 shadow-xl shadow-black/5 dark:shadow-none">
                                <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <img src={employee.avatarUrl} alt={employee.name} className="w-12 h-12 rounded-2xl object-cover bg-black" />
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-3 border-white dark:border-[#1E1E1E]"></div>
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{employee.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mt-1">{employeeTasks.length} tasks active</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 min-h-[200px] max-h-[400px] overflow-y-auto scrollbar-none space-y-3">
                                    {employeeTasks.length > 0 ? (
                                        employeeTasks.map((task: Task) => (
                                            <div key={task.id} className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/20 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                                                <div className="flex justify-between items-start gap-3 relative z-10">
                                                    <p className="text-xs font-bold text-slate-700 dark:text-white/80 line-clamp-2 leading-relaxed group-hover:text-slate-950 dark:group-hover:text-white transition-colors">{task.title}</p>
                                                    <div className={`mt-0.5 w-2 h-2 rounded-full shadow-[0_0_8px] ${task.priority === 'Urgent' ? 'bg-red-500 shadow-red-500/50' :
                                                        task.priority === 'High' ? 'bg-orange-500 shadow-orange-500/50' :
                                                            'bg-slate-300 dark:bg-white/20 shadow-black/5 dark:shadow-white/10'
                                                        }`} />
                                                </div>
                                                <div className="flex items-center gap-3 mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${task.status === 'In Progress' ? 'bg-orange-500' : 'bg-slate-300 dark:bg-white/20'}`} />
                                                    {task.status}
                                                    {task.dueDate && (
                                                        <span className="ml-auto flex items-center gap-1.5">
                                                            <ClockIcon className="w-3.5 h-3.5" />
                                                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-white/10 py-10">
                                            <CheckCircleIcon className="w-12 h-12 mb-3 opacity-20" />
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">All Tasks Complete</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
