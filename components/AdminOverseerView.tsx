import React, { useMemo, useState } from 'react';
import { Task, Space, Employee, TaskStatus, Priority } from '../types';
import { isTaskOverdue } from '../utils/taskUtils';

interface AdminOverseerViewProps {
    spaces: Space[];
    tasks: Task[];
    employees: Employee[];
    searchTerm: string;
    onViewTask: (task: Task) => void;
    onAddTask: (memberId: string, spaceId: string) => void;
    userName?: string;
    activeSpaceId?: string;
}

interface MemberWithTasks {
    employee: Employee;
    tasks: Task[];
}

const PRIORITY_CONFIG: Record<Priority, { dot: string }> = {
    [Priority.URGENT]: { dot: 'bg-red-500' },
    [Priority.HIGH]:   { dot: 'bg-orange-500' },
    [Priority.MEDIUM]: { dot: 'bg-yellow-500' },
    [Priority.LOW]:    { dot: 'bg-emerald-500' },
};

const AdminOverseerView: React.FC<AdminOverseerViewProps> = ({
    spaces,
    tasks,
    employees,
    searchTerm,
    onViewTask,
    onAddTask,
    activeSpaceId,
}) => {
    const activeTab = activeSpaceId ?? spaces[0]?.id ?? '';
    const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());

    const toggleExpanded = (memberId: string) => {
        setExpandedMembers(prev => {
            const next = new Set(prev);
            next.has(memberId) ? next.delete(memberId) : next.add(memberId);
            return next;
        });
    };

    const filteredTasks = useMemo(() => {
        if (!searchTerm) return tasks;
        const term = searchTerm.toLowerCase();
        return tasks.filter(t =>
            t.title.toLowerCase().includes(term) ||
            (t.tags && t.tags.some(tag => tag.toLowerCase().includes(term))) ||
            (t.description && t.description.toLowerCase().includes(term))
        );
    }, [tasks, searchTerm]);

    const currentSpace = useMemo(
        () => spaces.find(s => s.id === activeTab) ?? spaces[0],
        [spaces, activeTab]
    );

    const memberData = useMemo((): MemberWithTasks[] => {
        if (!currentSpace) return [];
        const spaceMembers = employees.filter(e => currentSpace.members.includes(e.id));
        return spaceMembers
            .map(employee => ({
                employee,
                tasks: filteredTasks.filter(
                    t => t.spaceId === currentSpace.id &&
                    (t.assigneeIds?.includes(employee.id) || t.assigneeId === employee.id)
                ),
            }))
            .filter(({ employee, tasks: mt }) => {
                if (!searchTerm) return true;
                return (
                    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    mt.length > 0
                );
            });
    }, [currentSpace, employees, filteredTasks, searchTerm]);

    const totalActive = useMemo(
        () => filteredTasks.filter(t => t.status !== TaskStatus.DONE).length,
        [filteredTasks]
    );
    const totalDone = useMemo(
        () => filteredTasks.filter(t => t.status === TaskStatus.DONE).length,
        [filteredTasks]
    );

    return (
        <div className="space-y-6 pb-10">

            {/* ── Page Header ── */}
            <div className="relative overflow-hidden bg-white/60 dark:bg-black/40 backdrop-blur-[40px] border border-white/40 dark:border-white/5 rounded-[32px] p-8 shadow-xl shadow-black/5 dark:shadow-none">
                <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-lime-400/10 dark:bg-[#CEFD4A]/5 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-lime-500 dark:bg-[#CEFD4A] animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600 dark:text-[#CEFD4A]">
                                Admin Panel
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white leading-tight">
                            Assign Tasks
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-white/40 font-medium">
                            Distribute and manage tasks across your team
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-center px-4 py-2 bg-black/5 dark:bg-white/5 rounded-2xl">
                            <p className="text-xl font-black text-slate-900 dark:text-white">{employees.length}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30">Members</p>
                        </div>
                        <div className="text-center px-4 py-2 bg-lime-500/10 dark:bg-[#CEFD4A]/10 rounded-2xl border border-lime-500/20 dark:border-[#CEFD4A]/20">
                            <p className="text-xl font-black text-lime-600 dark:text-[#CEFD4A]">{totalActive}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-lime-600/70 dark:text-[#CEFD4A]/60">Active</p>
                        </div>
                        <div className="text-center px-4 py-2 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{totalDone}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/60">Done</p>
                        </div>
                    </div>
                </div>
            </div>


            {/* ── Member Grid ── */}
            {!currentSpace ? (
                <div className="bg-white/60 dark:bg-black/40 backdrop-blur-[40px] border border-white/40 dark:border-white/5 rounded-[32px] p-16 text-center">
                    <p className="text-slate-400 dark:text-white/30 font-bold">No workspace found</p>
                </div>
            ) : memberData.length === 0 ? (
                <div className="bg-white/60 dark:bg-black/40 backdrop-blur-[40px] border border-white/40 dark:border-white/5 rounded-[32px] p-16 text-center">
                    <p className="text-slate-400 dark:text-white/30 font-bold">No members match your search</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {memberData.map(({ employee, tasks: memberTasks }) => {
                        const todo        = memberTasks.filter(t => t.status === TaskStatus.TODO).length;
                        const inProg      = memberTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
                        const done        = memberTasks.filter(t => t.status === TaskStatus.DONE).length;
                        const total       = memberTasks.length;
                        const overdue     = memberTasks.filter(t => isTaskOverdue(t)).length;
                        const activeTasks = memberTasks.filter(t => t.status !== TaskStatus.DONE);
                        const isExpanded  = expandedMembers.has(employee.id);
                        const visibleTasks = isExpanded ? activeTasks : activeTasks.slice(0, 4);
                        const hiddenCount  = activeTasks.length - 4;

                        return (
                            <div
                                key={employee.id}
                                className="flex flex-col bg-white/60 dark:bg-black/40 backdrop-blur-[40px] border border-white/40 dark:border-white/5 rounded-[28px] overflow-hidden transition-all duration-300 shadow-xl shadow-black/5 dark:shadow-none hover:border-white/60 dark:hover:border-white/15"
                            >
                                <div className="flex flex-col flex-1 p-5 gap-4">

                                    {/* Member info */}
                                    <div className="flex items-center gap-3">
                                        <div className="relative shrink-0">
                                            <img
                                                src={employee.avatarUrl}
                                                alt={employee.name}
                                                className="w-12 h-12 rounded-full object-cover bg-neutral-200 dark:bg-neutral-800 border-2 border-white dark:border-white/10"
                                            />
                                            {inProg > 0 && (
                                                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-lime-500 dark:bg-[#CEFD4A] border-2 border-white dark:border-black rounded-full" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-slate-900 dark:text-white truncate">{employee.name}</h3>
                                            {employee.position && (
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 truncate">
                                                    {employee.position}
                                                </p>
                                            )}
                                        </div>
                                        {overdue > 0 && (
                                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-[9px] font-black uppercase tracking-widest">
                                                {overdue} overdue
                                            </span>
                                        )}
                                    </div>

                                    {/* Task stats */}
                                    <div className="flex gap-2">
                                        <div className="flex-1 text-center py-2 rounded-xl bg-black/5 dark:bg-white/5">
                                            <p className="text-base font-black text-slate-700 dark:text-white/80">{todo}</p>
                                            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30">To Do</p>
                                        </div>
                                        <div className="flex-1 text-center py-2 rounded-xl bg-lime-500/10 dark:bg-[#CEFD4A]/10">
                                            <p className="text-base font-black text-lime-600 dark:text-[#CEFD4A]">{inProg}</p>
                                            <p className="text-[8px] font-bold uppercase tracking-widest text-lime-600/70 dark:text-[#CEFD4A]/60">Active</p>
                                        </div>
                                        <div className="flex-1 text-center py-2 rounded-xl bg-emerald-500/10">
                                            <p className="text-base font-black text-emerald-600 dark:text-emerald-400">{done}</p>
                                            <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/60">Done</p>
                                        </div>
                                    </div>


                                    {/* Active task list */}
                                    {activeTasks.length > 0 ? (
                                        <div className="space-y-1.5">
                                            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-white/30 px-1">
                                                Active tasks
                                            </p>
                                            {visibleTasks.map(task => {
                                                const pc = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG[Priority.MEDIUM];
                                                const overdueTask = isTaskOverdue(task);
                                                return (
                                                    <button
                                                        key={task.id}
                                                        onClick={() => onViewTask(task)}
                                                        className="w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-[14px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-transparent hover:border-lime-500/20 dark:hover:border-[#CEFD4A]/20 transition-all group"
                                                    >
                                                        <span className={`shrink-0 w-2 h-2 rounded-full ${pc.dot}`} />
                                                        <span className={`flex-1 text-xs font-semibold truncate transition-colors ${
                                                            task.status === TaskStatus.IN_PROGRESS
                                                                ? 'text-slate-900 dark:text-white group-hover:text-lime-600 dark:group-hover:text-[#CEFD4A]'
                                                                : 'text-slate-600 dark:text-white/60 group-hover:text-slate-900 dark:group-hover:text-white'
                                                        }`}>
                                                            {task.title}
                                                        </span>
                                                        <div className="shrink-0 flex items-center gap-1">
                                                            {task.status === TaskStatus.IN_PROGRESS && (
                                                                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-lime-500/10 text-lime-600 dark:text-[#CEFD4A] font-bold uppercase">
                                                                    Active
                                                                </span>
                                                            )}
                                                            {overdueTask && (
                                                                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 dark:text-red-400 font-bold uppercase">
                                                                    Late
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                            {hiddenCount > 0 && !isExpanded && (
                                                <button
                                                    onClick={() => toggleExpanded(employee.id)}
                                                    className="w-full text-[9px] text-center text-slate-400 dark:text-white/30 hover:text-lime-600 dark:hover:text-[#CEFD4A] font-bold pt-1 transition-colors"
                                                >
                                                    +{hiddenCount} more tasks — click to expand
                                                </button>
                                            )}
                                            {isExpanded && activeTasks.length > 4 && (
                                                <button
                                                    onClick={() => toggleExpanded(employee.id)}
                                                    className="w-full text-[9px] text-center text-slate-400 dark:text-white/30 hover:text-lime-600 dark:hover:text-[#CEFD4A] font-bold pt-1 transition-colors"
                                                >
                                                    Show less ↑
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 dark:text-white/20 text-center py-2 font-medium">
                                            No active tasks
                                        </p>
                                    )}
                                </div>

                                {/* Assign Task button — opens full CreateTaskModal */}
                                <div className="px-5 pb-5">
                                    <button
                                        onClick={() => onAddTask(employee.id, currentSpace.id)}
                                        className="w-full py-2.5 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all border bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/40 border-black/5 dark:border-white/10 hover:bg-lime-500 dark:hover:bg-[#CEFD4A] hover:text-white dark:hover:text-black hover:border-transparent hover:shadow-lg hover:shadow-lime-500/20"
                                    >
                                        + Assign Task
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminOverseerView;
