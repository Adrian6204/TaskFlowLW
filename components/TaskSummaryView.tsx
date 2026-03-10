import React, { useState, useEffect } from 'react';
import { Task, Employee, TaskStatus } from '../types';
import { isTaskOverdue } from '../utils/taskUtils';
import { Clock, Maximize2, Minimize2 } from 'lucide-react';

interface TaskSummaryViewProps {
    tasks: Task[];
    employees: Employee[];
    onViewTask?: (task: Task) => void;
}

const TaskSummaryView: React.FC<TaskSummaryViewProps> = ({ tasks, employees, onViewTask }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isFullscreen, setIsFullscreen] = useState(false);

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

    // Group tasks by assigneeId, excluding completed tasks
    const tasksByUser = employees.map(emp => {
        const activeTasks = tasks.filter(t => (t.assigneeIds?.includes(emp.id) || t.assigneeId === emp.id) && t.status !== TaskStatus.DONE);
        return {
            employee: emp,
            userTasks: activeTasks
        };
    }).filter(group => group.userTasks.length > 0 || group.employee.id); // Keep all employees even if 0 tasks (based on existing logic, or you could filter them out)

    return (
        <div className={`flex flex-col backdrop-blur-[40px] border border-white/40 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-none animate-fade-in transition-all duration-300 ${isFullscreen
            ? 'fixed inset-0 z-[100] overflow-y-auto bg-[#FAFAFA] dark:bg-[#0f1115] p-8 md:p-12 rounded-none'
            : 'h-full relative bg-white/60 dark:bg-black/40 rounded-[32px] overflow-hidden p-8'
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
                                                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20'
                                                        : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-white/5 dark:text-white/40 dark:border-white/10'
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
