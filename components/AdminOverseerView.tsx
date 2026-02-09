import React, { useMemo } from 'react';
import { Task, Space, Employee, TaskStatus, Priority } from '../types';

interface AdminOverseerViewProps {
    spaces: Space[];
    tasks: Task[];
    employees: Employee[];
    onViewTask: (task: Task) => void;
    userName?: string;
}

interface MemberWithTasks {
    employee: Employee;
    tasks: Task[];
}

const AdminOverseerView: React.FC<AdminOverseerViewProps> = ({
    spaces,
    tasks,
    employees,
    onViewTask,
    userName,
}) => {
    // Get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };
    // Get today's date range
    const today = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    }, []);

    const tomorrow = useMemo(() => {
        const date = new Date(today);
        date.setDate(date.getDate() + 1);
        return date;
    }, [today]);

    // Filter tasks for today (due today or currently in progress)
    const todaysTasks = useMemo(() => {
        return tasks.filter(task => {
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            // Include if due today OR if in progress
            return (
                (dueDate.getTime() === today.getTime()) ||
                (task.status === TaskStatus.IN_PROGRESS)
            );
        });
    }, [tasks, today]);

    // Group tasks by workspace and member
    const workspaceData = useMemo(() => {
        return spaces.map(space => {
            const spaceTasks = todaysTasks.filter(t => t.spaceId === space.id);
            const spaceMembers = employees.filter(e => space.members.includes(e.id));

            const membersWithTasks: MemberWithTasks[] = spaceMembers.map(employee => ({
                employee,
                tasks: spaceTasks.filter(t => t.assigneeId === employee.id),
            }));

            return {
                space,
                members: membersWithTasks,
                totalTasks: spaceTasks.length,
            };
        });
    }, [spaces, todaysTasks, employees]);

    const getPriorityColor = (priority: Priority) => {
        switch (priority) {
            case Priority.URGENT: return 'text-red-400';
            case Priority.HIGH: return 'text-orange-400';
            case Priority.MEDIUM: return 'text-yellow-400';
            case Priority.LOW: return 'text-green-400';
            default: return 'text-neutral-400';
        }
    };

    const getStatusIcon = (status: TaskStatus) => {
        switch (status) {
            case TaskStatus.TODO: return '○';
            case TaskStatus.IN_PROGRESS: return '◐';
            case TaskStatus.DONE: return '●';
            default: return '○';
        }
    };

    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case TaskStatus.TODO: return 'text-neutral-400';
            case TaskStatus.IN_PROGRESS: return 'text-[#CEFD4A]';
            case TaskStatus.DONE: return 'text-green-500';
            default: return 'text-neutral-400';
        }
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="bg-white/60 dark:bg-black/40 backdrop-blur-[40px] border border-white/40 dark:border-white/5 rounded-[32px] p-8 shadow-xl shadow-black/5 dark:shadow-none">
                {/* Greeting */}
                <h2 className="text-2xl font-bold text-slate-600 dark:text-white/60 mb-1">
                    {getGreeting()}{userName ? `, ${userName}` : ''} 👋
                </h2>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-lime-500 dark:bg-[#CEFD4A]"></div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white">Daily Overview</h1>
                </div>
                <p className="text-slate-500 dark:text-white/40 text-sm font-bold uppercase tracking-widest">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Workspace Cards */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {workspaceData.length === 0 ? (
                    <div className="col-span-full bg-white/60 dark:bg-black/40 backdrop-blur-[40px] border border-white/40 dark:border-white/5 rounded-[32px] p-12 text-center shadow-xl shadow-black/5 dark:shadow-none">
                        <p className="text-slate-500 dark:text-white/40 text-lg font-bold">No workspaces found</p>
                    </div>
                ) : (
                    workspaceData.map(({ space, members, totalTasks }) => (
                        <div
                            key={space.id}
                            className="bg-white/60 dark:bg-black/40 backdrop-blur-[40px] border border-white/40 dark:border-white/5 rounded-[32px] p-8 hover:border-white/60 dark:hover:border-white/20 transition-all duration-300 shadow-xl shadow-black/5 dark:shadow-none"
                        >
                            {/* Workspace Header */}
                            <div className="mb-6 pb-6 border-b border-black/5 dark:border-white/5">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">{space.name}</h2>
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-slate-500 dark:text-white/40 font-bold text-[10px] uppercase tracking-wider">
                                            {members.length} member{members.length !== 1 ? 's' : ''}
                                        </span>
                                        <span className="px-3 py-1.5 bg-lime-500/10 dark:bg-[#CEFD4A]/10 border border-lime-500/20 dark:border-[#CEFD4A]/20 rounded-full text-lime-600 dark:text-[#CEFD4A] font-bold text-xs">
                                            {totalTasks} task{totalTasks !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                                {space.description && (
                                    <p className="text-slate-500 dark:text-white/40 text-sm">{space.description}</p>
                                )}
                            </div>

                            {/* Members and Their Tasks */}
                            <div className="space-y-4">
                                {members.length === 0 ? (
                                    <p className="text-slate-400 dark:text-white/30 text-center py-8 font-bold">No members in this workspace</p>
                                ) : (
                                    members.map(({ employee, tasks: memberTasks }) => (
                                        <div
                                            key={employee.id}
                                            className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-[20px] p-5"
                                        >
                                            {/* Member Header */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <img
                                                    src={employee.avatarUrl}
                                                    alt={employee.name}
                                                    className="w-10 h-10 rounded-full border-2 border-transparent hover:border-lime-500 dark:hover:border-[#CEFD4A] transition-all object-cover bg-neutral-200 dark:bg-neutral-800"
                                                />
                                                <div className="flex-1">
                                                    <h3 className="text-slate-900 dark:text-white font-bold">{employee.name}</h3>
                                                    <p className="text-slate-400 dark:text-white/40 text-xs font-bold uppercase tracking-wider">
                                                        {memberTasks.length} task{memberTasks.length !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Member's Tasks */}
                                            {memberTasks.length === 0 ? (
                                                <div className="text-slate-400 dark:text-white/30 text-sm ml-13 py-3 font-medium">
                                                    No tasks for today
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {memberTasks.map(task => {
                                                        const isOverdue = task.status !== TaskStatus.DONE && new Date(task.dueDate) < new Date();

                                                        return (
                                                            <button
                                                                key={task.id}
                                                                onClick={() => onViewTask(task)}
                                                                className="w-full text-left bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/5 dark:border-white/5 hover:border-lime-500/30 dark:hover:border-[#CEFD4A]/30 rounded-[20px] p-4 transition-all duration-200 group"
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === TaskStatus.DONE
                                                                        ? 'bg-lime-500 dark:bg-[#CEFD4A] border-lime-500 dark:border-[#CEFD4A] text-white dark:text-black'
                                                                        : task.status === TaskStatus.IN_PROGRESS
                                                                            ? 'border-lime-500 dark:border-[#CEFD4A] text-transparent'
                                                                            : 'border-slate-300 dark:border-white/20 text-transparent group-hover:border-slate-400 dark:group-hover:border-white/40'
                                                                        }`}>
                                                                        {task.status === TaskStatus.DONE && <span className="text-sm">✓</span>}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className={`font-bold transition-all ${task.status === TaskStatus.DONE
                                                                            ? 'text-slate-400 dark:text-white/30 line-through'
                                                                            : 'text-slate-900 dark:text-white group-hover:text-lime-600 dark:group-hover:text-[#CEFD4A]'
                                                                            }`}>
                                                                            {task.title}
                                                                        </h4>
                                                                        <div className="flex items-center gap-2 mt-1.5">
                                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${task.priority === Priority.URGENT ? 'bg-red-500/10 text-red-600 dark:text-red-500 dark:bg-red-500/20' :
                                                                                task.priority === Priority.HIGH ? 'bg-orange-500/10 text-orange-600 dark:text-orange-500 dark:bg-orange-500/20' :
                                                                                    task.priority === Priority.MEDIUM ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 dark:bg-yellow-500/20' :
                                                                                        'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/40'
                                                                                }`}>
                                                                                {task.priority}
                                                                            </span>
                                                                            <span className="text-slate-400 dark:text-white/30 text-xs">•</span>
                                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${task.status === TaskStatus.DONE
                                                                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                                                                : task.status === TaskStatus.IN_PROGRESS
                                                                                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                                                                    : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/40'
                                                                                }`}>
                                                                                {task.status === TaskStatus.DONE ? 'Completed' : task.status === TaskStatus.IN_PROGRESS ? 'In Progress' : 'Pending'}
                                                                            </span>
                                                                            {isOverdue && (
                                                                                <>
                                                                                    <span className="text-slate-400 dark:text-white/30 text-xs">•</span>
                                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400">
                                                                                        Overdue
                                                                                    </span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminOverseerView;
