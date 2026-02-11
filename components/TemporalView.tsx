import React, { useState } from 'react';
import { Task, Employee } from '../types';
import CalendarView from './CalendarView';
import GanttChart from './GanttChart';
import { CalendarIcon } from './icons/CalendarIcon';
import { GanttIcon } from './icons/GanttIcon';

interface TemporalViewProps {
    tasks: Task[];
    employees: Employee[];
    onViewTask: (task: Task) => void;
}

const TemporalView: React.FC<TemporalViewProps> = ({ tasks, employees, onViewTask }) => {
    const [view, setView] = useState<'calendar' | 'timeline'>('calendar');

    return (
        <div className="flex flex-col gap-6 h-full animate-in fade-in duration-700">
            {/* View Switcher Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-lime-500/10 dark:bg-[#CEFD4A]/10 flex items-center justify-center text-lime-600 dark:text-[#CEFD4A] border border-lime-500/20 dark:border-[#CEFD4A]/20">
                        {view === 'calendar' ? <CalendarIcon className="w-6 h-6" /> : <GanttIcon className="w-6 h-6" />}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Timeline View</h2>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest">Manage your task timeline</p>
                    </div>
                </div>

                <div className="flex p-1 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl shadow-inner">
                    <button
                        onClick={() => setView('calendar')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${view === 'calendar'
                            ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xl shadow-black/5 border border-black/5 dark:border-white/10'
                            : 'text-slate-400 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/40'
                            }`}
                    >
                        Calendar
                    </button>
                    <button
                        onClick={() => setView('timeline')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${view === 'timeline'
                            ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xl shadow-black/5 border border-black/5 dark:border-white/10'
                            : 'text-slate-400 dark:text-white/20 hover:text-slate-600 dark:hover:text-white/40'
                            }`}
                    >
                        Timeline
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0">
                {view === 'calendar' ? (
                    <CalendarView tasks={tasks} onViewTask={onViewTask} />
                ) : (
                    <GanttChart tasks={tasks} employees={employees} onViewTask={onViewTask} />
                )}
            </div>
        </div>
    );
};

export default TemporalView;
