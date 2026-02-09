import React from 'react';
import { User, Employee } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { SearchIcon } from './icons/SearchIcon';
import { BellIcon } from './icons/BellIcon'; // Assuming we might want this, otherwise omit
import { MoonIcon } from './icons/MoonIcon';
import { SunIcon } from './icons/SunIcon';
import { useTheme } from '../context/ThemeContext';

interface TopNavProps {
    activeSpaceName: string;
    currentUserEmployee?: Employee;
    user: User;
    onOpenProfile: () => void;
    onLogout: () => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    currentView?: string;
    timelineViewMode?: 'calendar' | 'gantt';
    onTimelineViewModeChange?: (mode: 'calendar' | 'gantt') => void;
}

const TopNav: React.FC<TopNavProps> = ({
    activeSpaceName,
    currentUserEmployee,
    user,
    onOpenProfile,
    onLogout,
    searchTerm,
    onSearchChange,
    currentView,
    timelineViewMode,
    onTimelineViewModeChange
}) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="fixed top-0 left-0 right-0 h-24 px-8 z-50 flex items-center justify-between pointer-events-none">
            {/* Brand & Context */}
            <div className="flex items-center gap-6 pointer-events-auto">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="p-2.5 bg-lime-400 dark:bg-[#CEFD4A] rounded-2xl shadow-[0_0_20px_rgba(206,253,74,0.3)] transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
                        <SparklesIcon className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-slate-900 dark:text-white font-black text-lg tracking-tight">TaskFlow</span>
                </div>

                <div className="h-8 w-px bg-black/10 dark:bg-white/10"></div>

                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-lime-600 dark:text-[#CEFD4A] uppercase tracking-widest mb-0.5">Workspace</span>
                    <span className="text-slate-900 dark:text-white font-bold text-lg tracking-tight">{activeSpaceName}</span>
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4 pointer-events-auto">
                {/* View Mode Toggle (only for timeline) */}
                {currentView === 'timeline' && (
                    <div className="flex items-center bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-full p-1 mr-2 shadow-lg">
                        <button
                            onClick={() => onTimelineViewModeChange?.('calendar')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${timelineViewMode === 'calendar'
                                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
                                : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            Calendar
                        </button>
                        <button
                            onClick={() => onTimelineViewModeChange?.('gantt')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${timelineViewMode === 'gantt'
                                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
                                : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            Gantt
                        </button>
                    </div>
                )}

                {/* Search Pill */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <SearchIcon className="h-4 w-4 text-white/40 group-focus-within:text-[#CEFD4A] transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 text-slate-900 dark:text-white text-sm font-medium rounded-full py-2.5 pl-11 pr-6 placeholder:text-slate-500 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-lime-500/50 dark:focus:ring-[#CEFD4A]/50 focus:border-lime-500/50 dark:focus:border-[#CEFD4A]/50 transition-all w-64 hover:bg-white/80 dark:hover:bg-black/50"
                    />
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-3 bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-full text-slate-500 dark:text-white/60 hover:text-lime-600 dark:hover:text-[#CEFD4A] hover:bg-white dark:hover:bg-black/60 transition-all"
                >
                    {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                </button>

                {/* Profile */}
                <button
                    onClick={onOpenProfile}
                    className="flex items-center gap-3 pl-1 pr-4 py-1 bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-full hover:bg-white dark:hover:bg-black/60 hover:border-white/60 dark:hover:border-white/20 transition-all group"
                >
                    <div className="relative">
                        <img
                            src={currentUserEmployee?.avatarUrl}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border-2 border-transparent group-hover:border-[#CEFD4A] transition-all"
                        />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-lime-400 dark:bg-[#CEFD4A] border-2 border-white dark:border-black rounded-full"></div>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-xs font-bold text-slate-900 dark:text-white leading-none group-hover:text-lime-600 dark:group-hover:text-[#CEFD4A] transition-colors">
                            {user.fullName || user.username}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">Online</span>
                    </div>
                </button>
            </div>
        </header>
    );
};

export default TopNav;
