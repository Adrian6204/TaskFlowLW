import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, Employee } from '../types';
import { upsertTask } from '../services/supabaseService';
import { Target as TargetIcon, CheckCircle2, Layout, History, TrendingUp } from 'lucide-react';
import DashboardCard from './DashboardCard';
import PerformanceTrend from './charts/PerformanceTrend';

interface TargetsViewProps {
    spaceId: string;
    tasks: Task[];
    employees: Employee[];
    currentUserId: string;
    onAddTask?: (parentId: number) => void;
    onViewTask?: (task: Task) => void;
}

const PHASE_COLORS: Record<string, string> = {
    'Week 1': 'indigo',
    'Week 2': 'emerald',
    'Week 3': 'amber',
    'Week 4': 'rose',
    'Month 1': 'purple',
    'Global Queue': 'slate'
};

const TargetsView: React.FC<TargetsViewProps> = ({ spaceId, tasks, employees, currentUserId, onAddTask, onViewTask }) => {
    const [viewMode, setViewMode] = useState<'list' | 'roadmap'>('list');
    const [showOnlyMine, setShowOnlyMine] = useState(true);
    const [drillDownId, setDrillDownId] = useState<number | null>(null);

    const activeInitiatives = useMemo(() => {
        const isTaskActive = (t: Task) => t.status !== TaskStatus.DONE;
        const hasActiveChildren = (parentId: number) => tasks.some(t => t.parent_task_id === parentId && isTaskActive(t));

        if (!showOnlyMine) {
            // Organization: Show root tasks that are either not done OR have pending dependencies
            return tasks.filter(t => !t.parent_task_id && (isTaskActive(t) || hasActiveChildren(t.id!)));
        }

        // Professional Hub: Show any root task where the user has involvement, as long as the initiative is active
        const myTasks = tasks.filter(t => 
            t.assigneeId === currentUserId || 
            (t.assigneeIds && t.assigneeIds.includes(currentUserId))
        );

        const rootIds = new Set<number>();
        myTasks.forEach(task => {
            let current = task;
            while (current.parent_task_id) {
                const parent = tasks.find(t => t.id === current.parent_task_id);
                if (parent) current = parent;
                else break;
            }
            
            // Keep visible if the root initiative itself is still active
            if (isTaskActive(current) || hasActiveChildren(current.id!)) {
                rootIds.add(current.id!);
            }
        });

        return Array.from(rootIds).map(id => tasks.find(t => t.id === id)!);
    }, [tasks, showOnlyMine, currentUserId]);

    const groupedByLabel = useMemo(() => {
        const groups: Record<string, Task[]> = {}; 
        activeInitiatives.forEach((task: Task) => {
            const label = task.groupLabel || 'Global Alignment';
            if (!groups[label]) groups[label] = [];
            groups[label].push(task);
        });
        return groups;
    }, [activeInitiatives]);

    const toggleTaskStatus = async (task: Task) => {
        try {
            const newStatus = task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
            await upsertTask({
                ...task,
                status: newStatus,
                spaceId,
                completedAt: newStatus === TaskStatus.DONE ? new Date().toISOString() : undefined
            });
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    };

    const stats = useMemo(() => {
        const total = activeInitiatives.length;
        const allRelevantTasks = showOnlyMine 
            ? tasks.filter(t => t.assigneeId === currentUserId || (t.assigneeIds && t.assigneeIds.includes(currentUserId))) 
            : tasks;
            
        const doneTasks = allRelevantTasks.filter(t => t.status === TaskStatus.DONE).length;
        const totalTasks = allRelevantTasks.length;
        const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentCompletions = allRelevantTasks.filter(t => t.status === TaskStatus.DONE && t.completedAt && new Date(t.completedAt) > sevenDaysAgo).length;

        return { total, completed: doneTasks, progress, recentCompletions };
    }, [activeInitiatives, tasks, showOnlyMine, currentUserId]);

    return (
        <div className="flex flex-col h-full animate-fade-in space-y-8 p-1">
            {/* Executive Management Header */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <DashboardCard className="p-8 lg:col-span-3 overflow-hidden group border-indigo-500/10 dark:border-white/5 relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-indigo-500/10 transition-all duration-700" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                        {/* Progress Dial */}
                        <div className="relative w-44 h-44 shrink-0">
                            <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                <circle cx="88" cy="88" r="75" className="stroke-slate-100 dark:stroke-white/5" strokeWidth="14" fill="transparent" />
                                <circle cx="88" cy="88" r="75" className="stroke-indigo-500 transition-all duration-1000 ease-out" strokeWidth="14" fill="transparent" strokeDasharray={471} strokeDashoffset={471 - (stats.progress / 100) * 471} strokeLinecap="round" />
                                <circle cx="88" cy="88" r="75" className="stroke-emerald-400/20" strokeWidth="14" fill="transparent" strokeDasharray={471} strokeDashoffset={471 - (90 / 100) * 471} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{stats.progress}%</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Completion Rate</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 w-full min-w-0">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                                <div className="space-y-2">
                                        Strategic Insights
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center bg-indigo-500/10 rounded-full px-4 py-1.5 border border-indigo-500/20">
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse mr-2.5" />
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{stats.total} Active Initiatives</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <button onClick={() => setShowOnlyMine(true)} className={`group relative text-[10px] font-black uppercase tracking-widest transition-all ${showOnlyMine ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}>
                                                Personal
                                                {showOnlyMine && <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-indigo-500 rounded-full" />}
                                            </button>
                                            <button onClick={() => setShowOnlyMine(false)} className={`group relative text-[10px] font-black uppercase tracking-widest transition-all ${!showOnlyMine ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}>
                                                Team
                                                {!showOnlyMine && <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-indigo-500 rounded-full" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 shrink-0">
                                    <button onClick={() => setViewMode('list')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-indigo-500 shadow-xl shadow-indigo-500/10' : 'text-slate-400'}`}>Milestones</button>
                                    <button onClick={() => setViewMode('roadmap')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'roadmap' ? 'bg-white dark:bg-white/10 text-indigo-500 shadow-xl shadow-indigo-500/10' : 'text-slate-400'}`}>Timeline</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-8 border-t border-slate-100 dark:border-white/5">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Completion</span>
                                    <span className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1.5">
                                        {stats.completed} 
                                        <span className="text-slate-400 font-bold text-xs">/ {stats.total}</span>
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Weekly Performance</span>
                                    <span className="text-2xl font-black text-emerald-500 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5" />
                                        +{stats.recentCompletions}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Alignment</span>
                                    <span className="text-2xl font-black text-indigo-500">92%</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Workspace Health</span>
                                    <span className="text-2xl font-black text-emerald-500 flex items-center gap-2 uppercase text-base">
                                        Active
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </DashboardCard>

                <div className="lg:col-span-1">
                    <PerformanceTrend tasks={activeInitiatives} />
                </div>
            </div>

            <div className="w-full">
                {drillDownId ? (
                    <DetailedInspection 
                        parentId={drillDownId} 
                        tasks={tasks} 
                        onBack={() => setDrillDownId(null)}
                        toggleTaskStatus={toggleTaskStatus}
                        onAddTask={onAddTask}
                        onViewTask={onViewTask}
                    />
                ) : (
                    viewMode === 'roadmap' ? (
                        <ExecutionTimeline tasks={tasks} />
                    ) : (
                        activeInitiatives.length === 0 ? (
                            <DashboardCard className="p-20 flex flex-col items-center justify-center text-center opacity-50 bg-white/30 dark:bg-black/10 border-dashed border-2">
                                <Layout className="w-16 h-16 text-slate-300 mb-6" />
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">No Active Initiatives</h3>
                                <p className="text-slate-400 max-w-sm font-medium">Strategic goals are automatically synchronized from your active work.</p>
                            </DashboardCard>
                        ) : (
                            <div className="space-y-12">
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] whitespace-nowrap">
                                            Strategic Targets
                                        </h3>
                                        <div className="h-px bg-gradient-to-r from-indigo-500/20 to-transparent flex-1" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                                        {activeInitiatives.map(initiative => {
                                                const children = tasks.filter(c => c.parent_task_id === initiative.id);
                                                const completedCount = children.filter(c => c.status === TaskStatus.DONE).length;
                                                const progress = children.length > 0 ? Math.round((completedCount / children.length) * 100) : 0;
                                                
                                                return (
                                                    <DashboardCard 
                                                        key={initiative.id} 
                                                        onClick={() => setDrillDownId(initiative.id!)}
                                                        className={`p-0 overflow-hidden relative group/card hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-700 border-indigo-500/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm cursor-pointer active:scale-[0.98]`}
                                                    >
                                                        {/* Luxury Header */}
                                                        <div className="p-6 border-b border-white/5 bg-indigo-500/5 flex items-center justify-between">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="p-2.5 bg-indigo-500/10 rounded-2xl group-hover/card:scale-110 transition-transform duration-500 shrink-0">
                                                                    <TargetIcon className="w-5 h-5 text-indigo-500" />
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.1em] truncate">{initiative.title}</h3>
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Active Initiative</span>
                                                                </div>
                                                            </div>
                                                            <div className="w-10 h-10 shrink-0 relative">
                                                                <svg className="w-full h-full transform -rotate-90">
                                                                    <circle cx="20" cy="20" r="16" className="stroke-slate-200/50 dark:stroke-white/5" strokeWidth="3" fill="transparent" />
                                                                    <circle cx="20" cy="20" r="16" className="stroke-indigo-500 transition-all duration-1000 ease-out" strokeWidth="3" fill="transparent" strokeDasharray={100.5} strokeDashoffset={100.5 - (progress / 100) * 100.5} strokeLinecap="round" />
                                                                </svg>
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <span className="text-[8px] font-black text-slate-900 dark:text-white">{progress}%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Status Snapshot */}
                                                        <div className="px-6 py-4 bg-white/20 dark:bg-black/10 border-b border-white/5 flex items-center justify-between">
                                                            <div className="flex gap-4">
                                                                <div className="flex flex-col border-l-2 border-indigo-500 pl-3">
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Phase</span>
                                                                    <span className="text-xs font-black text-indigo-500">{initiative.groupLabel || 'Global'}</span>
                                                                </div>
                                                                <div className="flex flex-col border-l border-white/10 pl-4">
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Priority</span>
                                                                    <span className="text-xs font-black uppercase text-emerald-500">{initiative.priority}</span>
                                                                </div>
                                                            </div>
                                                        </div>
    
                                                        {/* Executive Summary */}
                                                        <div className="p-6">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Target Status</span>
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">{children.length} Targets</span>
                                                            </div>
    
                                                            {children.length === 0 ? (
                                                                <div className="py-8 flex flex-col items-center justify-center opacity-30">
                                                                    <TargetIcon className="w-8 h-8 mb-2" />
                                                                    <span className="text-[10px] font-black uppercase">No Targets Defined</span>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    {children.slice(0, 3).map(child => (
                                                                        <div key={child.id} className="flex items-center gap-3">
                                                                            <div className={`w-3 h-3 rounded-full ${child.status === TaskStatus.DONE ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-200 dark:bg-white/10'}`} />
                                                                            <p className={`text-xs font-black leading-tight truncate flex-1 ${child.status === TaskStatus.DONE ? 'line-through text-slate-400 opacity-60' : 'text-slate-900 dark:text-white'}`}>
                                                                                {child.title}
                                                                            </p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </DashboardCard>
                                                );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )
                    )
                )}
            </div>
        </div>
    );
};

const DetailedInspection: React.FC<{ 
    parentId: number, 
    tasks: Task[], 
    onBack: () => void,
    toggleTaskStatus: (t: Task) => void,
    onAddTask?: (parentId: number) => void,
    onViewTask?: (task: Task) => void 
}> = ({ parentId, tasks, onBack, toggleTaskStatus, onAddTask, onViewTask }) => {
    const parentTask = tasks.find(t => t.id === parentId);
    const milestones = tasks.filter(t => t.parent_task_id === parentId);
    
    const completedCount = milestones.filter(m => m.status === TaskStatus.DONE).length;
    const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

    return (
        <div className="space-y-6 animate-slide-up">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 group text-slate-400 hover:text-indigo-500 transition-colors"
            >
                <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl group-hover:bg-indigo-500/10 transition-all">
                    <Layout className="w-4 h-4 rotate-180" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Return to Overview</span>
            </button>

            <DashboardCard className="p-8 relative overflow-hidden bg-indigo-500/5 border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                
                <div className="flex flex-col md:flex-row justify-between items-start gap-12 relative z-10">
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-tighter rounded-full border border-indigo-500/20">
                                Strategic Objective
                            </span>
                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">#{parentId}</span>
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">
                            {parentTask?.title}
                        </h2>
                        <div className="flex items-center gap-4 mt-6">
                            <p className="text-slate-500 font-bold text-sm max-w-2xl italic opacity-80">
                                Comprehensive analysis of all strategic milestones associated with this objective.
                            </p>
                            {onAddTask && (
                                <button
                                    onClick={() => onAddTask(parentId)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95"
                                >
                                    Add Target Milestone
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Completion Progress</div>
                        <div className="text-6xl font-black text-indigo-500 leading-none">{progress}%</div>
                        <div className="h-2 w-48 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </div>

                <div className="mt-12 space-y-12">
                    {milestones.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                            <TargetIcon className="w-12 h-12 mb-4 text-slate-300" />
                            <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase">No Strategic Targets</h4>
                            <p className="text-sm font-bold text-slate-400">This initiative currently has no defined milestones.</p>
                        </div>
                    ) : (
                        Object.entries(
                            milestones.reduce((acc, m) => {
                                const label = m.groupLabel || 'Objective Core';
                                if (!acc[label]) acc[label] = [];
                                acc[label].push(m);
                                return acc;
                            }, {} as Record<string, Task[]>)
                        ).sort(([a], [b]) => a.localeCompare(b)).map(([label, groupMilestones]) => (
                            <div key={label} className="space-y-6">
                                {label !== 'Objective Core' && (
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">{label}</h3>
                                        <div className="h-px bg-slate-100 dark:bg-white/5 flex-1" />
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {groupMilestones.map(milestone => (
                                        <div 
                                            key={milestone.id}
                                            onClick={() => onViewTask?.(milestone)}
                                            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col gap-6 group/milestone ${milestone.status === TaskStatus.DONE ? 'bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-white dark:bg-white/2 border-slate-100 dark:border-white/5 hover:border-indigo-500/30'}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleTaskStatus(milestone);
                                                    }}
                                                    className={`p-3 rounded-2xl ${milestone.status === TaskStatus.DONE ? 'bg-emerald-500/10 text-emerald-500 rotate-[360deg]' : 'bg-slate-100 dark:bg-white/10 text-slate-400 hover:text-indigo-500'} transition-all duration-700`}
                                                >
                                                    {milestone.status === TaskStatus.DONE ? <CheckCircle2 className="w-5 h-5" /> : <TargetIcon className="w-5 h-5" />}
                                                </button>
                                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${milestone.status === TaskStatus.DONE ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-400'}`}>
                                                    {milestone.status}
                                                </span>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <h4 className={`text-lg font-black leading-tight uppercase ${milestone.status === TaskStatus.DONE ? 'text-slate-400 line-through opacity-60' : 'text-slate-800 dark:text-white'}`}>
                                                    {milestone.title}
                                                </h4>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{milestone.priority}</span>
                                                    {milestone.groupLabel && (
                                                        <>
                                                            <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{milestone.groupLabel}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DashboardCard>
        </div>
    );
};

const ExecutionTimeline: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
    const taskProgressMap = useMemo(() => {
        const map: Record<number, number> = {};
        tasks.forEach(t => {
            if (t.id && !t.parent_task_id) {
                const children = tasks.filter(c => c.parent_task_id === t.id);
                if (children.length > 0) {
                    const done = children.filter(c => c.status === TaskStatus.DONE).length;
                    map[t.id] = Math.round((done / children.length) * 100);
                }
            }
        });
        return map;
    }, [tasks]);

    // Group initiatives by their label for the timeline
    const phases = useMemo(() => {
        const labels = new Set<string>();
        tasks.forEach(t => {
            if (!t.parent_task_id && t.groupLabel) {
                labels.add(t.groupLabel);
            }
        });
        return Array.from(labels).sort();
    }, [tasks]);

    const parentTasks = useMemo(() => tasks.filter(t => !t.parent_task_id && t.groupLabel), [tasks]);

    if (parentTasks.length === 0) {
        return (
            <DashboardCard className="p-12 flex flex-col items-center justify-center text-center">
                <History className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">No Execution Timeline</h3>
                <p className="text-sm text-slate-400 mt-2">Assign labels to master initiatives to see them in the timeline.</p>
            </DashboardCard>
        );
    }

    return (
        <DashboardCard className="p-0 overflow-hidden border-slate-100 dark:border-white/5">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-white/5">
                            <th className="p-6 text-left border-b border-slate-100 dark:border-white/5 min-w-[240px]">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Objective</span>
                            </th>
                            {phases.map(p => (
                                <th key={p} className="p-6 text-center border-b border-l border-slate-100 dark:border-white/5 min-w-[120px]">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {parentTasks.map(parent => (
                            <tr key={parent.id} className="hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors">
                                <td className="p-6 border-b border-slate-100 dark:border-white/5">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white">{parent.title}</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 flex-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500" style={{ width: `${taskProgressMap[parent.id!] || 0}%` }} />
                                            </div>
                                            <span className="text-[8px] font-black text-slate-400 uppercase">{taskProgressMap[parent.id!] || 0}%</span>
                                        </div>
                                    </div>
                                </td>
                                {phases.map(p => {
                                    const isCurrent = parent.groupLabel === p;
                                    return (
                                        <td key={p} className="p-6 border-b border-l border-slate-100 dark:border-white/5 text-center">
                                            {isCurrent ? (
                                                <div className="h-8 rounded-lg flex items-center justify-center border-2 bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                            ) : (
                                                <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto" />
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DashboardCard>
    );
};

export default TargetsView;
