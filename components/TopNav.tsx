import React from 'react';
import { Link } from 'react-router-dom';
import { User, Employee } from '../types';
import { Logo } from './Logo';
import { MoonIcon } from './icons/MoonIcon';
import { SunIcon } from './icons/SunIcon';
import { useTheme } from '../context/ThemeContext';
import { Space } from '../types';
import { cardAccents } from './WorkspaceHomePage';
import { usePresenceContext, statusColor, statusLabel } from '../context/PresenceContext';

interface TopNavProps {
    activeSpaceName: string;
    currentUserEmployee?: Employee;
    user: User;
    onOpenProfile: () => void;
    onLogout: () => void;
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
    currentView,
    timelineViewMode,
    onTimelineViewModeChange,
    onToggleSidebar,
    hideBrandOnDesktop,
    currentSpace
}) => {
    const { theme, toggleTheme } = useTheme();
    const { myStatus } = usePresenceContext();

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


            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6 md:gap-8 pointer-events-auto relative">

                {/* Workspace Label */}
                <div className="hidden md:flex flex-col items-end">
                    <span className={`text-[9px] md:text-[10px] font-bold ${accent ? `${accent.text} ${accent.darkText}` : 'text-lime-600 dark:text-[#CEFD4A]'} uppercase tracking-[0.15em] opacity-80`}>Workspace</span>
                    <span className="text-slate-900 dark:text-white font-extrabold text-sm md:text-lg tracking-tight truncate max-w-[180px] md:max-w-[260px] shadow-sm">
                        {activeSpaceName}
                    </span>
                </div>

                {/* Actions Group — no pill container, floated freely */}
                <div className="flex items-center gap-1">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`p-2.5 rounded-full text-slate-500 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/8 transition-all duration-300 ${accent ? accent.text : 'hover:text-lime-600 dark:hover:text-[#CEFD4A]'}`}
                    >
                        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                    </button>

                    {/* Profile */}
                    <button
                        onClick={onOpenProfile}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/8 transition-all duration-300 group"
                    >
                        <div className="relative">
                            <img
                                src={currentUserEmployee?.avatarUrl || user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=random`}
                                alt=""
                                className={`w-11 h-11 rounded-full object-cover ring-2 transition-all duration-500 group-hover:scale-105 ${user.isAdmin ? 'ring-primary-500/60' : (accent ? `ring-${accent.from.split('-')[1]}-400/50` : 'ring-lime-400/50')}`}
                            />
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white dark:border-black rounded-full transition-colors duration-500 ${statusColor(myStatus)} ${myStatus === 'online' ? 'animate-pulse' : ''}`}></div>
                        </div>
                        <div className="hidden lg:flex flex-col items-start leading-tight">
                            <span className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight">
                                {user.fullName || user.username}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${
                                myStatus === 'online'
                                  ? 'text-lime-600 dark:text-lime-400'
                                  : myStatus === 'idle'
                                  ? 'text-amber-500 dark:text-amber-400'
                                  : 'text-slate-400 dark:text-white/30'
                              }`}>
                                {statusLabel(myStatus)}
                            </span>
                        </div>
                    </button>
                </div>

            </div >
        </header >
    );
};

export default TopNav;
