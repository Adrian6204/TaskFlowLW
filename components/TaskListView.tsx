
import React, { useState } from 'react';
import { Task, Employee, TaskStatus, Priority } from '../types';
import { TASK_STATUSES } from '../constants';
import TagPill from './TagPill';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { ClockIcon } from './icons/ClockIcon';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface TaskListViewProps {
  tasks: Task[];
  employees: Employee[];
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onEditTask: (task: Task) => void;
  onViewTask: (task: Task) => void;
  onUpdateTaskStatus: (taskId: number, newStatus: TaskStatus) => void;
  onToggleTimer: (taskId: number) => void;
}

const statusColors = {
  [TaskStatus.TODO]: 'bg-orange-500 shadow-orange-500/50',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-500 shadow-blue-500/50',
  [TaskStatus.DONE]: 'bg-emerald-500 shadow-emerald-500/50',
};

const priorityColors = {
  [Priority.URGENT]: 'text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20',
  [Priority.HIGH]: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/20',
  [Priority.MEDIUM]: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20',
  [Priority.LOW]: 'text-slate-500 dark:text-white/40 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5',
};

const TaskGroup: React.FC<{
  status: TaskStatus;
  tasks: Task[];
  employees: Employee[];
  onEditTask: (task: Task) => void;
  onViewTask: (task: Task) => void;
  onUpdateTaskStatus: (taskId: number, newStatus: TaskStatus) => void;
  onToggleTimer: (taskId: number) => void;
}> = ({ status, tasks, employees, onViewTask, onToggleTimer }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <div className="mb-10">
      <div
        className="flex items-center gap-4 mb-4 group cursor-pointer px-2"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className={`transition-transform duration-300 ${isCollapsed ? '' : 'rotate-90'}`}>
          <ChevronRightIcon className="w-4 h-4 text-slate-400 dark:text-white/40" />
        </div>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${statusColors[status]} shadow-[0_0_8px]`}></span>
          <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
            {status}
          </span>
          <span className="text-slate-400 dark:text-white/20 text-xs font-bold font-mono">[{tasks.length}]</span>
        </div>
        <div className="h-px bg-black/5 dark:bg-white/5 flex-grow ml-4 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-all duration-500"></div>
      </div>

      {!isCollapsed && (
        <div className="bg-white/60 dark:bg-black/40 backdrop-blur-[40px] border border-white/40 dark:border-white/5 rounded-[32px] overflow-hidden shadow-xl shadow-black/5 dark:shadow-none">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_150px_150px_150px_100px] gap-6 px-8 py-5 border-b border-black/5 dark:border-white/5 text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.2em]">
            <div>Mission Title</div>
            <div>Assignee</div>
            <div>Timeline</div>
            <div>Priority</div>
            <div className="text-right">Action</div>
          </div>

          {/* Table Body */}
          <div>
            {tasks.map(task => {
              const assignee = employees.find(e => e.id === task.assigneeId);
              const isOverdue = new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE;
              const isTracking = !!task.timerStartTime;

              return (
                <div
                  key={task.id}
                  onClick={() => onViewTask(task)}
                  className="grid grid-cols-[1fr_150px_150px_150px_100px] gap-6 px-8 py-5 border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer group items-center"
                >
                  {/* Title Column */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-slate-700 dark:text-white/80 truncate group-hover:text-slate-950 dark:group-hover:text-white transition-colors tracking-tight">
                        {task.title}
                      </span>
                    </div>
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {task.tags.map(tag => (
                          <TagPill key={tag} text={tag} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assignee */}
                  <div className="flex items-center">
                    {assignee ? (
                      <div className="flex items-center gap-3 group/member" title={assignee.name}>
                        <img src={assignee.avatarUrl} className="w-8 h-8 rounded-xl border border-white/10 group-hover/member:border-white/30 transition-all" />
                        <span className="text-xs font-bold text-white/60 group-hover/member:text-white transition-colors">{assignee.name.split(' ')[0]}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest italic">Unassigned</span>
                    )}
                  </div>

                  {/* Due Date */}
                  <div className={`text-xs font-bold font-mono tracking-tight ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-white/40'}`}>
                    {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  {/* Priority */}
                  <div>
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>

                  {/* Timer */}
                  <div className="flex justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleTimer(task.id); }}
                      className={`p-2.5 rounded-2xl transition-all duration-300 ${isTracking ? 'bg-red-500/20 text-red-500 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-slate-300 dark:text-white/20 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100'}`}
                    >
                      {isTracking ? <StopIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const TaskListView: React.FC<TaskListViewProps> = ({ tasks, employees, searchTerm, onSearchChange, onEditTask, onViewTask, onUpdateTaskStatus, onToggleTimer }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const getTaskStats = (employeeId: string) => {
    const employeeTasks = tasks.filter(t => t.assigneeId === employeeId);
    return {
      total: employeeTasks.length,
      completed: employeeTasks.filter(t => t.status === TaskStatus.DONE).length,
      inProgress: employeeTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      todo: employeeTasks.filter(t => t.status === TaskStatus.TODO).length,
    };
  };

  // Get today's tasks (tasks due today or overdue)
  const getTodaysTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return (dueDate <= tomorrow && t.status !== TaskStatus.DONE);
    });
  };

  const todaysTasks = getTodaysTasks();

  // Filter tasks based on selected employee
  const filteredTasks = selectedEmployeeId
    ? tasks.filter(t => t.assigneeId === selectedEmployeeId)
    : tasks;

  return (
    <div className="pb-20 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Today's Tasks Section */}
      {todaysTasks.length > 0 && (
        <div className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent z-0 opacity-50"></div>
          <div className="bg-white/60 dark:bg-black/40 backdrop-blur-[40px] border border-white/40 dark:border-white/5 rounded-[40px] overflow-hidden animate-in fade-in duration-1000 shadow-xl shadow-black/5 dark:shadow-none">
            <div className="flex items-center justify-between mb-8 p-8 pb-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl">
                  <ClockIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Critical Timeline</h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest mt-1">Pending Missions Due Today</p>
                </div>
              </div>
              <div className="h-10 w-10 flex items-center justify-center bg-blue-500 rounded-2xl text-white text-sm font-black shadow-lg shadow-blue-500/20">
                {todaysTasks.length}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-8 pt-0">
              {todaysTasks.slice(0, 6).map(task => {
                const assignee = employees.find(e => e.id === task.assigneeId);
                return (
                  <div
                    key={task.id}
                    onClick={() => onViewTask(task)}
                    className="bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 rounded-2xl p-4 border border-white/40 dark:border-white/5 hover:border-white/60 dark:hover:border-white/20 transition-all duration-300 cursor-pointer group relative overflow-hidden shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {assignee && (
                        <div className="relative flex-shrink-0">
                          <img src={assignee.avatarUrl} className="w-10 h-10 rounded-xl border border-black/10 dark:border-white/10 shadow-sm" alt="" />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#1E1E1E]"></div>
                        </div>
                      )}
                      <p className="text-sm font-bold text-slate-700 dark:text-white/80 truncate flex-1 group-hover:text-slate-950 dark:group-hover:text-white transition-colors tracking-tight uppercase leading-tight">
                        {task.title}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">Target Date</span>
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-lg">
                        {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {todaysTasks.length > 6 && (
              <div className="mt-6 text-center pb-8">
                <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.3em]">
                  + {todaysTasks.length - 6} additional directives
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team Members Section */}
      {employees.length > 0 && (
        <div className="px-2">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Command Squad</h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mt-1">Resource allocation in this segment</p>
            </div>
            {selectedEmployeeId && (
              <button
                onClick={() => setSelectedEmployeeId(null)}
                className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Restore Global View
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee, index) => {
              const stats = getTaskStats(employee.id);
              const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
              const isSelected = selectedEmployeeId === employee.id;

              return (
                <div
                  key={employee.id}
                  onClick={() => setSelectedEmployeeId(isSelected ? null : employee.id)}
                  className={`bg-white/60 dark:bg-black/40 backdrop-blur-[40px] rounded-[32px] border transition-all duration-500 cursor-pointer overflow-hidden p-8 group hover:scale-[1.02] ${isSelected
                    ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-2xl shadow-blue-500/10 dark:shadow-blue-500/20'
                    : 'border-white/40 dark:border-white/5 hover:border-white/60 dark:hover:border-white/20 shadow-xl shadow-black/5 dark:shadow-none'
                    }`}
                >
                  <div className="flex items-center gap-5 mb-8">
                    <div className="relative">
                      <img src={employee.avatarUrl} className="w-16 h-16 rounded-[20px] object-cover border-2 border-white dark:border-[#1E1E1E] ring-1 ring-black/5 dark:ring-white/10 group-hover:ring-black/10 dark:group-hover:ring-white/30 transition-all shadow-md" alt="" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white dark:border-[#2A2A2A] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                        {employee.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]"></div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">
                          {stats.total} assignments
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Task Progress */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3 text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-400 dark:text-white/30">Sync Status</span>
                      <span className="text-slate-900 dark:text-white font-black">{completionRate}%</span>
                    </div>
                    <div className="h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                      <p className="text-xl font-black text-slate-900 dark:text-white mb-1 leading-none">{stats.todo}</p>
                      <p className="text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">Queue</p>
                    </div>
                    <div className="text-center p-4 bg-blue-500/10 rounded-2xl border border-blue-500/10">
                      <p className="text-xl font-black text-blue-600 dark:text-blue-400 mb-1 leading-none">{stats.inProgress}</p>
                      <p className="text-[8px] font-black text-blue-600/60 dark:text-blue-400/30 uppercase tracking-[0.2em]">Active</p>
                    </div>
                    <div className="text-center p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/10">
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mb-1 leading-none">{stats.completed}</p>
                      <p className="text-[8px] font-black text-emerald-600/60 dark:text-emerald-400/30 uppercase tracking-[0.2em]">Done</p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-6 pt-4 border-t border-white/5 text-center">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] animate-pulse">
                        Filtering active context
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tasks Section */}
      <div className="px-2">
        {selectedEmployeeId && (
          <div className="mb-8 p-6 bg-blue-500/10 backdrop-blur-3xl rounded-[32px] border border-blue-500/20 flex items-center justify-between animate-in fade-in zoom-in duration-500 shadow-xl shadow-blue-500/5">
            <div className="flex items-center gap-4">
              <img src={employees.find(e => e.id === selectedEmployeeId)?.avatarUrl} className="w-10 h-10 rounded-xl border border-blue-500/30 shadow-md" alt="" />
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Active Context: {employees.find(e => e.id === selectedEmployeeId)?.name}</h4>
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400/60 uppercase tracking-widest mt-1">Filtering all missions by squad member</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedEmployeeId(null)}
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              Reset Filter
            </button>
          </div>
        )}
        {TASK_STATUSES.map(status => (
          <TaskGroup
            key={status}
            status={status}
            tasks={filteredTasks.filter(t => t.status === status)}
            employees={employees}
            onEditTask={onEditTask}
            onViewTask={onViewTask}
            onUpdateTaskStatus={onUpdateTaskStatus}
            onToggleTimer={onToggleTimer}
          />
        ))}
        {filteredTasks.length === 0 && (
          <div className="text-center py-32 bg-white/10 dark:bg-black/20 backdrop-blur-[40px] border border-white/20 dark:border-white/5 rounded-[40px] shadow-2xl shadow-black/5 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              {searchTerm ? (
                <svg className="w-10 h-10 text-slate-400 dark:text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              ) : (
                <CheckCircleIcon className="w-10 h-10 text-slate-400 dark:text-white/10" />
              )}
            </div>
            <h4 className="text-lg font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.3em]">
              {searchTerm ? 'No Missions Match' : 'No Context Found'}
            </h4>
            <p className="text-[10px] font-bold text-slate-400 dark:text-white/10 uppercase tracking-widest mt-2 px-8">
              {searchTerm
                ? `Zero results found for "${searchTerm}"`
                : selectedEmployeeId ? 'Member has zero active assignments' : 'This workspace view is currently empty'}
            </p>
            {searchTerm && onSearchChange && (
              <button
                onClick={() => onSearchChange('')}
                className="mt-6 px-6 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all active:scale-95 shadow-lg"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskListView;
