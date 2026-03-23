import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, Employee, TaskStatus } from '../types';
import { isTaskOverdue } from '../utils/taskUtils';
import { Clock, Maximize2, Minimize2, ChevronDown, Check } from 'lucide-react';

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

    // Group tasks by assigneeId, excluding completed tasks
    const allTasksByUser = employees.map(emp => {
        const activeTasks = tasks.filter(t => (t.assigneeIds?.includes(emp.id) || t.assigneeId === emp.id) && t.status !== TaskStatus.DONE);
        return {
            employee: emp,
            userTasks: activeTasks
        };
    }).filter(group => group.userTasks.length > 0 || group.employee.id);

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
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-white/40 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-md">
                            <Clock className="w-4 h-4 text-indigo-500" />
                            {formattedTime}
                        </div>
                        <span className="text-xs font-semibold text-slate-400 dark:text-white/30 tracking-wider">
                            {formattedDate}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
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
                                Filter by Position
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
                                Exit Fullscreen
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
                className={`flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pr-4 pb-4 -mx-4 px-4 pt-2 ${isFullscreen ? '' : 'overflow-y-auto scrollbar-none'}`}
                style={{ scrollBehavior: 'smooth' }}
            >
                {tasksByUser.map(({ employee, userTasks }) => (
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
                                            </div>
                                            <div className="flex items-center gap-2 w-full">
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
                ))}
            </div>
        </div>
    );
};

export default TaskSummaryView;
