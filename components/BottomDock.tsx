import React from 'react';
import { HomeIcon } from './icons/HomeIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { ViewColumnsIcon } from './icons/ViewColumnsIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { PlusIcon } from './icons/PlusIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PresentationChartLineIcon } from './icons/PresentationChartLineIcon';

interface BottomDockProps {
    currentView: string;
    onViewChange: (view: string) => void;
    activeSpaceId: string;
    isAdmin?: boolean;
}

type NavItem =
    | { id: string; icon: React.FC<{ className?: string }>; label: string; requiresSpace?: boolean; type?: undefined }
    | { type: 'separator'; id?: undefined; icon?: undefined; label?: undefined; requiresSpace?: undefined };

const BottomDock: React.FC<BottomDockProps> = ({
    currentView,
    onViewChange,
    activeSpaceId,
    isAdmin
}) => {

    const navItems: NavItem[] = isAdmin
        ? [
            { id: 'analytics', icon: HomeIcon, label: 'Home' }, // New Command Center (Default)
            { id: 'overview', icon: ListBulletIcon, label: 'Tasks' }, // Overseer View
            { id: 'timeline', icon: CalendarIcon, label: 'Timeline', requiresSpace: true },
        ]

        : [
            { id: 'home', icon: HomeIcon, label: 'Home' },
            { id: 'overview', icon: ChartBarIcon, label: 'Overview' },
            { id: 'members', icon: UsersIcon, label: 'Members', requiresSpace: true },
            { id: 'whiteboard', icon: PencilSquareIcon, label: 'Today' },
            { type: 'separator' },
            { id: 'board', icon: ViewColumnsIcon, label: 'Board', requiresSpace: true },
            { id: 'timeline', icon: CalendarIcon, label: 'Timeline', requiresSpace: true },
            { type: 'separator' },
            { id: 'settings', icon: Cog6ToothIcon, label: 'Settings', requiresSpace: true },
        ];


    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 p-2 bg-white/10 dark:bg-black/20 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-full shadow-2xl">

                {navItems.map((item, index) => {
                    if (item.type === 'separator') {
                        return <div key={`sep-${index}`} className="w-px h-5 bg-white/20 dark:bg-white/10 mx-1" />;
                    }

                    if (item.requiresSpace && !activeSpaceId) return null;

                    const isActive = currentView === item.id;
                    const Icon = item.icon!;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id!)}
                            className={`relative group p-3 rounded-full transition-all duration-300 ${isActive
                                ? 'bg-black/5 dark:bg-white/10 text-lime-600 dark:text-[#CEFD4A]'
                                : 'text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                                }`}
                            title={item.label}
                        >
                            <Icon className="w-6 h-6" />

                            {/* Active Indicator Dot */}
                            {isActive && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-lime-600 dark:bg-[#CEFD4A] rounded-full shadow-[0_0_8px_#CEFD4A]"></div>
                            )}

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 bg-white dark:bg-black/90 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap translate-y-2 group-hover:translate-y-0 shadow-xl">
                                {item.label}
                            </div>
                        </button>
                    );
                })}

            </div>
        </div>
    );


};

export default BottomDock;
