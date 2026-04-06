import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Employee, Task, Priority } from '../types';
import { isTaskOverdue } from '../utils/taskUtils';
import { XMarkIcon } from './icons/XMarkIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface OverdueTasksModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    employees: Employee[];
    onViewTask: (task: Task) => void;
}

const OverdueTasksModal: React.FC<OverdueTasksModalProps> = ({
    isOpen,
    onClose,
    tasks,
    employees,
    onViewTask,
}) => {
    // Group overdue tasks by employee
    const tasksByEmployee = useMemo(() => {
        const overdueTasks = tasks.filter(t => isTaskOverdue(t));
        const grouped = new Map<string, Task[]>();

        overdueTasks.forEach(task => {
            const assigneeId = task.assigneeId || 'unassigned';
            if (!grouped.has(assigneeId)) {
                grouped.set(assigneeId, []);
            }
            grouped.get(assigneeId)!.push(task);
        });

        return Array.from(grouped.entries()).map(([employeeId, employeeTasks]) => {
            const employee = employeeId === 'unassigned'
                ? { id: 'unassigned', name: 'Unassigned', avatarUrl: '', email: '', role: 'member', department: '' } as Employee
                : employees.find(e => e.id === employeeId) || { id: employeeId, name: 'Unknown User', avatarUrl: '', email: '', role: 'member', department: '' } as Employee;
            return { employee, tasks: employeeTasks };
        }).sort((a, b) => b.tasks.length - a.tasks.length); // Sort users by most overdue tasks first
    }, [tasks, employees]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full max-w-4xl bg-white dark:bg-black/80 dark:backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-[40px] overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[85vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header Section */}
                <div className="p-8 bg-red-50 dark:bg-red-500/5 border-b border-black/5 dark:border-red-500/10 flex flex-col md:flex-row items-center gap-6 relative shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full bg-black/5 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>

                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                        <ClockIcon className="w-8 h-8" />
                    </div>

                    <div className="text-center md:text-left flex-1 min-w-0">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white truncate">Overdue Tasks</h2>
                        <div className="flex flex-col md:flex-row flex-wrap justify-center md:justify-start gap-2 mt-2 font-medium">
                            <span className="text-red-600 dark:text-red-400 text-sm">{tasks.filter(t => isTaskOverdue(t)).length} tasks need immediate attention</span>
                        </div>
                    </div>
                </div>

                {/* Overdue Tasks List Grouped by User */}
                <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                    <div className="p-6 md:p-8 space-y-8">
                        {tasksByEmployee.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 dark:bg-white/5 rounded-[20px] border border-dashed border-slate-200 dark:border-white/10">
                                <CheckCircleIcon className="w-10 h-10 text-slate-300 dark:text-white/20 mx-auto mb-3" />
                                <p className="text-slate-400 dark:text-white/30 font-bold">No overdue tasks! Good job.</p>
                            </div>
                        ) : (
                            tasksByEmployee.map(({ employee, tasks: employeeTasks }) => (
                                <div key={employee.id} className="bg-white/60 dark:bg-black/40 border border-black/5 dark:border-white/5 rounded-[24px] p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4 border-b border-black/5 dark:border-white/5 pb-4">
                                        <div className="flex items-center gap-3">
                                            {employee.id === 'unassigned' ? (
                                                <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-white/10 flex items-center justify-center bg-slate-100 dark:bg-white/5">
                                                    <span className="text-slate-400 dark:text-white/40 font-bold">?</span>
                                                </div>
                                            ) : (
                                                <img
                                                    src={employee.avatarUrl}
                                                    alt={employee.name}
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-white/10"
                                                />
                                            )}
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 dark:text-white">{employee.name}</h3>
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">{employeeTasks.length} Overdue Task{employeeTasks.length !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {employeeTasks.map(task => (
                                            <div
                                                key={task.id}
                                                onClick={() => { onClose(); onViewTask(task); }}
                                                className="group flex flex-col gap-2 p-4 bg-white dark:bg-black/20 border border-red-100 dark:border-red-500/10 hover:border-red-500/30 dark:hover:border-red-400/30 rounded-[16px] transition-all cursor-pointer shadow-sm hover:shadow-md"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 pr-4">
                                                        {task.title}
                                                    </h4>
                                                    <div className="shrink-0 pt-0.5">
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${task.priority === Priority.URGENT ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' :
                                                            task.priority === Priority.HIGH ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' :
                                                                task.priority === Priority.MEDIUM ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' :
                                                                    'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/40'
                                                            }`}>
                                                            {task.priority || 'NORMAL'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-red-500 font-medium">
                                                    <ClockIcon className="w-3.5 h-3.5" />
                                                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default OverdueTasksModal;
