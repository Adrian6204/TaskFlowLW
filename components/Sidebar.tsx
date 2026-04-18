
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Employee, Space, Task, TaskStatus } from '../types';
import { TASK_STATUS_CONFIG } from '../constants/taskStatusConfig';
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
import { GanttIcon } from './icons/GanttIcon';
import { PresentationChartLineIcon } from './icons/PresentationChartLineIcon';
import { cardAccents } from './WorkspaceHomePage';
import { usePreferences } from './hooks/usePreferences';

interface SidebarProps {
  isOpen: boolean;
  activeSpaceId: string;
  spaces: Space[];
  currentView: string;
  onSelectSpace: (spaceId: string) => void;
  onViewChange: (view: string) => void;
  onToggle: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onCreateSpace: () => void;
  onJoinSpace: () => void;
  onCreateTask: () => void;
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
  spaces,
  currentView,
  onSelectSpace,
  onViewChange,
  onToggle,
  onOpenProfile,
  onLogout,
  onCreateSpace,
  onJoinSpace,
  onCreateTask,
  currentUserEmployee,
  user,
  isSuperAdmin = false,
  currentSpaceRole = 'member',
  allUserTasks = [],
}) => {
  const navigate = useNavigate();
  const [preferences] = usePreferences();
  const isInsideWorkspace = !!activeSpaceId;
  const currentSpace = spaces.find(s => s.id === activeSpaceId);

  // Use stored theme index if valid, otherwise cycle
  const themeIndex = (currentSpace?.theme && !isNaN(parseInt(currentSpace.theme)))
    ? parseInt(currentSpace.theme) % cardAccents.length
    : spaces.indexOf(currentSpace!) % cardAccents.length;
  const accent = cardAccents[themeIndex >= 0 ? themeIndex : 0];

  // ── Workspace-specific navigation items ──────────────────────────────────
  const workspaceViews: { id: string; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Dashboard', icon: HomeIcon },
    { id: 'board', label: 'Task Board', icon: ViewColumnsIcon },
    { id: 'gantt', label: 'Gantt Chart', icon: GanttIcon },
    { id: 'members', label: 'Members', icon: UsersIcon },
    ...(currentSpaceRole === 'admin' || isSuperAdmin
      ? [
        { id: 'settings', label: 'Settings', icon: Cog6ToothIcon }
      ]
      : []
    ),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onToggle}
      />

      <aside
        className={`fixed md:relative inset-y-0 left-0 z-[60] md:z-30 
          ${isOpen ? 'w-72 translate-x-0' : 'w-24 -translate-x-full md:translate-x-0'} 
          h-[calc(100%-1rem)] md:h-[calc(100%-2rem)] 
          m-2 md:m-4 rounded-[24px] md:rounded-[32px] 
          ${preferences.performanceMode ? 'bg-white/95 dark:bg-black/95 backdrop-blur-none border-slate-200 dark:border-white/10' : 'bg-white/80 dark:bg-black/40 backdrop-blur-[40px] border-white/20 dark:border-white/5'} 
          border flex flex-col transition-all duration-500 ease-out shadow-2xl shadow-black/10 dark:shadow-black/50 overflow-hidden`}
      >
        <div className="mt-4" />

      <div className="flex-1 py-2 px-4 overflow-y-auto scrollbar-none flex flex-col gap-2 pt-safe-top pb-safe">

        {/* ── New Task button ─────────────────────────────── */}
        {isInsideWorkspace && (
          <div className={`relative mb-2 ${!isOpen && 'flex justify-center'}`}>
            {/* Pulsing glow ring */}
            {isOpen && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-lime-400 to-emerald-400 blur-md opacity-50 animate-pulse pointer-events-none" />
            )}
            <button
              onClick={onCreateTask}
              className={`relative w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl overflow-hidden
                bg-gradient-to-r from-lime-400 via-emerald-400 to-lime-400
                text-black font-black
                shadow-lg shadow-lime-500/30
                hover:shadow-xl hover:shadow-lime-500/50
                hover:scale-[1.03] active:scale-[0.97]
                transition-all duration-300 group
                ${!isOpen && 'justify-center px-0 w-12 h-12 rounded-2xl'}`}
              style={{ backgroundSize: '200% 100%', backgroundPosition: '0% 0%' }}
            >
              {/* Shimmer sweep */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none" />

              {/* Plus icon with spin on hover */}
              <div className="relative flex-shrink-0 w-5 h-5 group-hover:rotate-90 transition-transform duration-300">
                <PlusIcon className="w-5 h-5 text-black" />
              </div>

              {isOpen && (
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-sm font-black uppercase tracking-widest leading-none">New Task</span>
                  <span className="text-[9px] font-bold opacity-60 tracking-wider leading-none mt-0.5">Click to add</span>
                </div>
              )}

              {/* Sparkle badge */}
              {isOpen && (
                <div className="ml-auto flex-shrink-0 w-2 h-2 rounded-full bg-white/70 animate-ping" />
              )}

              {/* Tooltip when collapsed */}
              {!isOpen && (
                <div className="absolute left-full ml-4 px-4 py-2 bg-lime-500 text-black text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none shadow-xl transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                  New Task
                </div>
              )}
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            MODE A — HOME: cross-workspace task insights
        ════════════════════════════════════════════════════════════════ */}
        {!isInsideWorkspace && (() => {
          const now = new Date();
          const todayStr = now.toISOString().split('T')[0];
          const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

          const myTasks = allUserTasks.filter(t => (t.assigneeIds?.includes(user.employeeId) || t.assigneeId === user.employeeId) && t.status !== TaskStatus.DONE);
          const overdue = myTasks.filter(t => t.dueDate && t.dueDate < todayStr);
          const dueToday = myTasks.filter(t => t.dueDate === todayStr);
          const inProg = myTasks.filter(t => t.status === TaskStatus.IN_PROGRESS);
          const todo = myTasks.filter(t => t.status === TaskStatus.TODO);
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
              {/* Home Navigation (Global) */}
              <div className="mb-6 space-y-1">
                <button
                  onClick={() => navigate('/app/home')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 group relative ${currentView === 'home'
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white'
                    } ${!isOpen && 'justify-center px-0'}`}
                >
                  <HomeIcon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span>Home</span>}
                  {!isOpen && (
                    <div className="absolute left-full ml-4 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-[#1E1E1E] text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none shadow-xl transition-all duration-200">
                      Home
                    </div>
                  )}
                </button>
              </div>

              {/* Header */}
              {isOpen && (
                <div className="px-4 mb-3 text-[10px] font-bold text-slate-400 dark:text-white/50 uppercase tracking-widest">
                  My Tasks
                </div>
              )}

              {/* Stats */}
              {isOpen ? (
                <div className="space-y-1.5 mb-5">
                  {[
                    { label: 'Overdue', count: overdue.length, config: { bg: 'bg-red-500', text: 'text-red-500', faint: 'bg-red-50 dark:bg-red-500/10' }, isActive: overdue.length > 0 },
                    { label: TASK_STATUS_CONFIG[TaskStatus.TODO].label, count: todo.length, config: TASK_STATUS_CONFIG[TaskStatus.TODO], isActive: todo.length > 0 },
                    { label: TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].label, count: inProg.length, config: TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS], isActive: inProg.length > 0 },
                  ].map(({ label, count, config, isActive }) => (
                    <div key={label} className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors ${isActive ? `${config.faint} hover:brightness-105` : 'opacity-50'}`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${config.bg}`} />
                      <span className="text-xs font-semibold text-slate-600 dark:text-white/60 flex-1">{label}</span>
                      <span className={`text-sm font-black ${config.text}`}>{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 mb-4">
                  {overdue.length > 0 && <div className="w-2 h-2 rounded-full bg-red-500" title={`${overdue.length} overdue`} />}
                  {todo.length > 0 && <div className={`w-2 h-2 rounded-full ${TASK_STATUS_CONFIG[TaskStatus.TODO].bg}`} title={`${todo.length} to do`} />}
                  {inProg.length > 0 && <div className={`w-2 h-2 rounded-full ${TASK_STATUS_CONFIG[TaskStatus.IN_PROGRESS].bg}`} title={`${inProg.length} in progress`} />}
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
                <div className="px-4 py-2 flex flex-col items-center gap-1">
                  <svg className="w-4 h-4 text-slate-400 dark:text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-xs font-semibold text-slate-400 dark:text-white/30">All caught up!</p>
                </div>
              )}

              {isSuperAdmin && (
                <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                  {isOpen && (
                    <div className="px-4 mb-2 text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">
                      System
                    </div>
                  )}
                  <button
                    onClick={() => onViewChange('user-management')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 group relative ${currentView === 'user-management'
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white'
                      } ${!isOpen && 'justify-center px-0'}`}
                  >
                    <UsersIcon className="w-5 h-5 flex-shrink-0" />
                    {isOpen && <span>User Management</span>}
                    {!isOpen && (
                      <div className="absolute left-full ml-4 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-[#1E1E1E] text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none shadow-xl transition-all duration-200">
                        User Management
                      </div>
                    )}
                  </button>
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
              onClick={() => navigate('/app/home')}
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
                  <div className={`w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br ${accent.from} ${accent.to} flex items-center justify-center text-white text-sm font-black shadow-lg ${accent.shadow} flex-shrink-0 border border-white/10`}>
                    {currentSpace.logoUrl ? (
                      <img src={currentSpace.logoUrl} alt={currentSpace.name} className="w-full h-full object-cover" />
                    ) : (
                      currentSpace.name.charAt(0).toUpperCase()
                    )}
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

            {/* Workspace Management (Analytics, Hub, etc.) */}
            <div className="space-y-1">
              {(currentSpaceRole === 'admin' || isSuperAdmin) && (
                <>
                  <button
                    onClick={() => onViewChange('overview')}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-[20px] text-sm font-bold transition-all duration-300 group relative
                      ${currentView === 'overview'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg shadow-slate-200 dark:shadow-white/10'
                        : 'text-slate-500 dark:text-white/50 hover:bg-slate-900/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                      } ${!isOpen && 'justify-center px-0'}`}
                  >
                    <ChartBarIcon className="w-5 h-5 flex-shrink-0" />
                    {isOpen && <span>Analytics</span>}
                    {!isOpen && (
                      <div className="absolute left-full ml-4 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-[#1E1E1E] text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none shadow-xl transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                        Analytics
                      </div>
                    )}
                  </button>
                  {isSuperAdmin && (
                    <button
                      onClick={() => onViewChange('analytics')}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-[20px] text-sm font-bold transition-all duration-300 group relative
                        ${currentView === 'analytics'
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg shadow-slate-200 dark:shadow-white/10'
                          : 'text-slate-500 dark:text-white/50 hover:bg-slate-900/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                        } ${!isOpen && 'justify-center px-0'}`}
                    >
                      <PresentationChartLineIcon className="w-5 h-5 flex-shrink-0" />
                      {isOpen && <span>Assign Task</span>}
                      {!isOpen && (
                        <div className="absolute left-full ml-4 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-[#1E1E1E] text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none shadow-xl transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                          Assign Task
                        </div>
                      )}
                    </button>
                  )}
                </>
              )}

              {/* Team Hub */}
              <button
                onClick={() => onViewChange('summary')}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-[20px] text-sm font-bold transition-all duration-300 group relative
                  ${currentView === 'summary'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg shadow-slate-200 dark:shadow-white/10'
                    : 'text-slate-500 dark:text-white/50 hover:bg-slate-900/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  } ${!isOpen && 'justify-center px-0'}`}
              >
                <ListBulletIcon className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span>Team Hub</span>}
                {!isOpen && (
                  <div className="absolute left-full ml-4 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-[#1E1E1E] text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none shadow-xl transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                    Team Hub
                  </div>
                )}
              </button>
            </div>

            {/* Workspace nav label */}
            <div className={`px-4 mt-2 mb-1 text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest ${!isOpen && 'text-center'}`}>
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

          </>
        )}

      </div>

      {/* ── Logout Button ─────────────────────────────────────────── */}
      <div className="px-4 mb-6">
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-[20px] text-sm font-bold transition-all duration-300 group relative text-slate-500 dark:text-white/50 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 ${!isOpen && 'justify-center px-0'}`}
        >
          <LogoutIcon className="w-5 h-5 flex-shrink-0" />
          {isOpen && <span>Logout</span>}
          {!isOpen && (
            <div className="absolute left-full ml-4 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none shadow-xl transition-all duration-200 translate-x-2 group-hover:translate-x-0">
              Logout
            </div>
          )}
        </button>
      </div>
  </aside>
</>
  );
};

export default Sidebar;
