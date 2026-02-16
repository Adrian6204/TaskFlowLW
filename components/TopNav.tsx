import React from 'react';
import { Link } from 'react-router-dom';
import { User, Employee } from '../types';
import { Logo } from './Logo';
import { SearchIcon } from './icons/SearchIcon';
import { BellIcon } from './icons/BellIcon'; // Assuming we might want this, otherwise omit
import { MoonIcon } from './icons/MoonIcon';
import { SunIcon } from './icons/SunIcon';
import { useTheme } from '../context/ThemeContext';
import { useAppNotifications } from '../context/AppNotificationContext';
import NotificationPanel from './NotificationPanel';

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
    onToggleSidebar?: () => void;
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
    onTimelineViewModeChange,
    onToggleSidebar
}) => {
    const { theme, toggleTheme } = useTheme();
    const { unreadCount } = useAppNotifications();
    const [isNotificationPanelOpen, setNotificationPanelOpen] = React.useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 h-20 md:h-24 px-4 md:px-8 z-50 flex items-center justify-between pointer-events-none">
            {/* Brand & Context */}
            <div className="flex items-center gap-4 md:gap-6 pointer-events-auto">


                <Link to="/app/home" className="flex items-center gap-3 md:gap-4 group cursor-pointer">
                    <div className="transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 drop-shadow-[0_0_15px_rgba(206,253,74,0.4)]">
                        <Logo className="w-8 h-8 md:w-10 md:h-10" />
                    </div>
                    <span className="text-slate-900 dark:text-white font-extrabold text-lg md:text-xl tracking-[-0.03em] hidden sm:block">TaskFlow</span>
                </Link>

                <div className="h-6 w-px bg-black/10 dark:bg-white/10 hidden sm:block"></div>

                <div className="flex flex-col hidden sm:flex">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] md:text-[10px] font-bold text-lime-600 dark:text-[#CEFD4A] uppercase tracking-widest mb-0.5">Workspace</span>
                        {user.isAdmin && (
                            <span className="px-1.5 py-0.5 rounded-[4px] bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-[8px] font-black uppercase tracking-wider leading-none">
                                Admin Mode
                            </span>
                        )}
                    </div>
                    <span className="text-slate-900 dark:text-white font-bold text-sm md:text-lg tracking-tight truncate max-w-[120px] md:max-w-none">{activeSpaceName}</span>
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
                <div className="relative group flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <SearchIcon className="h-4 w-4 text-white/40 group-focus-within:text-[#CEFD4A] transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 text-slate-900 dark:text-white text-sm font-medium rounded-full py-2.5 pl-11 pr-10 placeholder:text-slate-500 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-lime-500/50 dark:focus:ring-[#CEFD4A]/50 focus:border-lime-500/50 dark:focus:border-[#CEFD4A]/50 transition-all w-64 hover:bg-white/80 dark:hover:bg-black/50"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 p-1 rounded-full text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all animate-in fade-in zoom-in duration-200"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-3 bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-full text-slate-500 dark:text-white/60 hover:text-lime-600 dark:hover:text-[#CEFD4A] hover:bg-white dark:hover:bg-black/60 transition-all"
                >
                    {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                </button>

                {/* Notifications */}
                <button
                    onClick={() => setNotificationPanelOpen(true)}
                    className="relative p-3 bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-full text-slate-500 dark:text-white/60 hover:text-lime-600 dark:hover:text-[#CEFD4A] hover:bg-white dark:hover:bg-black/60 transition-all"
                >
                    <BellIcon className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 w-4 h-4 bg-lime-500 dark:bg-[#CEFD4A] text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-black animate-in zoom-in">
                            {unreadCount}
                        </span>
                    )}
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
                            className={`w-9 h-9 rounded-full object-cover border-2 transition-all ${user.isAdmin ? 'border-purple-500 dark:border-purple-400' : 'border-transparent group-hover:border-[#CEFD4A]'}`}
                        />
                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white dark:border-black rounded-full ${user.isAdmin ? 'bg-purple-500 dark:bg-purple-400' : 'bg-lime-400 dark:bg-[#CEFD4A]'}`}></div>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-xs font-bold text-slate-900 dark:text-white leading-none group-hover:text-lime-600 dark:group-hover:text-[#CEFD4A] transition-colors">
                            {user.fullName || user.username}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${user.isAdmin ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-white/40'}`}>
                            {user.isAdmin ? 'Administrator' : 'Online'}
                        </span>
                    </div>
                </button>

                <NotificationPanel
                    isOpen={isNotificationPanelOpen}
                    onClose={() => setNotificationPanelOpen(false)}
                />
            </div>
        </header>
    );
};

export default TopNav;
