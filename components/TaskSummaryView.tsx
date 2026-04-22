import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, Employee, TaskStatus, TaskFlowStatusUser } from '../types';
import { isTaskOverdue } from '../utils/taskUtils';
import { isPresent, isLate, isLateFromTimeIn, isAbsent, isTimedOut } from '../utils/statusUtils';
import { fetchTaskFlowStatus } from '../services/taskflowStatusService';
import { Clock, Maximize2, Minimize2, ChevronDown, Check, Copy, LayoutGrid, List, CheckCircle2 } from 'lucide-react';
import { usePreferences } from './hooks/usePreferences';
import { TASK_STATUS_CONFIG } from '../constants/taskStatusConfig';

interface TaskSummaryViewProps {
    tasks: Task[];
    employees: Employee[];
    onViewTask?: (task: Task) => void;
}

const TaskSummaryView: React.FC<TaskSummaryViewProps> = ({ tasks, employees, onViewTask }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [preferences] = usePreferences();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
    const [filterOpen, setFilterOpen] = useState(false);
    const [isCompact, setIsCompact] = useState(false);
    const [showCompleted, setShowCompleted] = useState(false);
    const [copying, setCopying] = useState(false);
    const [attendanceMap, setAttendanceMap] = useState<Map<string, TaskFlowStatusUser>>(new Map());
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [memberFilterOpen, setMemberFilterOpen] = useState(false);
    const memberWrapperRef = useRef<HTMLDivElement>(null);

    // Fetch attendance status on mount
    useEffect(() => {
        fetchTaskFlowStatus()
            .then(res => {
                const map = new Map<string, TaskFlowStatusUser>();
                res.users.forEach(u => map.set(u.full_name.trim().toLowerCase(), { ...u, status: u.status?.toLowerCase() }));
                setAttendanceMap(map);
            })
            .catch(() => {/* non-critical — renders without attendance data */});
    }, []);

    type AttendanceState = 'present' | 'late' | 'absent' | 'unknown';

    const getAttendanceState = (empName: string): AttendanceState => {
        const record = attendanceMap.get(empName.trim().toLowerCase());
        if (!record) return 'unknown';
        if (isPresent(record.status) || isLate(record.status)) return isLateFromTimeIn(record.time_in) ? 'late' : 'present';
        if (isAbsent(record.status) || isTimedOut(record.status)) return preferences.ignoreAbsentStatus ? 'unknown' : 'absent';
        return 'unknown';
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setFilterOpen(false);
            }
            if (memberWrapperRef.current && !memberWrapperRef.current.contains(e.target as Node)) {
                setMemberFilterOpen(false);
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

    // All positions across all employees
    const allPositions = useMemo(() => {
        const posSet = new Set<string>();
        employees.forEach(e => {
            if (e.position) {
                (e.position as string).split(',').map(p => p.trim()).filter(Boolean).forEach(p => posSet.add(p));
            }
        });
        return Array.from(posSet).sort();
    }, [employees]);

    // Positions available given the current member selection (cross-filter)
    const uniquePositions = useMemo(() => {
        if (selectedMembers.length === 0) return allPositions;
        const posSet = new Set<string>();
        employees
            .filter(e => selectedMembers.includes(e.id))
            .forEach(e => {
                if (e.position) {
                    (e.position as string).split(',').map(p => p.trim()).filter(Boolean).forEach(p => posSet.add(p));
                }
            });
        return Array.from(posSet).sort();
    }, [allPositions, employees, selectedMembers]);

    const togglePosition = (pos: string) => {
        setSelectedPositions(prev =>
            prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
        );
    };

    // Members available given the current position selection (cross-filter)
    const uniqueMembers = useMemo(() => {
        const base = employees.map(e => ({ id: e.id, name: e.name, position: e.position as string | undefined }));
        if (selectedPositions.length === 0) return base.sort((a, b) => a.name.localeCompare(b.name));
        return base
            .filter(e => {
                if (!e.position) return false;
                const parts = e.position.split(',').map(p => p.trim());
                return parts.some(p => selectedPositions.includes(p));
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [employees, selectedPositions]);

    // When member selection changes, drop any selected positions no longer available
    useEffect(() => {
        setSelectedPositions(prev => prev.filter(p => uniquePositions.includes(p)));
    }, [uniquePositions]);

    // When position selection changes, drop any selected members no longer available
    useEffect(() => {
        const availableIds = new Set(uniqueMembers.map(m => m.id));
        setSelectedMembers(prev => prev.filter(id => availableIds.has(id)));
    }, [uniqueMembers]);

    const toggleMember = (memberId: string) => {
        setSelectedMembers(prev =>
            prev.includes(memberId) ? prev.filter(m => m !== memberId) : [...prev, memberId]
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
        let report = `📅 *Collaborative Performance Report - ${dateStr}*\n\n`;

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

    const tasksByUser = allTasksByUser.filter(({ employee }) => {
        const passPosition = selectedPositions.length === 0 || (() => {
            if (!employee.position) return false;
            const parts = (employee.position as string).split(',').map(p => p.trim());
            return parts.some(p => selectedPositions.includes(p));
        })();

        const passMember = selectedMembers.length === 0 || selectedMembers.includes(employee.id);

        return passPosition && passMember;
    });

    return (
        <div className={`flex flex-col backdrop-blur-[40px] border border-white/40 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-none animate-fade-in transition-all duration-300 ${isFullscreen
            ? 'fixed inset-0 z-[100] overflow-y-auto bg-[#FAFAFA] dark:bg-black/95 p-8 md:p-12 rounded-none'
            : 'h-full relative bg-white/60 dark:bg-black/40 rounded-[32px] p-8'
            }`}>

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-black/5 dark:border-white/5 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Collaborative Performance Overview</h2>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-base font-bold text-slate-500 dark:text-white/40 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-lg">
                            <Clock className="w-5 h-5 text-indigo-500" />
                            {formattedDate}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
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
                                <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-black/80 dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl shadow-black/10 dark:shadow-black/40 z-50">
                                    <div className="p-2 max-h-72 overflow-y-auto">
                                        <button
                                            onClick={() => {
                                                if (selectedPositions.length === uniquePositions.length) {
                                                    setSelectedPositions([]);
                                                } else {
                                                    setSelectedPositions(uniquePositions);
                                                }
                                            }}
                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-50 dark:hover:bg-white/5 text-left mb-1"
                                        >
                                            <span className="text-indigo-600 dark:text-indigo-400">
                                                {selectedPositions.length === uniquePositions.length ? 'Deselect All' : 'Select All'}
                                            </span>
                                        </button>
                                        <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />
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

                    {/* Member Filter Dropdown */}
                    {uniqueMembers.length > 0 && (
                        <div ref={memberWrapperRef} className="relative">
                            <button
                                onClick={() => setMemberFilterOpen(o => !o)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border shadow-sm whitespace-nowrap ${
                                    selectedMembers.length > 0
                                        ? 'bg-indigo-500 text-white border-indigo-500'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/60 border-slate-200 dark:border-white/10'
                                }`}
                            >
                                {selectedMembers.length > 0 ? 'Filtered' : 'Filter by Member'}
                                {selectedMembers.length > 0 && (
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/30 text-white text-[10px] font-black">
                                        {selectedMembers.length}
                                    </span>
                                )}
                                <ChevronDown className={`w-4 h-4 transition-transform ${memberFilterOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {memberFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-black/80 dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl shadow-black/10 dark:shadow-black/40 z-50">
                                    <div className="p-2 max-h-72 overflow-y-auto">
                                        <button
                                            onClick={() => {
                                                if (selectedMembers.length === uniqueMembers.length) {
                                                    setSelectedMembers([]);
                                                } else {
                                                    setSelectedMembers(uniqueMembers.map(m => m.id));
                                                }
                                            }}
                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-50 dark:hover:bg-white/5 text-left mb-1"
                                        >
                                            <span className="text-indigo-600 dark:text-indigo-400">
                                                {selectedMembers.length === uniqueMembers.length ? 'Deselect All' : 'Select All'}
                                            </span>
                                        </button>
                                        <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />
                                        {uniqueMembers.map(member => {
                                            const active = selectedMembers.includes(member.id);
                                            return (
                                                <button
                                                    key={member.id}
                                                    onClick={() => toggleMember(member.id)}
                                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-50 dark:hover:bg-white/5 text-left"
                                                >
                                                    <span className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-white/70'}>
                                                        {member.name}
                                                    </span>
                                                    {active && <Check className="w-4 h-4 text-indigo-500 shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {selectedMembers.length > 0 && (
                                        <div className="border-t border-slate-100 dark:border-white/5 p-2">
                                            <button
                                                onClick={() => { setSelectedMembers([]); setMemberFilterOpen(false); }}
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
                {tasksByUser.map(({ employee, userTasks }) => {
                    const attendance = getAttendanceState(employee.fullName || employee.name);
                    const isInactive = attendance === 'absent';
                    const attendanceBadge = attendance === 'late'
                        ? <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">Late</span>
                        : attendance === 'absent'
                            ? <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-500 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">Absent</span>
                            : null;

                    return isCompact ? (
                        /* Compact Row Layout */
                        <div key={employee.id} className={`bg-white dark:bg-white/5 rounded-2xl border flex flex-col overflow-hidden transition-all duration-200 ${isInactive ? 'opacity-50 border-slate-100 dark:border-white/5' : 'border-slate-200 dark:border-white/8 shadow-sm hover:shadow-md hover:-translate-y-0.5'}`}>
                            {/* Colored top bar */}
                            <div className={`h-1 w-full shrink-0 ${isInactive ? 'bg-slate-200 dark:bg-white/10' : userTasks.some(t => isTaskOverdue(t)) ? 'bg-red-500' : 'bg-emerald-500'}`} />

                            {/* Employee header row */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-white/5">
                                <div className="relative shrink-0">
                                    <img src={employee.avatarUrl} alt={employee.name} className="w-9 h-9 rounded-full border-2 border-white dark:border-zinc-700 shadow object-cover bg-neutral-200 dark:bg-neutral-800" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{employee.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        {attendanceBadge}
                                        {!isInactive && (
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">
                                                {userTasks.length} Active {userTasks.length === 1 ? 'Task' : 'Tasks'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Task rows */}
                            <div className="divide-y divide-slate-50 dark:divide-white/5">
                                {isInactive ? (
                                    <p className="text-xs font-medium text-slate-400 dark:text-white/30 italic px-4 py-3">No tasks shown.</p>
                                ) : userTasks.length > 0 ? (
                                    userTasks.map(task => {
                                        const overdue = isTaskOverdue(task) && task.status !== TaskStatus.DONE;
                                        return (
                                            <div
                                                key={task.id}
                                                onClick={() => onViewTask && onViewTask(task)}
                                                className="flex items-start justify-between gap-4 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                                            >
                                                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${TASK_STATUS_CONFIG[task.status as TaskStatus].bg} ${TASK_STATUS_CONFIG[task.status as TaskStatus].glow}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <span className={`text-sm font-medium leading-snug ${overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                            {task.title}
                                                        </span>
                                                        {task.subtasks && task.subtasks.length > 0 && (
                                                            <ul className="mt-1.5 space-y-1 pl-1">
                                                                {task.subtasks.map(st => (
                                                                    <li key={st.id} className="flex items-start gap-2 text-xs">
                                                                        <div className={`mt-[0.35rem] w-1.5 h-1.5 rounded-full shrink-0 ${st.isCompleted ? TASK_STATUS_CONFIG[TaskStatus.DONE].bg : 'bg-slate-300 dark:bg-slate-600'}`} />
                                                                        <span className={`leading-snug ${st.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                            {st.title}
                                                                        </span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                                    {overdue && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider bg-red-50 text-red-500 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                                                            Overdue
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${TASK_STATUS_CONFIG[task.status as TaskStatus].faint} ${TASK_STATUS_CONFIG[task.status as TaskStatus].text} border ${TASK_STATUS_CONFIG[task.status as TaskStatus].bg.replace('bg-', 'border-')}/20`}>
                                                        {TASK_STATUS_CONFIG[task.status as TaskStatus].label}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs font-medium text-slate-400 dark:text-white/30 italic px-4 py-3">No tasks assigned.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Standard Card Layout */
                        <div key={employee.id} className={`bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-100 dark:border-white/5 shadow-sm flex flex-col relative overflow-hidden group ${isInactive ? 'opacity-50' : ''}`}>
                            {/* Status bar top edge */}
                            <div className={`absolute top-0 left-0 right-0 h-1 transition-all ${isInactive ? 'bg-slate-300 dark:bg-white/10' : userTasks.some(t => isTaskOverdue(t)) ? 'bg-red-500' : 'bg-emerald-500 opacity-0 group-hover:opacity-100'}`} />

                            <div className="flex items-center gap-4 mb-6">
                                <img src={employee.avatarUrl} alt={employee.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover bg-neutral-200 dark:bg-neutral-800" />
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight mb-0.5">{employee.name}</h3>
                                    <div className="flex items-center gap-2">
                                        {attendanceBadge}
                                        {!isInactive && (
                                            <>
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 rounded-md">
                                                    {userTasks.length} Active {userTasks.length === 1 ? 'Task' : 'Tasks'}
                                                </span>
                                                {userTasks.some(t => isTaskOverdue(t)) && (
                                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Has overdue tasks" />
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {isInactive ? (
                                <p className="text-sm font-medium text-slate-400 dark:text-white/40 italic">No tasks shown.</p>
                            ) : userTasks.length > 0 ? (
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
                                                    <h4 className={`font-semibold text-sm leading-snug ${overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                        {task.title}
                                                    </h4>
                                                    {task.subtasks && task.subtasks.length > 0 && (
                                                        <ul className="mt-2.5 space-y-1.5 w-full pl-1">
                                                            {task.subtasks.map(st => (
                                                                <li key={st.id} className="flex items-start gap-2 text-xs">
                                                                    <span className={`leading-snug ${st.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-400'}`}>
                                                                        {st.title}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 w-full mt-1">
                                                    {overdue && (
                                                        <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-500 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 text-[10px] font-bold uppercase tracking-wider shrink-0">
                                                            Overdue
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0 ${TASK_STATUS_CONFIG[task.status as TaskStatus].faint} ${TASK_STATUS_CONFIG[task.status as TaskStatus].text} border ${TASK_STATUS_CONFIG[task.status as TaskStatus].bg.replace('bg-', 'border-')}/20`}>
                                                        {TASK_STATUS_CONFIG[task.status as TaskStatus].label}
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
                    );
                })}
            </div>
        </div>
    );
};

export default TaskSummaryView;
