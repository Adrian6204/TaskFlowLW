import React from 'react';
import { Task, TaskStatus } from '../../types';
import { ChartBar, TrendingUp, TrendingDown } from 'lucide-react';

interface PerformanceTrendProps {
    tasks: Task[];
}

const PerformanceTrend: React.FC<PerformanceTrendProps> = ({ tasks }) => {
    // 1. Calculate tasks completed in the last 7 days vs previous 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE && t.updated_at);

    const thisWeekCount = completedTasks.filter(t => new Date(t.updated_at!) >= sevenDaysAgo).length;
    const lastWeekCount = completedTasks.filter(t => {
        const d = new Date(t.updated_at!);
        return d >= fourteenDaysAgo && d < sevenDaysAgo;
    }).length;

    // 2. Calculate daily completions for the last 7 days (including today)
    const dailyCounts = Array.from({ length: 7 }).map((_, i) => {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() - (6 - i));
        targetDate.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(targetDate);
        nextDate.setDate(targetDate.getDate() + 1);

        return completedTasks.filter(t => {
            const d = new Date(t.updated_at!);
            return d >= targetDate && d < nextDate;
        }).length;
    });

    const maxBarHeight = Math.max(...dailyCounts, 1);
    const trendData = dailyCounts;

    const percentChange = lastWeekCount === 0
        ? 100
        : Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100);

    const isTrendingUp = percentChange >= 0;

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl p-6 relative overflow-hidden group">

            {/* Background decoration */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />

            {/* Header */}
            <div className="flex justify-between items-start relative z-10 mb-4">
                <div>
                    <h3 className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest flex items-center gap-2">
                        <ChartBar className="w-4 h-4 text-indigo-400" />
                        7-Day Performance
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-900 dark:text-white leading-none">
                            {thisWeekCount}
                        </span>
                        <span className="text-xs font-bold text-slate-400">tasks done</span>
                    </div>
                </div>

                {/* Trend Pill */}
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${isTrendingUp
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    }`}>
                    {isTrendingUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isTrendingUp ? '+' : ''}{percentChange}% vs last week
                </div>
            </div>

            {/* Trend Bars */}
            <div className="flex-1 mt-auto flex items-end justify-between gap-2 relative z-10 h-24">
                {trendData.map((val, i) => (
                    <div key={i} className="w-full flex flex-col justify-end items-center group/bar h-full">
                        <div
                            className="w-full bg-indigo-500/20 dark:bg-indigo-400/20 rounded-t-sm transition-all duration-500 group-hover/bar:bg-indigo-500 dark:group-hover/bar:bg-indigo-400"
                            style={{ height: `${Math.max((val / maxBarHeight) * 100, 10)}%` }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PerformanceTrend;
