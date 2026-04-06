
import React from 'react';
import { HomeIcon } from './icons/HomeIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { UsersIcon } from './icons/UsersIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { ViewColumnsIcon } from './icons/ViewColumnsIcon';

interface MobileBottomNavProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onOpenProfile: () => void;
  hasActiveWorkspace: boolean;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onViewChange,
  onOpenProfile,
  hasActiveWorkspace,
}) => {
  const items = [
    { id: 'home', label: 'Home', icon: HomeIcon, action: () => onViewChange('home') },
    { 
      id: 'board', 
      label: 'Tasks', 
      icon: ListBulletIcon, 
      action: () => hasActiveWorkspace ? onViewChange('board') : onViewChange('home'),
      disabled: !hasActiveWorkspace 
    },
    { 
      id: 'summary', 
      label: 'Hub', 
      icon: UsersIcon, 
      action: () => hasActiveWorkspace ? onViewChange('summary') : onViewChange('home'),
      disabled: !hasActiveWorkspace 
    },
    { id: 'profile', label: 'Settings', icon: Cog6ToothIcon, action: onOpenProfile },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[40] md:hidden pb-safe mb-2">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-white/80 dark:bg-black/60 backdrop-blur-[20px] border-t border-white/20 dark:border-white/5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]" />
      
      <div className="relative flex items-center justify-around h-16 sm:h-20 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isDisabled = item.disabled;

          return (
            <button
              key={item.id}
              onClick={item.action}
              disabled={isDisabled}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-300 relative group ${isDisabled ? 'opacity-20 grayscale cursor-not-allowed' : ''}`}
            >
              {/* Active Indicator Dot */}
              {isActive && (
                <div className="absolute -top-1 w-12 h-1 bg-gradient-to-r from-lime-400 to-emerald-400 rounded-full animate-in fade-in zoom-in duration-300" />
              )}
              
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 scale-110' : 'text-slate-400 dark:text-white/30 group-active:scale-90'}`}>
                <Icon className="w-6 h-6" />
              </div>
              
              <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-white/20'}`}>
                {item.label}
              </span>

              {/* Tap feedback ripple (simplified) */}
              <div className="absolute inset-0 bg-black/5 dark:bg-white/5 opacity-0 active:opacity-100 rounded-full transition-opacity m-2" />
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
