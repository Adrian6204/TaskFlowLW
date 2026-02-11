import React, { useState } from 'react';
import { Task, Employee, TaskStatus, Priority, Space, User } from '../types';
import BentoCard from './BentoCard';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { FlagIcon } from './icons/FlagIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { BoltIcon } from './icons/BoltIcon';

import { useDailyTasks, DailyTaskPriority } from '../hooks/useDailyTasks';
import { useScratchpad } from '../hooks/useScratchpad';
import { PlusIcon } from './icons/PlusIcon';
import { SearchIcon } from './icons/SearchIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { QuestionMarkIcon } from './icons/QuestionMarkIcon';
import MemberDetailsModal from './MemberDetailsModal';

interface HomeViewProps {
  tasks: Task[];
  employees: Employee[];
  currentSpace?: Space;
  user: User;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onUpdateTaskStatus: (taskId: number, newStatus: TaskStatus) => void;
  onUpdateTask: (taskId: number, updates: Partial<Task>) => Promise<void>;
  onAddTask: (task: Partial<Task>) => Promise<any>;
  onViewTask?: (task: Task) => void; // Optional for now, but recommended for drill-down
}

const HomeView: React.FC<HomeViewProps> = ({ tasks, employees, currentSpace, user, searchTerm: globalSearchTerm, onSearchChange, onUpdateTaskStatus, onUpdateTask, onAddTask, onViewTask }) => {
  const { tasks: dailyTasks, updateTaskStatus, deleteTask, addTask, updateTaskPriority, updateTaskSchedule, loading: dailyLoading } = useDailyTasks();
  const { note, updateNote, loading: scratchpadLoading } = useScratchpad();
  const today = new Date().toISOString().split('T')[0];

  const [newTaskInput, setNewTaskInput] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [newTaskPriority, setNewTaskPriority] = useState<DailyTaskPriority>('Medium');
  const [showUnplannedInfo, setShowUnplannedInfo] = useState(false);
  const [deadlinePromptTask, setDeadlinePromptTask] = useState<any | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Member Details Modal State
  const [selectedMember, setSelectedMember] = useState<Employee | null>(null);
  const [isMemberDetailsOpen, setIsMemberDetailsOpen] = useState(false);

  const handleAddTask = async () => {
    if (!newTaskInput.trim()) return;

    const tags = [];
    if (showUnplannedInfo) tags.push('Unplanned'); // wait, the button toggles showUnplannedInfo, but checks 'isUrgent'?
    // Actually the 'Unplanned' button sets isUrgent and adds a tag usually.
    // In the UI: 
    // <button onClick={() => setIsUrgent(!isUrgent)} ... > Unplanned </button>
    // So 'isUrgent' state tracks 'Unplanned' status in this UI logic.
    if (isUrgent) tags.push('Unplanned');

    const newTask: Partial<Task> = {
      title: newTaskInput,
      priority: newTaskPriority === 'Urgent' ? Priority.URGENT :
        newTaskPriority === 'High' ? Priority.HIGH :
          newTaskPriority === 'Medium' ? Priority.MEDIUM : Priority.LOW,
      status: TaskStatus.TODO,
      tags: tags,
      assigneeId: user.employeeId,
      dueDate: today, // Set due date to today so it shows in "Today's Mission"
    };

    try {
      const savedTask = await onAddTask(newTask);

      setNewTaskInput('');
      setIsUrgent(false);
      setNewTaskPriority('Medium');

      if (savedTask) {
        setDeadlinePromptTask(savedTask);
      }
    } catch (e) {
      console.error("Failed to add task", e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddTask();
    }
  };

  // Get user's tasks (Team tasks)
  const myTasks = tasks.filter(t => t.assigneeId === user.employeeId);
  const todayTasks = myTasks.filter(t => {
    const isDueToday = t.dueDate === today;
    const isOverdue = t.dueDate < today && t.status !== TaskStatus.DONE;
    const isInProgress = t.status === TaskStatus.IN_PROGRESS;
    const isCompletedToday = t.completedAt?.startsWith(today);
    return isDueToday || isOverdue || isInProgress || isCompletedToday;
  });
  const overdueTasks = myTasks.filter(t => t.dueDate < today && t.status !== TaskStatus.DONE);

  // Daily Tasks (Local)
  // All daily tasks are shown in the mission list regardless of status

  // Stats
  const totalTasks = myTasks.length;
  const completedTasks = myTasks.filter(t => t.status === TaskStatus.DONE).length;
  const inProgressTasks = myTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT: return 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30';
      case Priority.HIGH: return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30';
      case Priority.MEDIUM: return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30';
      default: return 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60 border border-slate-200 dark:border-white/5';
    }
  };

  const [statusPickerTask, setStatusPickerTask] = useState<{ id: string | number; isDaily: boolean } | null>(null);
  const [pickerPosition, setPickerPosition] = useState<{ x: number; y: number } | null>(null);

  // Expanded View State
  const [isExpandedMissionsOpen, setIsExpandedMissionsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const combinedTasks = [
    ...todayTasks.map(t => ({ ...t, isDaily: false, originalId: t.id })),
    ...dailyTasks.map(t => ({
      id: t.id,
      title: t.text,
      status: t.status === 'DONE' ? TaskStatus.DONE : t.status === 'IN_PROGRESS' ? TaskStatus.IN_PROGRESS : TaskStatus.TODO,
      priority: t.priority as Priority,
      spaceId: 'Personal',
      isDaily: true,
      isUnplanned: t.isUnplanned,
      originalId: t.id
    }))
  ];

  const filteredTasks = combinedTasks.filter(task => {
    const term = isExpandedMissionsOpen ? globalSearchTerm : globalSearchTerm; // Both use global now
    const matchesSearch = task.title.toLowerCase().includes(globalSearchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' ||
      (statusFilter === 'Completed' && task.status === TaskStatus.DONE) ||
      (statusFilter === 'In Progress' && task.status === TaskStatus.IN_PROGRESS) ||
      (statusFilter === 'Pending' && task.status === TaskStatus.TODO);
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleTaskClick = (e: React.MouseEvent, task: any) => {
    e.stopPropagation();

    // Boundary checks for the popup (estimate width 280px, height 350px)
    let x = e.clientX;
    let y = e.clientY;

    if (x + 280 > window.innerWidth) x = window.innerWidth - 300;
    if (y + 350 > window.innerHeight) y = window.innerHeight - 370;
    if (x < 20) x = 20;
    if (y < 20) y = 20;

    setStatusPickerTask({ id: task.isDaily ? task.id : task.originalId, isDaily: task.isDaily });
    setPickerPosition({ x, y });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in text-slate-900 dark:text-white pb-24">
        {/* 1. Hero / Profile Card (Span 2) */}
        <BentoCard className="col-span-1 md:col-span-2 relative p-8 flex flex-col justify-between min-h-[300px] group">
          <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-30 transition-opacity">
            <div className="w-32 h-32 rounded-full bg-lime-400 dark:bg-[#CEFD4A] blur-[80px]"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[10px] uppercase tracking-widest font-bold text-lime-600 dark:text-[#CEFD4A]">
                Overview
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-2">
              {getGreeting()},<br />
              <span className="text-lime-600 dark:text-[#CEFD4A]">{user.fullName || user.username}</span>
            </h1>
            <p className="text-slate-500 dark:text-white/40 text-lg max-w-md">
              {todayTasks.length > 0
                ? `You have ${todayTasks.length} missions scheduled for today.`
                : "All clear. Ready for new challenges."}
            </p>
          </div>

          <div className="flex gap-8 mt-8 relative z-10">
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{totalTasks}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-white/40">Total Active</p>
            </div>
            <div>
              <p className="text-3xl font-black text-lime-600 dark:text-[#CEFD4A]">{completedTasks}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-white/40">Completed</p>
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{inProgressTasks}</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-white/40">In Progress</p>
            </div>
          </div>
        </BentoCard>

        {/* 2. Quick Actions / Time (Span 1) */}
        {/* 2. Add New Task (Span 1) */}
        <BentoCard className="col-span-1 p-0 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <div className="w-24 h-24 bg-lime-500 blur-[60px] rounded-full"></div>
          </div>

          <div className="p-6 pb-2 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Add New Task</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowUnplannedInfo(!showUnplannedInfo)}
                  className={`flex items-center justify-center w-5 h-5 rounded-full border transition-all ${showUnplannedInfo
                    ? 'bg-lime-500/20 border-lime-500/50 text-lime-600 dark:text-[#CEFD4A]'
                    : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-slate-400'
                    }`}
                >
                  <QuestionMarkIcon className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setIsUrgent(!isUrgent)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all border ${isUrgent
                    ? 'bg-red-500 text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                    : 'bg-white/10 text-slate-400 dark:text-white/40 border-black/5 dark:border-white/10 hover:bg-white/20 hover:text-slate-600 dark:hover:text-white'
                    }`}
                >
                  <BoltIcon className="w-3 h-3" />
                  Unplanned
                </button>
              </div>
            </div>

            {showUnplannedInfo && (
              <div className="mb-3 p-3 bg-lime-500/5 border border-lime-500/20 rounded-xl animate-fade-in relative z-20">
                <p className="text-[10px] text-lime-600 dark:text-[#CEFD4A] font-bold leading-tight uppercase tracking-wider">
                  Unplanned tasks are urgent items that weren't part of your initial daily schedule.
                </p>
              </div>
            )}

            <div className="flex gap-1 mb-3 relative z-10 overflow-x-auto scrollbar-none pb-1">
              {(['Urgent', 'High', 'Medium', 'Low'] as DailyTaskPriority[]).map(p => (
                <button
                  key={p}
                  onClick={() => setNewTaskPriority(p)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all ${newTaskPriority === p
                    ? 'bg-lime-500 text-black border-lime-500'
                    : 'bg-white/5 border-black/5 dark:border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
              <textarea
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-[80px] bg-transparent border border-black/10 dark:border-white/10 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-lime-500 text-sm resize-none placeholder:text-slate-400 dark:placeholder:text-white/20"
                placeholder="What do you need to get done?"
              />
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskInput.trim()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-lime-500 disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-bold rounded-lg hover:bg-lime-400 transition-colors"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          </div>
        </BentoCard>

        {/* 3. Task List (Span 2) */}
        <BentoCard className="col-span-1 md:col-span-2 xl:row-span-2 p-0 flex flex-col">
          <div className="p-8 pb-4 flex items-center justify-between border-b border-black/5 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-lime-500 dark:bg-[#CEFD4A]"></div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Today's Missions</h3>
            </div>
            <button
              onClick={() => setIsExpandedMissionsOpen(true)}
              className="text-xs font-bold text-slate-400 dark:text-white/40 hover:text-lime-600 dark:hover:text-[#CEFD4A] transition-colors uppercase tracking-wider"
            >
              View All
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[400px] scrollbar-none">
            {(() => {
              if (dailyLoading) {
                return (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-white/20 py-12">
                    <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-xs uppercase tracking-widest">Syncing with cloud...</p>
                  </div>
                );
              }

              if (combinedTasks.length === 0) {
                return (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-white/20">
                    <CheckCircleIcon className="w-12 h-12 mb-4 opacity-50" />
                    <p className="font-bold">All caught up</p>
                  </div>
                );
              }

              if (globalSearchTerm && filteredTasks.length === 0) {
                return (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-white/20 py-12">
                    <SearchIcon className="w-8 h-8 mb-4 opacity-30" />
                    <p className="font-bold text-sm uppercase tracking-widest text-center">No missions found for "{globalSearchTerm}"</p>
                    <button
                      onClick={() => onSearchChange('')}
                      className="mt-4 text-xs font-black text-lime-600 dark:text-[#CEFD4A] hover:underline uppercase tracking-widest"
                    >
                      Clear Search
                    </button>
                  </div>
                );
              }

              return combinedTasks.map((task, idx) => (
                <div
                  key={`${task.isDaily ? 'daily' : 'project'}-${task.id}-${idx}`}
                  onClick={(e) => handleTaskClick(e, task)}
                  className={`group flex items-center gap-4 p-4 rounded-[20px] border transition-all cursor-pointer ${
                    // @ts-ignore
                    task.isUnplanned
                      ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                      : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                    }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === TaskStatus.DONE ? 'bg-lime-500 dark:bg-[#CEFD4A] border-lime-500 dark:border-[#CEFD4A] text-white dark:text-black' :
                    // @ts-ignore
                    task.isUnplanned ? 'border-red-500 text-transparent' :
                      task.isDaily ? 'border-lime-500 dark:border-[#CEFD4A] text-transparent' :
                        task.status === TaskStatus.IN_PROGRESS ? 'border-lime-500 dark:border-[#CEFD4A] text-transparent' :
                          'border-slate-300 dark:border-white/20 text-transparent group-hover:border-slate-400 dark:group-hover:border-white/40'
                    }`}>
                    {task.status === TaskStatus.DONE && <CheckCircleIcon className="w-4 h-4" />}
                  </div>

                  <div className="flex-1">
                    <h4 className={`font-bold transition-all ${task.status === TaskStatus.DONE
                      ? 'text-slate-400 dark:text-white/30 line-through'
                      : 'text-slate-900 dark:text-white'
                      }`}>
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {/* Priority Badge */}
                      {task.isDaily ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const priorities: DailyTaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
                            const currentIndex = priorities.indexOf(task.priority as DailyTaskPriority);
                            const nextPriority = priorities[(currentIndex + 1) % priorities.length];
                            updateTaskPriority(task.id as string, nextPriority);
                          }}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 transition-all hover:scale-105 active:scale-95 ${
                            // @ts-ignore
                            task.isUnplanned ? 'bg-red-500 text-white shadow-sm' :
                              task.priority === Priority.URGENT ? 'bg-red-500/10 text-red-600 dark:text-red-500 dark:bg-red-500/20' :
                                task.priority === Priority.HIGH ? 'bg-orange-500/10 text-orange-600 dark:text-orange-500 dark:bg-orange-500/20' :
                                  task.priority === Priority.MEDIUM ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 dark:bg-yellow-500/20' :
                                    'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/40'
                            }`}
                        >
                          {/* @ts-ignore */}
                          {task.isUnplanned && <BoltIcon className="w-2.5 h-2.5" />}
                          {/* @ts-ignore */}
                          {task.isUnplanned ? 'Unplanned' : task.priority}
                        </button>
                      ) : (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 ${
                          // @ts-ignore
                          task.isUnplanned ? 'bg-red-500 text-white shadow-sm' :
                            task.priority === Priority.URGENT ? 'bg-red-500/10 text-red-600 dark:text-red-500 dark:bg-red-500/20' :
                              task.priority === Priority.HIGH ? 'bg-orange-500/10 text-orange-600 dark:text-orange-500 dark:bg-orange-500/20' :
                                task.priority === Priority.MEDIUM ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 dark:bg-yellow-500/20' :
                                  'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/40'
                          }`}>
                          {/* @ts-ignore */}
                          {task.isUnplanned && <BoltIcon className="w-2.5 h-2.5" />}
                          {/* @ts-ignore */}
                          {task.isUnplanned ? 'Unplanned' : task.priority}
                        </span>
                      )}

                      {/* Status Badge */}
                      <button
                        onClick={(e) => handleTaskClick(e, task)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${task.status === TaskStatus.DONE
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : task.status === TaskStatus.IN_PROGRESS
                            ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/40'
                          }`}
                      >
                        {task.status === TaskStatus.DONE ? 'Completed' : task.status === TaskStatus.IN_PROGRESS ? 'In Progress' : 'Pending'}
                      </button>

                      {!task.isDaily && (
                        <span className="text-[10px] text-slate-400 dark:text-white/30 font-bold uppercase">{task.spaceId}</span>
                      )}
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-black/20 flex items-center justify-center text-slate-400 dark:text-white/20 group-hover:text-lime-600 dark:group-hover:text-[#CEFD4A] group-hover:bg-lime-500/10 dark:group-hover:bg-[#CEFD4A]/10 transition-all">
                    <span className="text-lg leading-none">&rarr;</span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </BentoCard>

        {/* 4. Team Members (Span 1) */}
        <BentoCard className="col-span-1 p-6">
          <h3 className="text-sm font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider mb-6">Team Members</h3>
          <div className="flex flex-wrap gap-2">
            {employees.slice(0, 8).map(emp => (
              <div
                key={emp.id}
                className="relative group cursor-pointer"
                onClick={() => {
                  setSelectedMember(emp);
                  setIsMemberDetailsOpen(true);
                }}
              >
                <img
                  src={emp.avatarUrl}
                  alt={emp.name}
                  className="w-10 h-10 rounded-full border-2 border-transparent group-hover:border-lime-500 dark:group-hover:border-[#CEFD4A] transition-all object-cover bg-neutral-200 dark:bg-neutral-800"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white dark:bg-black rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-lime-500 dark:bg-[#CEFD4A]"></div>
                </div>
              </div>
            ))}
            <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center text-slate-400 dark:text-white/40 font-bold text-xs hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
              +3
            </div>
          </div>
        </BentoCard>

        {/* 5. Personal Quick Tasks (Span 1 - matching height if possible) */}
        <BentoCard className="col-span-1 p-6 flex flex-col group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">Scratchpad</h3>
            <span className="text-[10px] font-bold text-slate-400 dark:text-white/20">Auto-saved</span>
          </div>

          {scratchpadLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-slate-300 dark:border-white/20 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <textarea
              value={note}
              onChange={(e) => updateNote(e.target.value)}
              placeholder="Type your notes here..."
              className="flex-1 w-full bg-transparent resize-none focus:outline-none text-sm font-medium text-slate-600 dark:text-white/80 placeholder:text-slate-300 dark:placeholder:text-white/20 leading-relaxed scrollbar-none"
            />
          )}
        </BentoCard>

        {/* Status Picker Popup */}
        {statusPickerTask && pickerPosition && (
          <div
            className="fixed inset-0 z-[100] animate-fade-in"
            onClick={() => {
              setStatusPickerTask(null);
              setPickerPosition(null);
            }}
          >
            <div
              className="absolute bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-[28px] p-6 shadow-2xl min-w-[280px] animate-scale-in"
              style={{
                top: pickerPosition.y,
                left: pickerPosition.x,
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Update Status</h3>
                <button
                  onClick={() => {
                    setStatusPickerTask(null);
                    setPickerPosition(null);
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-lg"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { id: TaskStatus.TODO, label: 'Pending', desc: 'Task waiting', color: 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:border-slate-300 dark:hover:border-white/20' },
                  { id: TaskStatus.IN_PROGRESS, label: 'In Progress', desc: 'Working now', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:border-blue-500/30' },
                  { id: TaskStatus.DONE, label: 'Completed', desc: 'Finished', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500/30' }
                ].map(status => (
                  <button
                    key={status.id}
                    onClick={() => {
                      if (statusPickerTask.isDaily) {
                        updateTaskStatus(statusPickerTask.id as string, status.id as any);
                      } else {
                        onUpdateTaskStatus(statusPickerTask.id as number, status.id as any);
                      }
                      setStatusPickerTask(null);
                      setPickerPosition(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border border-transparent transition-all flex flex-col gap-0.5 group ${status.color}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{status.label}</span>
                      <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
                    </div>
                    <span className="text-[9px] opacity-60 font-medium tracking-wide uppercase">{status.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Expanded Missions Modal */}
      {
        isExpandedMissionsOpen && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md animate-fade-in"
            onClick={() => setIsExpandedMissionsOpen(false)}
          >
            <div
              className="w-full max-w-6xl h-full max-h-[90vh] bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-[32px] flex flex-col p-0 overflow-hidden relative shadow-2xl animate-scale-in"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-black/5 dark:border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/50 dark:bg-white/[0.02]">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-lime-500 dark:bg-[#CEFD4A] shadow-[0_0_10px_rgba(206,253,74,0.4)]"></div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Mission Control</h2>
                  </div>
                  <p className="text-slate-500 dark:text-white/40 text-sm font-bold uppercase tracking-widest">{filteredTasks.length} {filteredTasks.length === 1 ? 'Mission' : 'Missions'} Listed</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search */}
                  <div className="relative group min-w-[240px]">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-lime-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search missions..."
                      value={globalSearchTerm}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-lime-500/50 w-full transition-all"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:border-lime-500/50 cursor-pointer text-slate-600 dark:text-white/60"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>

                  {/* Priority Filter */}
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-4 py-2 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:border-lime-500/50 cursor-pointer text-slate-600 dark:text-white/60"
                  >
                    <option value="All">All Priorities</option>
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>

                  <button
                    onClick={() => setIsExpandedMissionsOpen(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:bg-black/10 dark:hover:bg-white/10 shadow-sm"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body - Tasks */}
              <div className="flex-1 overflow-y-auto p-8 scrollbar-none">
                {filteredTasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-white/20 py-20">
                    <SearchIcon className="w-16 h-16 mb-6 opacity-30" />
                    <p className="text-xl font-black">No missions found</p>
                    <button
                      onClick={() => {
                        onSearchChange('');
                        setStatusFilter('All');
                        setPriorityFilter('All');
                      }}
                      className="mt-4 text-sm font-bold text-lime-600 dark:text-[#CEFD4A] hover:underline uppercase tracking-wider"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTasks.map((task, idx) => (
                      <div
                        key={`expanded-${task.isDaily ? 'daily' : 'project'}-${task.id}-${idx}`}
                        onClick={(e) => handleTaskClick(e, task)}
                        className={`group flex items-center gap-5 p-6 rounded-[28px] border transition-all cursor-pointer ${
                          // @ts-ignore
                          task.isUnplanned
                            ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                            : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 shadow-sm hover:shadow-md'
                          }`}
                      >
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${task.status === TaskStatus.DONE ? 'bg-lime-500 dark:bg-[#CEFD4A] border-lime-500 dark:border-[#CEFD4A] text-white dark:text-black shadow-[0_0_15px_rgba(206,253,74,0.3)]' :
                          // @ts-ignore
                          task.isUnplanned ? 'border-red-500 text-transparent' :
                            task.isDaily ? 'border-lime-500 dark:border-[#CEFD4A] text-transparent' :
                              task.status === TaskStatus.IN_PROGRESS ? 'border-lime-500 dark:border-[#CEFD4A] text-transparent shadow-[0_0_10px_rgba(206,253,74,0.1)]' :
                                'border-slate-300 dark:border-white/20 text-transparent group-hover:border-slate-400 dark:group-hover:border-white/40'
                          }`}>
                          {task.status === TaskStatus.DONE && <CheckCircleIcon className="w-6 h-6" />}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`text-lg font-black transition-all ${task.status === TaskStatus.DONE
                              ? 'text-slate-400 dark:text-white/30 line-through'
                              : 'text-slate-900 dark:text-white'
                              }`}>
                              {task.title}
                            </h4>
                            <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest">{task.spaceId}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Priority Badge */}
                            {task.isDaily ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const priorities: DailyTaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
                                  const currentIndex = priorities.indexOf(task.priority as DailyTaskPriority);
                                  const nextPriority = priorities[(currentIndex + 1) % priorities.length];
                                  updateTaskPriority(task.id as string, nextPriority);
                                }}
                                className={`text-[9px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 ${
                                  // @ts-ignore
                                  task.isUnplanned ? 'bg-red-500 text-white shadow-sm' :
                                    task.priority === Priority.URGENT ? 'bg-red-500/10 text-red-600 dark:text-red-500 dark:bg-red-500/20' :
                                      task.priority === Priority.HIGH ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 dark:bg-orange-500/20' :
                                        task.priority === Priority.MEDIUM ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 dark:bg-yellow-500/20' :
                                          'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/40'
                                  }`}
                              >
                                {/* @ts-ignore */}
                                {task.isUnplanned && <BoltIcon className="w-3.5 h-3.5" />}
                                {/* @ts-ignore */}
                                {task.isUnplanned ? 'Unplanned' : task.priority}
                              </button>
                            ) : (
                              <span className={`text-[9px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                                // @ts-ignore
                                task.isUnplanned ? 'bg-red-500 text-white shadow-sm' :
                                  task.priority === Priority.URGENT ? 'bg-red-500/10 text-red-600 dark:text-red-500 dark:bg-red-500/20' :
                                    task.priority === Priority.HIGH ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 dark:bg-orange-500/20' :
                                      task.priority === Priority.MEDIUM ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 dark:bg-yellow-500/20' :
                                        'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/40'
                                }`}>
                                {/* @ts-ignore */}
                                {task.isUnplanned && <BoltIcon className="w-3.5 h-3.5" />}
                                {/* @ts-ignore */}
                                {task.isUnplanned ? 'Unplanned' : task.priority}
                              </span>
                            )}

                            {/* Status Badge */}
                            <button
                              onClick={(e) => handleTaskClick(e, task)}
                              className={`text-[9px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${task.status === TaskStatus.DONE
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : task.status === TaskStatus.IN_PROGRESS
                                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                  : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/40'
                                }`}
                            >
                              {task.status === TaskStatus.DONE ? 'Completed' : task.status === TaskStatus.IN_PROGRESS ? 'In Progress' : 'Pending'}
                            </button>
                          </div>
                        </div>

                        <div className="w-10 h-10 rounded-2xl bg-black/5 dark:bg-black/20 flex items-center justify-center text-slate-400 dark:text-white/20 group-hover:text-lime-600 dark:group-hover:text-[#CEFD4A] group-hover:bg-lime-500/10 dark:group-hover:bg-[#CEFD4A]/10 transition-all shadow-sm">
                          <span className="text-xl leading-none font-black">&rarr;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      {/* Deadline Prompt Modal */}
      {deadlinePromptTask && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 rounded-[32px] p-8 shadow-2xl max-w-sm w-full animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-lime-500/10 dark:bg-[#CEFD4A]/10 flex items-center justify-center text-lime-600 dark:text-[#CEFD4A] mb-6 mx-auto">
              <ClockIcon className="w-8 h-8" />
            </div>

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Set a deadline?</h3>
              <p className="text-sm text-slate-500 dark:text-white/40 leading-relaxed italic mb-4">
                "{deadlinePromptTask.text}"
              </p>

              {showDatePicker ? (
                <div className="space-y-4 animate-fade-in">
                  <input
                    type="date"
                    className="w-full p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-lime-500"
                    onChange={(e) => {
                      // Automatically save on change or we could add a save button
                      // For better UX, let's keep the buttons for confirmation
                    }}
                    id="deadline-date-picker"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowDatePicker(false)}
                      className="px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold uppercase tracking-wider"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        const dateInput = document.getElementById('deadline-date-picker') as HTMLInputElement;
                        if (dateInput?.value && deadlinePromptTask) {
                          onUpdateTask(deadlinePromptTask.id, { dueDate: dateInput.value });
                        }
                        setDeadlinePromptTask(null);
                        setShowDatePicker(false);
                      }}
                      className="px-4 py-3 rounded-xl bg-lime-500 dark:bg-[#CEFD4A] text-black text-xs font-bold uppercase tracking-wider"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-black/5 dark:bg-white/5 rounded-2xl mb-6">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.15em]">
                      If you choose "Maybe Later", you can still set a deadline later by clicking the task.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setDeadlinePromptTask(null)}
                      className="px-6 py-3.5 rounded-2xl bg-black/5 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-black uppercase tracking-widest transition-all"
                    >
                      Maybe Later
                    </button>
                    <button
                      onClick={() => setShowDatePicker(true)}
                      className="px-6 py-3.5 rounded-2xl bg-lime-500 dark:bg-[#CEFD4A] text-black hover:bg-lime-400 dark:hover:bg-[#d9ff73] text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-lime-500/20"
                    >
                      Set Now
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Member Details Modal */}
      {selectedMember && (
        <MemberDetailsModal
          isOpen={isMemberDetailsOpen}
          onClose={() => setIsMemberDetailsOpen(false)}
          member={selectedMember}
          tasks={tasks} // Pass all tasks, modal filters by assignee
          onViewTask={(task) => {
            setIsMemberDetailsOpen(false);
            if (onViewTask) onViewTask(task);
          }}
        />
      )}

    </>
  );
};

export default HomeView;
