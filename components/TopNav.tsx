import React from 'react';
import { Link } from 'react-router-dom';
import { User, Employee } from '../types';
import { Logo } from './Logo';
import { SearchIcon } from './icons/SearchIcon';
import { MoonIcon } from './icons/MoonIcon';
import { SunIcon } from './icons/SunIcon';
import { useTheme } from '../context/ThemeContext';
import { Space } from '../types';
import { cardAccents } from './WorkspaceHomePage';

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
    hideBrandOnDesktop?: boolean;
    currentSpace?: Space;
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
    onToggleSidebar,
    hideBrandOnDesktop,
    currentSpace
}) => {
    const { theme, toggleTheme } = useTheme();

    // Theme support
    const themeIndex = (currentSpace?.theme && !isNaN(parseInt(currentSpace.theme)))
        ? parseInt(currentSpace.theme) % cardAccents.length
        : (currentSpace ? 0 : -1);
    const accent = themeIndex >= 0 ? cardAccents[themeIndex] : null;

    return (
        <header className="fixed top-0 left-0 right-0 h-20 md:h-24 px-4 md:px-8 flex-none z-50 flex items-center justify-between pointer-events-none">
            {/* Ambient background blur for the header area */}
            <div className="absolute inset-0 bg-white/5 dark:bg-black/5 backdrop-blur-[2px] border-b border-black/[0.03] dark:border-white/[0.03] pointer-events-none"></div>

            {/* Brand & Context */}
            <div className="flex items-center gap-4 md:gap-8 pointer-events-auto relative">
                <Link to="/app/home" className={`flex items-center gap-4 group cursor-pointer ${hideBrandOnDesktop ? 'md:hidden' : ''}`}>
                    <div className="relative flex items-center gap-3">
                        <div className="transition-all duration-500 group-hover:scale-105 group-hover:drop-shadow-[0_0_20px_rgba(206,253,74,0.3)] flex items-center gap-3">
                            <img src="/lifewood.png" alt="Lifewood" className="h-5 md:h-7 object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
                            <div className="w-px h-6 bg-slate-900/10 dark:bg-white/10"></div>
                            <Logo className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-slate-900 dark:text-white font-black text-xl md:text-2xl tracking-tighter leading-none">TaskFlow</span>
                            <span className="text-[8px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-[0.15em] mt-0.5 ml-0.5">Powered by Lifewood PH</span>
                        </div>
                    </div>
                </Link>

                <div className={`h-8 w-px bg-black/5 dark:bg-white/5 hidden lg:block ${hideBrandOnDesktop ? 'md:hidden' : ''}`}></div>

                <div className="flex flex-col hidden sm:flex">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[9px] md:text-[10px] font-bold ${accent ? `${accent.text} ${accent.darkText}` : 'text-lime-600 dark:text-[#CEFD4A]'} uppercase tracking-[0.15em] opacity-80`}>Workspace</span>
                    </div>
                    <span className="text-slate-900 dark:text-white font-extrabold text-sm md:text-lg tracking-tight truncate max-w-[150px] md:max-w-none shadow-sm">
                        {activeSpaceName}
                    </span>
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 md:gap-4 pointer-events-auto relative">

                {/* Search Bar - Premium Glass */}
                <div className="relative group hidden md:flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <SearchIcon className="h-4 w-4 text-slate-400 group-focus-within:text-lime-500 dark:group-focus-within:text-[#CEFD4A] transition-colors duration-300" />
                    </div>
                    <input
                        type="text"
                        placeholder="Quick search..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className={`bg-white/40 dark:bg-black/20 backdrop-blur-2xl border border-white/60 dark:border-white/5 text-slate-900 dark:text-white text-sm font-semibold rounded-2xl py-2.5 pl-11 pr-10 placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 ${accent ? `focus:ring-${accent.from.split('-')[1]}-500/30` : 'focus:ring-lime-500/30'} transition-all duration-300 w-64 md:w-80 hover:bg-white/60 dark:hover:bg-black/30 shadow-sm focus:shadow-lg focus:scale-[1.01]`}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-red-500 transition-all duration-200"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Actions Group */}
                <div className="flex items-center gap-2 bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/60 dark:border-white/5 p-1 rounded-2xl shadow-sm">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`p-2.5 rounded-xl text-slate-500 dark:text-white/60 hover:bg-white dark:hover:bg-white/5 transition-all duration-300 ${accent ? accent.text : 'hover:text-lime-600'}`}
                    >
                        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                    </button>

                    <div className="w-px h-5 bg-black/5 dark:bg-white/5 mx-0.5"></div>

                    {/* Profile */}
                    <button
                        onClick={onOpenProfile}
                        className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-all duration-300 group"
                    >
                        <div className="relative">
                            <img
                                src={currentUserEmployee?.avatarUrl || user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=random`}
                                alt=""
                                className={`w-8 h-8 rounded-lg object-cover border transition-all duration-500 ${user.isAdmin ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-white/20'}`}
                            />
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white dark:border-black rounded-full ${user.isAdmin ? 'bg-primary-500' : (accent ? `bg-gradient-to-br ${accent.from} ${accent.to}` : 'bg-lime-400')}`}></div>
                        </div>
                        <div className="hidden lg:flex flex-col items-start leading-tight">
                            <span className="text-[11px] font-black text-slate-900 dark:text-white tracking-tight">
                                {user.fullName || user.username}
                            </span>
                            <span className={`text-[8px] font-bold uppercase tracking-widest ${user.isAdmin ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-white/30'}`}>
                                {user.isAdmin ? 'Admin' : 'Online'}
                            </span>
                        </div>
                    </button>
                </div>

            </div >
        </header >
    );
};

export default TopNav;
