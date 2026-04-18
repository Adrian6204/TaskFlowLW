import React, { useMemo, useState } from 'react';
import { Task, Space, Employee, TaskStatus, Priority } from '../types';
import { isTaskOverdue } from '../utils/taskUtils';
import { TASK_STATUS_CONFIG } from '../constants/taskStatusConfig';
import { ChevronDown } from 'lucide-react';

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

type SortOption = 'alpha' | 'most-tasks' | 'least-tasks';
type FilterOption = 'all' | 'overdue' | 'idle';

const SORT_LABELS: Record<SortOption, string> = {
    alpha: 'A → Z',
    'most-tasks': 'Most Tasks',
    'least-tasks': 'Least Tasks',
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
    const [nameFilter, setNameFilter] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('alpha');
    const [filterBy, setFilterBy] = useState<FilterOption>('all');
    const [sortOpen, setSortOpen] = useState(false);

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

        let data = spaceMembers.map(employee => ({
            employee,
            tasks: filteredTasks.filter(
                t => t.spaceId === currentSpace.id &&
                (t.assigneeIds?.includes(employee.id) || t.assigneeId === employee.id)
            ),
        }));

        // Name + global search filter
        data = data.filter(({ employee, tasks: mt }) => {
            const passName = !nameFilter || employee.name.toLowerCase().includes(nameFilter.toLowerCase());
            if (!searchTerm) return passName;
            return passName && (
                employee.name.toLowerCase().includes(searchTerm.toLowerCase()) || mt.length > 0
            );
        });

        // Status filter
        if (filterBy === 'overdue') {
            data = data.filter(({ tasks: mt }) => mt.some(t => isTaskOverdue(t)));
        } else if (filterBy === 'idle') {
            data = data.filter(({ tasks: mt }) => mt.filter(t => t.status !== TaskStatus.DONE).length === 0);
        }

        // Sort
        data.sort((a, b) => {
            const aActive = a.tasks.filter(t => t.status !== TaskStatus.DONE).length;
            const bActive = b.tasks.filter(t => t.status !== TaskStatus.DONE).length;

            if (sortBy === 'alpha') return a.employee.name.localeCompare(b.employee.name);
            if (sortBy === 'most-tasks') return bActive - aActive;
            if (sortBy === 'least-tasks') return aActive - bActive;
            return 0;
        });

        return data;
    }, [currentSpace, employees, filteredTasks, searchTerm, nameFilter, filterBy, sortBy]);

    const spaceTasks = useMemo(
        () => filteredTasks.filter(t => t.spaceId === currentSpace?.id),
        [filteredTasks, currentSpace]
    );
    const totalActive = useMemo(() => spaceTasks.filter(t => t.status !== TaskStatus.DONE).length, [spaceTasks]);
    const totalDone   = useMemo(() => spaceTasks.filter(t => t.status === TaskStatus.DONE).length, [spaceTasks]);

    // Workload color for card top bar
    const workloadBar = (active: number, overdue: number) => {
        if (overdue > 0) return 'bg-red-500';
        if (active >= 8) return 'bg-orange-400';
        if (active >= 4) return 'bg-yellow-400';
        if (active > 0)  return 'bg-lime-500';
        return 'bg-slate-200 dark:bg-white/10';
    };

    return (
        <div className="space-y-6 pb-10 relative z-0">

            {/* ── Page Header ── */}
            <div className="relative z-10 bg-white/60 dark:bg-black/40 backdrop-blur-[40px] border border-white/40 dark:border-white/5 rounded-[32px] p-8 shadow-xl shadow-black/5 dark:shadow-none">
                <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-lime-400/10 dark:bg-[#CEFD4A]/5 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col gap-6">
                    {/* Row 1: title + stats */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`w-2 h-2 rounded-full ${TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].bg} animate-pulse`} />
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].text}`}>
                                    Admin Panel
                                </span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white leading-tight">Assign Tasks</h1>
                            <p className="mt-1 text-sm text-slate-500 dark:text-white/40 font-medium">
                                Distribute and manage tasks across your team
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="text-center px-4 py-2 bg-black/5 dark:bg-white/5 rounded-2xl">
                                <p className="text-xl font-black text-slate-900 dark:text-white">{memberData.length}</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30">Members</p>
                            </div>
                            <div className={`text-center px-4 py-2 ${TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].faint} rounded-2xl border ${TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].text} border-current/20`}>
                                <p className="text-xl font-black">{totalActive}</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">Active</p>
                            </div>
                            <div className={`text-center px-4 py-2 ${TASK_STATUS_CONFIG[TaskStatus.DONE].faint} rounded-2xl border ${TASK_STATUS_CONFIG[TaskStatus.DONE].text} border-current/20`}>
                                <p className="text-xl font-black">{totalDone}</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">Done</p>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: controls */}
                    <div className="flex flex-wrap items-center gap-3 border-t border-black/5 dark:border-white/5 pt-5">
                        {/* Name search */}
                        <input
                            type="text"
                            placeholder="Search member..."
                            value={nameFilter}
                            onChange={e => setNameFilter(e.target.value)}
                            className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-lime-500/30 w-52"
                        />

                        {/* Status filter pills */}
                        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-2xl p-1 border border-black/5 dark:border-white/10">
                            {(['all', 'overdue', 'idle'] as FilterOption[]).map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setFilterBy(opt)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        filterBy === opt
                                            ? opt === 'overdue'
                                                ? 'bg-red-500 text-white shadow-sm'
                                                : opt === 'idle'
                                                    ? 'bg-slate-400 text-white shadow-sm'
                                                    : 'bg-white dark:bg-white/10 text-slate-800 dark:text-white shadow-sm'
                                            : 'text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60'
                                    }`}
                                >
                                    {opt === 'all' ? 'All' : opt === 'overdue' ? 'Overdue' : 'Idle'}
                                </button>
                            ))}
                        </div>

                        {/* Sort dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setSortOpen(o => !o)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-white/50 hover:text-slate-800 dark:hover:text-white/80 transition-all whitespace-nowrap"
                            >
                                Sort: {SORT_LABELS[sortBy]}
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {sortOpen && (
                                <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 dark:backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl shadow-black/10 z-[9999] py-1.5">
                                    {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                                        <button
                                            key={key}
                                            onClick={() => { setSortBy(key); setSortOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${
                                                sortBy === key
                                                    ? 'text-lime-600 dark:text-lime-400 bg-lime-50 dark:bg-lime-500/10'
                                                    : 'text-slate-700 dark:text-white/70'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
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
                        const total       = todo + inProg + done;
                        const overdue     = memberTasks.filter(t => isTaskOverdue(t)).length;
                        const activeTasks = memberTasks.filter(t => t.status !== TaskStatus.DONE);
                        const isExpanded  = expandedMembers.has(employee.id);
                        const visibleTasks = isExpanded ? activeTasks : activeTasks.slice(0, 4);
                        const hiddenCount  = activeTasks.length - 4;
                        const barColor    = workloadBar(activeTasks.length, overdue);

                        return (
                            <div
                                key={employee.id}
                                className="flex flex-col bg-white/60 dark:bg-black/40 backdrop-blur-[40px] border border-white/40 dark:border-white/5 rounded-[28px] overflow-hidden transition-all duration-300 shadow-xl shadow-black/5 dark:shadow-none hover:border-white/60 dark:hover:border-white/15"
                            >
                                {/* Workload indicator bar */}
                                <div className={`h-1 w-full ${barColor} transition-colors duration-300`} />

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
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black text-slate-900 dark:text-white truncate">{employee.name}</h3>
                                                {/* Total badge */}
                                                {total > 0 && (
                                                    <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-slate-500 dark:text-white/40 text-[9px] font-black">
                                                        {total} tasks
                                                    </span>
                                                )}
                                            </div>
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
                                        <div className={`flex-1 text-center py-2 rounded-xl ${TASK_STATUS_CONFIG[TaskStatus.TODO].faint}`}>
                                            <p className={`text-base font-black ${TASK_STATUS_CONFIG[TaskStatus.TODO].text}`}>{todo}</p>
                                            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30">To Do</p>
                                        </div>
                                        <div className={`flex-1 text-center py-2 rounded-xl ${TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].faint}`}>
                                            <p className={`text-base font-black ${TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].text}`}>{inProg}</p>
                                            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30">Active</p>
                                        </div>
                                        <div className={`flex-1 text-center py-2 rounded-xl ${TASK_STATUS_CONFIG[TaskStatus.DONE].faint}`}>
                                            <p className={`text-base font-black ${TASK_STATUS_CONFIG[TaskStatus.DONE].text}`}>{done}</p>
                                            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30">Done</p>
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
                                                    <div key={task.id} className="group/task flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-transparent hover:border-lime-500/20 dark:hover:border-[#CEFD4A]/20 transition-all">
                                                        <span className={`shrink-0 w-2 h-2 rounded-full ${pc.dot}`} />
                                                        <button
                                                            onClick={() => onViewTask(task)}
                                                            className={`flex-1 text-xs font-semibold truncate text-left transition-colors ${
                                                                task.status === TaskStatus.IN_PROGRESS
                                                                    ? 'text-slate-900 dark:text-white group-hover/task:text-lime-600 dark:group-hover/task:text-[#CEFD4A]'
                                                                    : 'text-slate-600 dark:text-white/60 group-hover/task:text-slate-900 dark:group-hover/task:text-white'
                                                            }`}
                                                        >
                                                            {task.title}
                                                        </button>
                                                        <div className="shrink-0 flex items-center gap-1">
                                                            {task.status === TaskStatus.IN_PROGRESS && (
                                                                <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].faint} ${TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].text} font-bold uppercase`}>
                                                                    Active
                                                                </span>
                                                            )}
                                                            {overdueTask && (
                                                                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 dark:text-red-400 font-bold uppercase">
                                                                    Late
                                                                </span>
                                                            )}
                                                            {/* Reassign button — visible on task row hover */}
                                                            <button
                                                                onClick={() => onAddTask(employee.id, currentSpace.id)}
                                                                title="Assign another task to this member"
                                                                className="opacity-0 group-hover/task:opacity-100 ml-1 px-1.5 py-0.5 rounded-lg bg-lime-500/10 text-lime-600 dark:text-[#CEFD4A] text-[8px] font-black uppercase tracking-widest hover:bg-lime-500 hover:text-white transition-all"
                                                            >
                                                                + Assign
                                                            </button>
                                                        </div>
                                                    </div>
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

                                {/* Assign Task button */}
                                <div className="px-5 pb-5">
                                    <button
                                        onClick={() => onAddTask(employee.id, currentSpace.id)}
                                        className={`w-full py-2.5 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all border bg-black/5 dark:bg-white/5 text-slate-500 dark:text-white/40 border-black/5 dark:border-white/10 hover:${TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].bg} hover:text-white dark:hover:text-white hover:border-transparent hover:shadow-lg ${TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].glow}`}
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
