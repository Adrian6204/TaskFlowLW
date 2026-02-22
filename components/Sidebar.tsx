
import React from 'react';
import { User, Employee, Space, List, Task, TaskStatus } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { UserIcon } from './icons/UserIcon';
import { HomeIcon } from './icons/HomeIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { ViewColumnsIcon } from './icons/ViewColumnsIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { LogoutIcon } from './icons/LogoutIcon';

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
  isSuperAdmin?: boolean;
  currentSpaceRole?: 'admin' | 'member';
  allUserTasks?: Task[];
}

// Tiny arrow-left icon inline
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
  </svg>
);

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
  isSuperAdmin = false,
  currentSpaceRole = 'member',
  allUserTasks = [],
}) => {
  const isInsideWorkspace = !!activeSpaceId;
  const currentSpace = spaces.find(s => s.id === activeSpaceId);

  // ── Workspace-specific navigation items ──────────────────────────────────
  const workspaceViews: { id: string; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Overview', icon: HomeIcon },
    { id: 'board', label: 'Task Board', icon: ViewColumnsIcon },
    { id: 'whiteboard', label: 'Whiteboard', icon: PencilSquareIcon },
    { id: 'timeline', label: 'Calendar', icon: CalendarIcon },
    { id: 'members', label: 'Members', icon: UsersIcon },
    ...(currentSpaceRole === 'admin' || isSuperAdmin
      ? [{ id: 'overview', label: 'Analytics', icon: ChartBarIcon }]
      : []
    ),
    ...(isSuperAdmin
      ? [{ id: 'team', label: 'User Mgmt', icon: UsersIcon }]
      : []
    ),
    ...(currentSpaceRole === 'admin' || isSuperAdmin
      ? [{ id: 'settings', label: 'Settings', icon: Cog6ToothIcon }]
      : []
    ),
  ];

  return (
    <aside
      className={`${isOpen ? 'w-72' : 'w-24'} h-[calc(100%-2rem)] m-4 rounded-[32px] bg-white/10 dark:bg-black/40 backdrop-blur-[40px] border border-white/20 dark:border-white/5 flex flex-col transition-all duration-500 ease-out relative z-30 shadow-2xl shadow-black/10 dark:shadow-black/50`}
    >
      <div className="mt-4" />

      <div className="flex-1 py-2 px-4 overflow-y-auto scrollbar-none flex flex-col gap-2">

        {/* ── New Task button ─────────────────────────────── */}
        {isInsideWorkspace && (
          <button
            onClick={onCreateTask}
            className={`w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-2xl bg-gradient-to-r from-lime-500 to-emerald-500 text-black shadow-lg shadow-lime-500/20 hover:shadow-lime-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group ${!isOpen && 'justify-center px-0'}`}
          >
            <PlusIcon className="w-5 h-5 text-black" />
            {isOpen && <span className="text-sm font-black uppercase tracking-wider">New Task</span>}
            {!isOpen && (
              <div className="absolute left-full ml-4 px-4 py-2 bg-lime-500 text-black text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none shadow-xl transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                New Task
              </div>
            )}
          </button>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            MODE A — HOME: cross-workspace task insights
        ════════════════════════════════════════════════════════════════ */}
        {!isInsideWorkspace && (() => {
          const now = new Date();
          const todayStr = now.toISOString().split('T')[0];
          const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

          const myTasks = allUserTasks.filter(t => t.assigneeId === user.employeeId && t.status !== TaskStatus.DONE);
          const overdue = myTasks.filter(t => t.dueDate && t.dueDate < todayStr);
          const dueToday = myTasks.filter(t => t.dueDate === todayStr);
          const inProg = myTasks.filter(t => t.status === TaskStatus.IN_PROGRESS);
          const upcoming = myTasks
            .filter(t => t.dueDate && t.dueDate > todayStr && new Date(t.dueDate) <= weekLater)
            .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
            .slice(0, 5);

          const fmt = (d: string) => {
            const diff = Math.round((new Date(d).getTime() - now.getTime()) / 86400000);
            if (diff === 0) return 'Today';
            if (diff === 1) return 'Tomorrow';
            return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          };

          return (
            <>
              {/* Header */}
              {isOpen && (
                <div className="px-4 mb-3 text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">
                  My Tasks
                </div>
              )}

              {/* Stats row */}
              {isOpen ? (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'Overdue', count: overdue.length, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/20' },
                    { label: 'Due Today', count: dueToday.length, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20' },
                    { label: 'In Progress', count: inProg.length, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20' },
                  ].map(({ label, count, color, bg, border }) => (
                    <div key={label} className={`flex flex-col items-center justify-center py-3 rounded-2xl border ${bg} ${border}`}>
                      <span className={`text-xl font-black ${color}`}>{count}</span>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-wide mt-0.5 text-center leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                // Collapsed: show dot indicators
                <div className="flex flex-col items-center gap-2 mb-4">
                  {overdue.length > 0 && <div className="w-2 h-2 rounded-full bg-red-500" title={`${overdue.length} overdue`} />}
                  {dueToday.length > 0 && <div className="w-2 h-2 rounded-full bg-amber-500" title={`${dueToday.length} due today`} />}
                  {inProg.length > 0 && <div className="w-2 h-2 rounded-full bg-blue-500" title={`${inProg.length} in progress`} />}
                </div>
              )}

              {/* Upcoming deadlines */}
              {isOpen && upcoming.length > 0 && (
                <>
                  <div className="px-4 mb-2 text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">
                    Upcoming
                  </div>
                  <div className="space-y-1">
                    {upcoming.map(task => {
                      const space = spaces.find(s => s.id === task.spaceId);
                      return (
                        <button
                          key={task.id}
                          onClick={() => onSelectSpace(task.spaceId)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-[16px] text-left hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200 group"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/20 group-hover:bg-violet-500 transition-colors flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-700 dark:text-white/70 truncate group-hover:text-slate-900 dark:group-hover:text-white">
                              {task.title}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-white/30 truncate">
                              {space?.name || '—'}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 whitespace-nowrap flex-shrink-0">
                            {fmt(task.dueDate!)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {isOpen && myTasks.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <p className="text-2xl mb-2">✓</p>
                  <p className="text-xs font-semibold text-slate-400 dark:text-white/30">All caught up!</p>
                </div>
              )}
            </>
          );
        })()}


        {/* ═══════════════════════════════════════════════════════════════
            MODE B — WORKSPACE: focused navigation
        ════════════════════════════════════════════════════════════════ */}
        {isInsideWorkspace && (
          <>
            {/* Back to Home */}
            <button
              onClick={() => onViewChange('home')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-[20px] text-sm font-bold text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all duration-300 mb-1 group relative ${!isOpen && 'justify-center px-0'}`}
            >
              <ArrowLeftIcon className="w-4 h-4 flex-shrink-0" />
              {isOpen && <span>All Workspaces</span>}
              {!isOpen && (
                <div className="absolute left-full ml-4 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-[#1E1E1E] text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none shadow-xl transition-all duration-200">
                  All Workspaces
                </div>
              )}
            </button>

            {/* Current workspace header */}
            {isOpen && currentSpace && (
              <div className="px-4 py-3 mb-2 rounded-2xl bg-white/5 dark:bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-orange-500/30 flex-shrink-0">
                    {currentSpace.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{currentSpace.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-wider font-semibold mt-0.5">
                      {currentSpaceRole === 'admin' || isSuperAdmin ? 'Admin' : 'Member'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Workspace nav label */}
            <div className={`px-4 mb-1 text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest ${!isOpen && 'text-center'}`}>
              {isOpen ? 'Navigate' : '—'}
            </div>

            {/* Workspace view navigation */}
            <div className="space-y-1">
              {workspaceViews.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-[20px] text-sm font-bold transition-all duration-300 group relative
                    ${currentView === item.id
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

            {/* Lists sub-section */}
            {isOpen && lists.filter(l => l.spaceId === activeSpaceId).length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-white/5">
                <div className="flex items-center justify-between px-4 py-1 mb-1 group/header">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">Lists</span>
                  <button
                    onClick={() => onCreateList(activeSpaceId)}
                    className="text-slate-400 dark:text-white/20 hover:text-slate-900 dark:hover:text-white transition-colors opacity-0 group-hover/header:opacity-100"
                  >
                    <PlusIcon className="w-3 h-3" />
                  </button>
                </div>
                {lists.filter(l => l.spaceId === activeSpaceId).map(list => (
                  <button
                    key={list.id}
                    onClick={() => { onSelectList(list.id); onViewChange('board'); }}
                    className={`w-full flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200
                      ${activeListId === list.id
                        ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: list.color || '#6b7280' }}
                    />
                    <span className="truncate">{list.name}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

      </div>

      {/* ── User Footer ────────────────────────────────────────────── */}
      <div className={`p-4 mx-2 mb-2 border-t border-slate-200/50 dark:border-white/5 flex items-center gap-2 ${!isOpen && 'justify-center'}`}>
        <button
          onClick={onOpenProfile}
          className={`flex items-center gap-3 flex-1 p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-300 ${!isOpen && 'justify-center flex-none'}`}
        >
          {currentUserEmployee?.avatarUrl ? (
            <img src={currentUserEmployee.avatarUrl} alt="" className="w-9 h-9 rounded-2xl object-cover border border-white/10 flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
              {(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          {isOpen && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.fullName || user.username}</p>
              <p className="text-xs text-slate-400 dark:text-white/30 capitalize truncate">
                {isSuperAdmin ? 'Super Admin' : currentSpaceRole === 'admin' ? 'Admin' : 'Member'}
              </p>
            </div>
          )}
        </button>
        {isOpen && (
          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-slate-400 dark:text-white/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 flex-shrink-0"
            title="Logout"
          >
            <LogoutIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
