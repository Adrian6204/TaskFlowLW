import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { Task, Employee, TaskStatus, Priority } from '../types';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { usePreferences } from './hooks/usePreferences';
import { TASK_STATUS_CONFIG } from '../constants/taskStatusConfig';

interface GanttChartProps {
  tasks: Task[];
  employees: Employee[];
  onViewTask: (task: Task) => void;
}

const GanttChart: React.FC<GanttChartProps> = ({ tasks, employees, onViewTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [preferences] = usePreferences();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ... (rest of the logic remains same until return)
  // I'll use multi_replace for better precision if needed, but I'll try a larger chunk here.

  // Get 14 days starting from current week
  const days = useMemo(() => {
    const result = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    for (let i = 0; i < 14; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      result.push(day);
    }
    return result;
  }, [currentDate]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getTaskPosition = (task: Task) => {
    const dueDate = new Date(task.dueDate);
    const createdDate = task.createdAt ? new Date(task.createdAt) : new Date(dueDate.getTime() - 3 * 24 * 60 * 60 * 1000);

    const startIndex = days.findIndex(d => d.toDateString() === createdDate.toDateString());
    const endIndex = days.findIndex(d => d.toDateString() === dueDate.toDateString());

    if (startIndex === -1 && endIndex === -1) return null;

    const actualStart = Math.max(0, startIndex === -1 ? 0 : startIndex);
    const actualEnd = Math.min(days.length - 1, endIndex === -1 ? days.length - 1 : endIndex);

    return {
      start: actualStart,
      span: actualEnd - actualStart + 1
    };
  };

  const priorityColors = {
    [Priority.URGENT]: 'bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30',
    [Priority.HIGH]: 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30',
    [Priority.MEDIUM]: 'bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30',
    [Priority.LOW]: 'bg-zinc-400/10 dark:bg-zinc-400/20 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-400/30',
  };

  const completedStyle = `${TASK_STATUS_CONFIG[TaskStatus.DONE].faint} ${TASK_STATUS_CONFIG[TaskStatus.DONE].text} border-emerald-200 dark:border-emerald-500/40 shadow-sm ${TASK_STATUS_CONFIG[TaskStatus.DONE].glow}`;

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const getEmployee = (id: string) => {
    return employees.find(e => e.id === id);
  };

  // Group tasks by assignee and apply filters
  const tasksByAssignee = useMemo(() => {
    const grouped: { [key: string]: Task[] } = {};
    tasks.forEach(task => {
      const key = task.assigneeId || 'unassigned';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
    });

    const filteredGrouped: { [key: string]: Task[] } = {};
    Object.entries(grouped).forEach(([assigneeId, tks]) => {
      if (selectedAssigneeId !== 'all' && assigneeId !== selectedAssigneeId) return;
      filteredGrouped[assigneeId] = tks;
    });

    return filteredGrouped;
  }, [tasks, selectedAssigneeId, employees]);

  return (
    <div className={`bg-white/80 dark:bg-black/60 ${preferences.performanceMode ? '' : 'backdrop-blur-xl'} rounded-3xl border border-zinc-200 dark:border-white/10 overflow-hidden shadow-xl transition-all duration-300`}>
      {/* Header */}
      <div className={`p-6 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] ${preferences.performanceMode ? '' : 'backdrop-blur-md'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Timeline Analytics</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
              <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                {days[0]?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Timeline
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between gap-3 px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#1a1d24] text-zinc-900 dark:text-white focus:outline-none hover:bg-zinc-50 dark:hover:bg-white/5 transition-all w-48 shadow-sm"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-semibold truncate">
                    {selectedAssigneeId === 'all' 
                      ? 'All Members' 
                      : selectedAssigneeId === 'unassigned'
                        ? 'Unassigned'
                        : employees.find(e => e.id === selectedAssigneeId)?.name || 'Select Member'}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1a1d24] rounded-xl border border-zinc-200 dark:border-white/10 shadow-xl z-50 overflow-hidden flex flex-col">
                  <div className="p-2 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2" />
                      <input
                        type="text"
                        placeholder="Search member..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#0f1115] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-all"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  
                  <div className="max-h-[240px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-white/10">
                    <button
                      onClick={() => { setSelectedAssigneeId('all'); setIsDropdownOpen(false); setSearchQuery(''); }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between mb-1 ${selectedAssigneeId === 'all' ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                    >
                      All Members
                      {selectedAssigneeId === 'all' && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                    
                    {employees
                      .filter(emp => !searchQuery || emp.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(emp => (
                        <button
                          key={emp.id}
                          onClick={() => { setSelectedAssigneeId(emp.id); setIsDropdownOpen(false); setSearchQuery(''); }}
                          className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between mb-0.5 ${selectedAssigneeId === emp.id ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                        >
                          <span className="truncate pr-2 block w-full">{emp.name}</span>
                          {selectedAssigneeId === emp.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                    ))}

                    {(!searchQuery || 'unassigned'.includes(searchQuery.toLowerCase())) && (
                      <button
                        onClick={() => { setSelectedAssigneeId('unassigned'); setIsDropdownOpen(false); setSearchQuery(''); }}
                        className={`w-full mt-1 text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between border-t border-zinc-100 dark:border-white/5 pt-2 ${selectedAssigneeId === 'unassigned' ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                      >
                        Unassigned
                        {selectedAssigneeId === 'unassigned' && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center bg-zinc-100 dark:bg-white/5 p-1 rounded-xl border border-zinc-200 dark:border-white/5">
              <button
                onClick={() => navigateWeek(-1)}
                className="p-2 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-all text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white shadow-sm"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Sync Today
              </button>
              <button
                onClick={() => navigateWeek(1)}
                className="p-2 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-all text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white shadow-sm"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/10 bg-zinc-50/30 dark:bg-white/[0.01] flex flex-wrap items-center gap-x-8 gap-y-4">
        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Priority Legend</span>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-red-500 shadow-sm shadow-red-500/20"></div>
            <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">Urgent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-orange-500 shadow-sm shadow-orange-500/20"></div>
            <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-yellow-500 shadow-sm shadow-yellow-500/20"></div>
            <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded bg-zinc-400 shadow-sm shadow-zinc-400/20"></div>
            <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">Low</span>
          </div>
          <div className="w-px h-3 bg-zinc-200 dark:bg-white/10 mx-1"></div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded ${TASK_STATUS_CONFIG[TaskStatus.DONE].bg} shadow-sm ${TASK_STATUS_CONFIG[TaskStatus.DONE].glow}`}></div>
            <span className={`text-[10px] font-semibold ${TASK_STATUS_CONFIG[TaskStatus.DONE].text}`}>{TASK_STATUS_CONFIG[TaskStatus.DONE].label}</span>
          </div>
        </div>
      </div>

      {/* Gantt Grid */}
      <div className="overflow-x-auto scrollbar-none">
        <div className="min-w-[1200px]">
          {/* Days Header */}
          <div className="flex border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02]">
            <div className="w-52 flex-shrink-0 p-4 border-r border-zinc-200 dark:border-white/10">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Assignee</span>
            </div>
            <div className="flex-1 flex">
              {days.map((day, idx) => (
                <div
                  key={idx}
                  className={`flex-1 p-4 text-center border-r border-zinc-200 dark:border-white/10 last:border-r-0 ${isToday(day) ? 'bg-primary-500/10 dark:bg-primary-500/5' : ''
                    }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isToday(day) ? 'text-primary-600 dark:text-primary-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {formatDate(day)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks Rows */}
          <div className="divide-y divide-zinc-100 dark:divide-white/5">
            {Object.entries(tasksByAssignee).map(([assigneeId, assigneeTasks], rowIndex) => (
              <div key={assigneeId} className={`flex group transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.02] ${rowIndex % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-zinc-50/40 dark:bg-white/[0.01]'}`}>
                {/* Assignee Identity */}
                <div className="w-52 flex-shrink-0 p-4 border-r border-zinc-200 dark:border-white/10 flex items-center">
                  <div className="flex items-center gap-3">
                    {getEmployee(assigneeId) ? (
                      <img src={getEmployee(assigneeId)?.avatarUrl} className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-white/10 shadow-sm" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] font-black text-zinc-400 dark:text-zinc-500">??</div>
                    )}
                    <div className="min-w-0">
                      <span className="block text-xs font-semibold text-zinc-900 dark:text-zinc-200 leading-tight mb-0.5 break-words">
                        {getEmployee(assigneeId)?.name || 'Unassigned'}
                      </span>
                      <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                        {assigneeTasks.length} tasks
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline Data */}
                <div className="flex-1 relative">
                  {/* Grid markers background */}
                  <div className="absolute inset-0 flex pointer-events-none z-0">
                    {days.map((day, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 border-r border-zinc-200 dark:border-white/10 last:border-r-0 ${isToday(day) ? 'bg-primary-500/10 dark:bg-primary-500/5' : ''}`}
                      />
                    ))}
                  </div>


                  {/* Task bars container */}
                  <div className="relative p-3 min-h-[80px] flex flex-col justify-center gap-2 z-10 w-full overflow-hidden">
                    {assigneeTasks.map((task) => {
                      const position = getTaskPosition(task);
                      if (!position) return null;

                      const widthPercent = (position.span / days.length) * 100;
                      const leftPercent = (position.start / days.length) * 100;

                      const priorityBarColors = {
                        [Priority.URGENT]: 'bg-red-500',
                        [Priority.HIGH]: 'bg-orange-500',
                        [Priority.MEDIUM]: 'bg-yellow-500',
                        [Priority.LOW]: 'bg-zinc-400',
                      };

                      return (
                        <div key={task.id} className="w-full relative h-9 shrink-0 group/bar">
                          <div
                            onClick={() => onViewTask(task)}
                            className={`absolute inset-y-0 rounded-lg ${task.status === TaskStatus.DONE ? completedStyle : priorityColors[task.priority]} cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all flex items-center border shadow-sm overflow-hidden z-10 hover:z-20`}
                            style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, margin: '0 2px' }}
                          >
                            {/* Priority left stripe */}
                            {task.status !== TaskStatus.DONE && (
                              <div className={`w-1 self-stretch shrink-0 ${priorityBarColors[task.priority]} opacity-60`} />
                            )}
                            <div className="flex items-center gap-1.5 px-2 w-full min-w-0">
                              {task.status === TaskStatus.DONE && (
                                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              <span className="text-[10px] font-bold truncate flex-1 leading-none">
                                {task.title}
                              </span>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {tasks.length === 0 && (
            <div className="p-32 text-center">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChevronRightIcon className="w-10 h-10 text-zinc-300 dark:text-white/5" />
              </div>
              <h4 className="text-lg font-black text-zinc-400 dark:text-white/20 uppercase tracking-[0.3em]">No Tasks</h4>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-white/10 uppercase tracking-widest mt-2">Zero active tasks detected in this timeline.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
