
import React from 'react';
import { Task, Priority, TaskStatus } from '../../types';
import { ShieldCheckIcon, AlertTriangleIcon } from 'lucide-react';

interface WorkloadHealthProps {
    tasks: Task[];
}

const WorkloadHealth: React.FC<WorkloadHealthProps> = ({ tasks }) => {
    const activeTasks = tasks.filter(t => t.status !== TaskStatus.DONE);
    const urgentCount = activeTasks.filter(t => t.priority === Priority.URGENT).length;
    const highCount = activeTasks.filter(t => t.priority === Priority.HIGH).length;
    const overdueCount = activeTasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < new Date();
    }).length;

    // Let's create an arbitrary "Health Score" out of 100 based on backlog pressure
    const totalWeight = (urgentCount * 5) + (highCount * 3) + (overdueCount * 8) + activeTasks.length;
    // If weight > 50, health goes down. 0 weight = 100 health.
    const healthScore = Math.max(0, 100 - Math.min(100, Math.floor(totalWeight * 1.5)));

    const isHealthy = healthScore > 60;
    const isCritical = healthScore < 30;

    const statusColor = isHealthy
        ? 'from-emerald-500/10 to-teal-500/5 text-emerald-500 border-emerald-500/20'
        : isCritical
            ? 'from-red-500/10 to-rose-500/5 text-red-500 border-red-500/20'
            : 'from-amber-500/10 to-orange-500/5 text-amber-500 border-amber-500/20';

    return (
        <div className={`flex flex-col h-full bg-gradient-to-br rounded-2xl p-6 relative overflow-hidden group border ${statusColor}`}>

            {/* Background decoration */}
            <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-50 transition-all duration-700 ${isHealthy ? 'bg-emerald-500/20 group-hover:bg-emerald-500/30'
                    : isCritical ? 'bg-red-500/20 group-hover:bg-red-500/30'
                        : 'bg-amber-500/20 group-hover:bg-amber-500/30'
                }`} />

            {/* Header */}
            <div className="flex justify-between items-start relative z-10 mb-4">
                <div>
                    <h3 className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest mb-1">
                        Workload Health
                    </h3>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-black leading-none ${isHealthy ? 'text-emerald-500' : isCritical ? 'text-red-500' : 'text-amber-500'
                            }`}>
                            {healthScore}%
                        </span>
                    </div>
                </div>

                {/* Icon Pill */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border ${statusColor.replace('from-', 'bg-').split(' ')[0]} bg-white/50 dark:bg-black/20 backdrop-blur-sm`}>
                    {isHealthy ? <ShieldCheckIcon className="w-5 h-5 opacity-80" /> : <AlertTriangleIcon className="w-5 h-5 opacity-80" />}
                </div>
            </div>

            {/* Insight Metrics */}
            <div className="flex-1 mt-auto flex flex-col gap-3 relative z-10 justify-end">
                <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm rounded-xl p-3 flex justify-between items-center border border-white/20 dark:border-white/5">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Critical Backlog</span>
                    <div className="flex gap-2 items-center">
                        <span className="text-sm font-black text-rose-500">{urgentCount}</span>
                        <span className="text-[10px] text-slate-400">urgent cases</span>
                    </div>
                </div>

                <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm rounded-xl p-3 flex justify-between items-center border border-white/20 dark:border-white/5">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Breach Risk</span>
                    <div className="flex gap-2 items-center">
                        <span className="text-sm font-black text-amber-500">{overdueCount}</span>
                        <span className="text-[10px] text-slate-400">overdue tasks</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkloadHealth;
