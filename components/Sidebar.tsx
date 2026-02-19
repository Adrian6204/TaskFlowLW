
import React from 'react';
import { User, Employee, Space, List } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { PlusIcon } from './icons/PlusIcon';
import { UserIcon } from './icons/UserIcon';
import { HomeIcon } from './icons/HomeIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { GanttIcon } from './icons/GanttIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { ViewColumnsIcon } from './icons/ViewColumnsIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';

interface SidebarProps {
  isOpen: boolean;
  activeSpaceId: string;
  activeListId?: number | null;
  spaces: Space[];
  lists: List[];
  currentView: string;
  onSelectSpace: (spaceId: string) => void;
  onViewChange: (view: string) => void;
  onToggle: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onCreateSpace: () => void;
  onJoinSpace: () => void;
  onCreateList: (spaceId: string) => void;
  onCreateTask: () => void;
  onSelectList: (listId: number | null) => void;
  currentUserEmployee?: Employee;
  user: User;
  compactMode?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeSpaceId,
  activeListId,
  spaces,
  lists,
  currentView,
  onSelectSpace,
  onViewChange,
  onToggle,
  onOpenProfile,
  onLogout,
  onCreateSpace,
  onJoinSpace,
  onCreateList,
  onCreateTask,
  onSelectList,
  currentUserEmployee,
  user,
  compactMode = false
}) => {
  const [expandedSpaceId, setExpandedSpaceId] = React.useState<string | null>(activeSpaceId || null);

  // Sync expanded space with active space
  React.useEffect(() => {
    if (activeSpaceId) {
      setExpandedSpaceId(activeSpaceId);
    }
  }, [activeSpaceId]);

  const mainNavItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'whiteboard', label: 'Task of Today', icon: PencilSquareIcon },
    // Conditionally add Team link for admins
    ...(user.isAdmin || user.role === 'super_admin' || user.position === 'Admin' ? [{ id: 'team', label: 'Team', icon: UsersIcon }] : []),
  ];

  const workspaceViews = [
    { id: 'list', label: 'List', icon: ListBulletIcon },
    { id: 'board', label: 'Board', icon: ViewColumnsIcon },
    { id: 'gantt', label: 'Gantt', icon: GanttIcon },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon },
  ];

  const handleSpaceClick = (spaceId: string) => {
    if (expandedSpaceId === spaceId) {
      // Already expanded, collapse it
      setExpandedSpaceId(null);
    } else {
      // Expand and select
      setExpandedSpaceId(spaceId);
      onSelectSpace(spaceId);
      onViewChange('list'); // Default to list view when selecting a space
    }
  };


  const handleViewClick = (spaceId: string, viewId: string) => {
    onSelectSpace(spaceId);
    onViewChange(viewId);
  };

  const isWorkspaceView = ['list', 'board', 'gantt', 'calendar', 'settings'].includes(currentView);

  return (
    <aside
      className={`${isOpen ? 'w-72' : 'w-24'} h-[calc(100%-2rem)] m-4 rounded-[32px] bg-white/10 dark:bg-black/40 backdrop-blur-[40px] border border-white/20 dark:border-white/5 flex flex-col transition-all duration-500 ease-out relative z-30 shadow-2xl shadow-black/10 dark:shadow-black/50`}
    >
      {/* Brand removed - now in TopNav */}
      <div className="mt-4"></div>

      {/* Navigation */}
      <div className="flex-1 py-2 px-4 overflow-y-auto scrollbar-none">
        {/* Create Task Action */}
        <button
          onClick={onCreateTask}
          className={`w-full flex items-center gap-3 px-4 py-3 mb-6 rounded-2xl bg-gradient-to-r from-lime-500 to-emerald-500 text-black shadow-lg shadow-lime-500/20 hover:shadow-lime-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group ${!isOpen && 'justify-center px-0'}`}
        >
          <PlusIcon className="w-5 h-5 text-black" />
          {isOpen && <span className="text-sm font-black uppercase tracking-wider">New Task</span>}
          {!isOpen && (
            <div className="absolute left-full ml-4 px-4 py-2 bg-lime-500 text-black text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none shadow-xl transition-all duration-200 translate-x-2 group-hover:translate-x-0">
              New Task
            </div>
          )}
        </button>

        {/* Main Navigation (Dashboard) */}
        <div className={`px-4 mb-2 text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest ${!isOpen && 'text-center'}`}>
          {isOpen ? 'Overview' : '---'}
        </div>
        <div className="space-y-2 mb-8">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-[20px] text-sm font-bold transition-all duration-300 group relative
                ${currentView === item.id && !isWorkspaceView
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg shadow-slate-200 dark:shadow-white/10'
                  : 'text-slate-500 dark:text-white/50 hover:bg-slate-900/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                } ${!isOpen && 'justify-center px-0'}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {isOpen && <span>{item.label}</span>}
              {!isOpen && (
                <div className="absolute left-full ml-4 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-[#1E1E1E] text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none shadow-xl transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Spaces Section with Nested Views */}
        <div className={compactMode ? 'mt-2' : 'mt-4'}>
          <div className={`px-4 mb-3 flex items-center justify-between ${!isOpen && 'justify-center hidden'}`}>
            <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">
              {isOpen ? 'Workspaces' : ''}
            </span>
            {isOpen && (
              <button
                onClick={onCreateSpace}
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                title="Create Space"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className={compactMode ? 'space-y-1' : 'space-y-4'}>
            {spaces.map((space) => (
              <div key={space.id} className="relative">
                {/* Space Header */}
                <button
                  onClick={() => handleSpaceClick(space.id)}
                  className={`w-full flex items-center gap-3 px-4 ${compactMode ? 'py-2' : 'py-3'} rounded-[20px] text-sm font-bold transition-all duration-300 group relative
                    ${activeSpaceId === space.id && !activeListId && isWorkspaceView
                      ? 'bg-slate-900/5 dark:bg-[#2A2A2D] text-slate-900 dark:text-white border border-slate-900/5 dark:border-white/5'
                      : 'text-slate-500 dark:text-white/50 hover:bg-slate-900/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    } ${!isOpen && 'justify-center px-0'}`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${activeSpaceId === space.id ? 'bg-orange-500 shadow-orange-500/50' : 'bg-white/20'}`} />
                  {isOpen && (
                    <>
                      <span className="flex-1 text-left truncate">{space.name}</span>
                      <svg
                        className={`w-4 h-4 text-white/30 transition-transform duration-300 ${expandedSpaceId === space.id ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                  {!isOpen && (
                    <div className="absolute left-full ml-4 px-4 py-2 bg-[#2A2A2D] text-white border border-white/10 text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none shadow-xl transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                      {space.name}
                    </div>
                  )}
                </button>

                {/* Nested Lists & Views */}
                {isOpen && expandedSpaceId === space.id && (
                  <div className="mt-2 space-y-1 pl-4 border-l border-white/5 ml-4">
                    {/* Lists Section */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between px-3 py-1 mb-1 group/header">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">Lists</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onCreateList(space.id); }}
                          className="text-slate-400 dark:text-white/20 hover:text-slate-900 dark:hover:text-white transition-colors opacity-0 group-hover/header:opacity-100"
                        >
                          <PlusIcon className="w-3 h-3" />
                        </button>
                      </div>
                      {lists.filter(l => l.spaceId === space.id).map(list => (
                        <button
                          key={list.id}
                          onClick={() => {
                            onSelectSpace(space.id);
                            onSelectList(list.id);
                            onViewChange('list');
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200
                              ${activeListId === list.id
                              ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                            }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${list.color ? '' : 'bg-current opacity-50'}`} style={{ backgroundColor: list.color }} />
                          <span className="truncate">{list.name}</span>
                        </button>
                      ))}
                      {lists.filter(l => l.spaceId === space.id).length === 0 && (
                        <div className="px-3 py-2 text-[10px] text-slate-400 dark:text-white/20 italic">No lists yet</div>
                      )}
                    </div>

                    {/* Views (apply to current selection) */}
                    <div className="pt-2 border-t border-slate-200/50 dark:border-white/5">
                      <span className="px-3 text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest block mb-1">Views</span>
                      {workspaceViews.map((view) => (
                        <button
                          key={view.id}
                          onClick={() => handleViewClick(space.id, view.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 relative
                            ${activeSpaceId === space.id && currentView === view.id
                              ? 'text-orange-600 dark:text-orange-400 bg-orange-500/10'
                              : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                            }`}
                        >
                          <view.icon className="w-3.5 h-3.5" />
                          <span>{view.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Join/Create Space Actions */}
            {isOpen && spaces.length > 0 && (
              <div className="pt-2 space-y-2">
                <button
                  onClick={onJoinSpace}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all duration-300 border border-transparent hover:border-slate-200 dark:hover:border-white/5"
                >
                  <UserIcon className="w-5 h-5" />
                  <span>Join with Code</span>
                </button>
              </div>
            )}

            {spaces.length === 0 && isOpen && (
              <div className="px-4 py-6 text-center bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5 mx-2">
                <p className="text-xs font-medium text-slate-500 dark:text-white/40 mb-4">No workspaces yet</p>
                <button
                  onClick={onCreateSpace}
                  className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-neutral-200 transition-all duration-300 mb-2"
                >
                  Create One
                </button>
                <button
                  onClick={onJoinSpace}
                  className="w-full py-2.5 bg-transparent border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 text-sm font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all duration-300"
                >
                  Join with Code
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-4 mx-2 mb-2 border-t border-slate-200/50 dark:border-white/5 flex items-center gap-2">
        <button
          onClick={onOpenProfile}
          className={`flex items-center gap-3 flex-1 p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-300 ${!isOpen && 'justify-center'}`}
        >
          <div className="relative flex-shrink-0">
            <img
              src={currentUserEmployee?.avatarUrl}
              alt=""
              className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-[#1E1E1E] ring-2 ring-indigo-500/20 dark:ring-white/10 transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#1E1E1E] rounded-full"></div>
          </div>
          {isOpen && (
            <div className="text-left overflow-hidden">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentUserEmployee?.name || user.username}</p>
              <p className="text-[10px] text-slate-400 dark:text-white/40 font-bold uppercase tracking-wider">Online</p>
            </div>
          )}
        </button>

        {isOpen && (
          <button
            onClick={onLogout}
            className="p-3 text-slate-400 dark:text-white/30 hover:text-red-500 dark:hover:text-white hover:bg-red-50 dark:hover:bg-white/10 rounded-xl transition-all duration-300"
            title="Sign Out"
          >
            <LogoutIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
