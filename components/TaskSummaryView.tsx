import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, Employee, TaskStatus } from '../types';
import { isTaskOverdue } from '../utils/taskUtils';
import { Clock, Maximize2, Minimize2, ChevronDown, Check, Copy, LayoutGrid, List, CheckCircle2 } from 'lucide-react';

interface TaskSummaryViewProps {
    tasks: Task[];
    employees: Employee[];
    onViewTask?: (task: Task) => void;
}

const TaskSummaryView: React.FC<TaskSummaryViewProps> = ({ tasks, employees, onViewTask }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
    const [filterOpen, setFilterOpen] = useState(false);
    const [isCompact, setIsCompact] = useState(false);
    const [showCompleted, setShowCompleted] = useState(false);
    const [copying, setCopying] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const formattedDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', hour12: true
    });

    // Unique sorted positions — split comma-separated DB values into individual entries
    const uniquePositions = useMemo(() => {
        const posSet = new Set<string>();
        employees.forEach(e => {
            if (e.position) {
                (e.position as string).split(',').map(p => p.trim()).filter(Boolean).forEach(p => posSet.add(p));
            }
        });
        return Array.from(posSet).sort();
    }, [employees]);

    const togglePosition = (pos: string) => {
        setSelectedPositions(prev =>
            prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
        );
    };

    // Group tasks by assigneeId, excluding completed tasks (unless showCompleted is true)
    const allTasksByUser = employees.map(emp => {
        const userTasks = tasks.filter(t => (t.assigneeIds?.includes(emp.id) || t.assigneeId === emp.id));
        
        let filteredTasks = userTasks.filter(t => t.status !== TaskStatus.DONE);
        
        if (showCompleted) {
            const today = currentTime.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
            const completedToday = userTasks.filter(t => 
                t.status === TaskStatus.DONE && t.completedAt && t.completedAt.startsWith(today)
            );
            filteredTasks = [...filteredTasks, ...completedToday];
        }

        return {
            employee: emp,
            userTasks: filteredTasks
        };
    }).filter(group => group.userTasks.length > 0 || group.employee.id);

    const handleCopyReport = () => {
        setCopying(true);
        const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        let report = `📅 *Team Hub Report - ${dateStr}*\n\n`;

        tasksByUser.forEach(({ employee, userTasks }) => {
            if (userTasks.length === 0) return;
            
            report += `👤 *${employee.name.toUpperCase()}* (${userTasks.length} ACTIVE)\n`;
            userTasks.forEach(t => {
                const statusIcon = t.status === TaskStatus.DONE ? '✅' : t.status === TaskStatus.IN_PROGRESS ? '⏳' : '📋';
                const overdueStr = isTaskOverdue(t) && t.status !== TaskStatus.DONE ? ' [OVERDUE]' : '';
                report += `${statusIcon} ${t.title}${overdueStr}\n`;
                
                // Optional: Subtasks
                if (t.subtasks && t.subtasks.length > 0) {
                    t.subtasks.forEach(st => {
                        report += `   ${st.isCompleted ? '☑️' : '▫️'} ${st.title}\n`;
                    });
                }
            });
            report += '\n';
        });

        navigator.clipboard.writeText(report.trim());
        setTimeout(() => setCopying(false), 2000);
    };

    const tasksByUser = selectedPositions.length === 0
        ? allTasksByUser
        : allTasksByUser.filter(({ employee }) => {
            if (!employee.position) return false;
            const parts = (employee.position as string).split(',').map(p => p.trim());
            return parts.some(p => selectedPositions.includes(p));
          });

    return (
        <div className={`flex flex-col backdrop-blur-[40px] border border-white/40 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-none animate-fade-in transition-all duration-300 ${isFullscreen
            ? 'fixed inset-0 z-[100] overflow-y-auto bg-[#FAFAFA] dark:bg-[#0f1115] p-8 md:p-12 rounded-none'
            : 'h-full relative bg-white/60 dark:bg-black/40 rounded-[32px] p-8'
            }`}>

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-black/5 dark:border-white/5 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Team Hub Overview</h2>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-base font-bold text-slate-500 dark:text-white/40 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-lg">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            {formattedDate}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Copy Report Button */}
                    <button
                        onClick={handleCopyReport}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border shadow-sm whitespace-nowrap ${
                            copying 
                                ? 'bg-emerald-500 text-white border-emerald-500' 
                                : 'bg-white hover:bg-slate-50 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white border-slate-200 dark:border-white/10'
                        }`}
                    >
                        {copying ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copying ? 'Report Copied!' : 'Copy Report'}
                    </button>

                    {/* Show Completed Toggle */}
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border shadow-sm whitespace-nowrap ${
                            showCompleted 
                                ? 'bg-indigo-500 text-white border-indigo-500 shadow-indigo-200 dark:shadow-none' 
                                : 'bg-white hover:bg-slate-50 text-slate-600 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/60 border-slate-200 dark:border-white/10'
                        }`}
                        title="Include tasks completed today"
                    >
                        <CheckCircle2 className={`w-4 h-4 ${showCompleted ? 'text-white' : 'text-slate-400'}`} />
                        Include Done
                    </button>

                    {/* View mode toggle */}
                    <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                        <button
                            onClick={() => setIsCompact(false)}
                            className={`p-1.5 rounded-lg transition-all ${!isCompact ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:text-white/30 dark:hover:text-white/60'}`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsCompact(true)}
                            className={`p-1.5 rounded-lg transition-all ${isCompact ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:text-white/30 dark:hover:text-white/60'}`}
                            title="Compact View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Position Filter Dropdown */}
                    {uniquePositions.length > 0 && (
                        <div ref={wrapperRef} className="relative">
                            <button
                                onClick={() => setFilterOpen(o => !o)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border shadow-sm whitespace-nowrap ${
                                    selectedPositions.length > 0
                                        ? 'bg-indigo-500 text-white border-indigo-500'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/60 border-slate-200 dark:border-white/10'
                                }`}
                            >
                                {selectedPositions.length > 0 ? 'Filtered' : 'Filter by Position'}
                                {selectedPositions.length > 0 && (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/30 text-white text-[10px] font-black">
                                        {selectedPositions.length}
                                    </span>
                                )}
                                <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {filterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-[#1a1d23] rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl shadow-black/10 dark:shadow-black/40 z-50">
                                    <div className="p-2 max-h-72 overflow-y-auto">
                                        {uniquePositions.map(pos => {
                                            const active = selectedPositions.includes(pos);
                                            return (
                                                <button
                                                    key={pos}
                                                    onClick={() => togglePosition(pos)}
                                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-50 dark:hover:bg-white/5 text-left"
                                                >
                                                    <span className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-white/70'}>
                                                        {pos}
                                                    </span>
                                                    {active && <Check className="w-4 h-4 text-indigo-500 shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {selectedPositions.length > 0 && (
                                        <div className="border-t border-slate-100 dark:border-white/5 p-2">
                                            <button
                                                onClick={() => { setSelectedPositions([]); setFilterOpen(false); }}
                                                className="w-full text-center text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 py-2 rounded-xl transition-all"
                                            >
                                                Clear all filters
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Fullscreen button */}
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400 rounded-xl font-bold text-sm transition-all border border-indigo-100 dark:border-indigo-500/20 shadow-sm whitespace-nowrap"
                    >
                        {isFullscreen ? (
                            <>
                                <Minimize2 className="w-4 h-4" />
                                Exit
                            </>
                        ) : (
                            <>
                                <Maximize2 className="w-4 h-4" />
                                Fullscreen
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* The content container */}
            <div
                className={`flex-1 ${isCompact ? 'flex flex-col gap-3' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'} pr-4 pb-4 -mx-4 px-4 pt-2 ${isFullscreen ? '' : 'overflow-y-auto scrollbar-none'}`}
                style={{ scrollBehavior: 'smooth' }}
            >
                {tasksByUser.map(({ employee, userTasks }) => (
                    isCompact ? (
                        /* Compact Row Layout */
                        <div key={employee.id} className="bg-white/40 dark:bg-white/5 rounded-xl p-3 border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-4 hover:bg-white/60 dark:hover:bg-white/10 transition-all group">
                            <div className="relative shrink-0">
                                <img src={employee.avatarUrl} alt={employee.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover bg-neutral-200 dark:bg-neutral-800" />
                                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-[#1a1d23] ${userTasks.some(t => isTaskOverdue(t)) ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                            </div>
                            
                            <div className="min-w-[140px] max-w-[200px]">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{employee.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase uppercase tracking-tight">
                                    {userTasks.length} {userTasks.length === 1 ? 'Task' : 'Tasks'}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 flex-1">
                                {userTasks.slice(0, 5).map(task => (
                                    <div 
                                        key={task.id} 
                                        onClick={() => onViewTask && onViewTask(task)}
                                        className={`px-3 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-2 cursor-pointer transition-all border ${
                                            task.status === TaskStatus.DONE
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                                : isTaskOverdue(task)
                                                    ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                                                    : 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-white/5 dark:text-slate-300 dark:border-white/10'
                                        }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${task.status === TaskStatus.DONE ? 'bg-emerald-500' : isTaskOverdue(task) ? 'bg-red-500' : 'bg-indigo-400'}`} />
                                        <span className="truncate max-w-[150px]">{task.title}</span>
                                    </div>
                                ))}
                                {userTasks.length > 5 && (
                                    <div className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30 text-[10px] font-bold">
                                        +{userTasks.length - 5} more
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Standard Card Layout */
                        <div key={employee.id} className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-100 dark:border-white/5 shadow-sm flex flex-col relative overflow-hidden group">
                            {/* Status bar top edge */}
                            <div className={`absolute top-0 left-0 right-0 h-1 transition-all ${userTasks.some(t => isTaskOverdue(t)) ? 'bg-red-500' : 'bg-emerald-500 opacity-0 group-hover:opacity-100'}`} />

                            <div className="flex items-center gap-4 mb-6">
                                <img src={employee.avatarUrl} alt={employee.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover bg-neutral-200 dark:bg-neutral-800" />
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight mb-0.5">{employee.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 rounded-md">
                                            {userTasks.length} {userTasks.length === 1 ? 'ACTIVE' : 'ACTIVE'}
                                        </span>
                                        {userTasks.some(t => isTaskOverdue(t)) && (
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Has overdue tasks" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {userTasks.length > 0 ? (
                                <div className="space-y-3">
                                    {userTasks.map(task => {
                                        const overdue = isTaskOverdue(task);
                                        return (
                                            <div
                                                key={task.id}
                                                onClick={() => onViewTask && onViewTask(task)}
                                                className="flex flex-col justify-between items-start bg-slate-50/50 dark:bg-white/5 p-3.5 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-all border border-transparent hover:border-slate-200 dark:hover:border-white/10 gap-3"
                                            >
                                                <div className="w-full">
                                                    <h4 className={`font-semibold text-sm leading-snug line-clamp-2 ${overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                        {task.title}
                                                    </h4>
                                                    {task.subtasks && task.subtasks.length > 0 && (
                                                        <ul className="mt-2.5 space-y-1.5 w-full">
                                                            {task.subtasks.map(st => (
                                                                <li key={st.id} className="flex items-start gap-2 text-xs">
                                                                    <div className={`mt-[0.35rem] w-1.5 h-1.5 rounded-full shrink-0 ${st.isCompleted ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                                                    <span className={`leading-tight line-clamp-2 ${st.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-400'}`}>
                                                                        {st.title}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 w-full mt-1">
                                                    {overdue && (
                                                        <span className="px-2 py-1 rounded bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-100 shrink-0">
                                                            Overdue
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider shrink-0 ${task.status === TaskStatus.DONE
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                                        : task.status === TaskStatus.IN_PROGRESS
                                                            ? 'bg-emerald-700/10 text-emerald-800 border border-emerald-300 dark:bg-emerald-700/20 dark:text-emerald-500 dark:border-emerald-700/30'
                                                            : 'bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'
                                                        }`}>
                                                        {task.status === TaskStatus.DONE ? 'Completed' : task.status === TaskStatus.IN_PROGRESS ? 'In Progress' : 'To Do'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm font-medium text-slate-400 dark:text-white/40 italic">No tasks assigned.</p>
                            )}
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

export default TaskSummaryView;
