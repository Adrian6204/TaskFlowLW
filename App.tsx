
import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Task, TaskStatus, Employee, Priority, Comment, ActivityLog, TimeLogEntry, Space } from './types';
import TaskBoard from './components/TaskBoard';
import TaskListView from './components/TaskListView';
import TopNav from './components/TopNav';

import BottomDock from './components/BottomDock';
import AddTaskModal from './components/AddTaskModal';
import LoginPage from './components/LoginPage';
import { useAuth } from './auth/AuthContext';
import { useDailyTasks } from './hooks/useDailyTasks';
import AdminDashboard from './components/AdminDashboard';
import TaskDetailsModal from './components/TaskDetailsModal';
import { useNotification } from './context/NotificationContext';
import CalendarView from './components/CalendarView';
import ConfirmationModal from './components/ConfirmationModal';
import ProfileModal from './components/ProfileModal';
import CreateSpaceModal from './components/CreateSpaceModal';
import JoinSpaceModal from './components/JoinSpaceModal';
import SpaceSettingsModal from './components/SpaceSettingsModal';
import SpaceSettingsView from './components/SpaceSettingsView';
import GanttChart from './components/GanttChart';
import Whiteboard from './components/Whiteboard';
import MembersView from './components/MembersView';
import HomeView from './components/HomeView';
import DailyStandupModal from './components/DailyStandupModal';
import { Cog6ToothIcon } from './components/icons/Cog6ToothIcon';
import * as dataService from './services/supabaseService';
import { isSupabaseConfigured } from './lib/supabaseClient';
import Background from './components/Background';
import AdminOverseerView from './components/AdminOverseerView';


// Setup Required Screen Component
const SetupRequiredScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
    <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Setup Required</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Database connection missing.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 font-medium">
            To connect the database, add these variables to Vercel:
          </p>
          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700">
            SUPABASE_URL<br />
            SUPABASE_ANON_KEY
          </div>
        </div>

        <div className="text-xs text-center text-slate-400 dark:text-slate-500 mt-4">
          After adding the variables, redeploy the project.
        </div>
      </div>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Main Dashboard Component (Protected)
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser, logout } = useAuth();
  const { showNotification } = useNotification();

  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Admin-specific data
  const [allSpaces, setAllSpaces] = useState<Space[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  // UI State
  const [activeSpaceId, setActiveSpaceId] = useState<string>('');
  const [backgroundVideo, setBackgroundVideo] = useState<string | undefined>(undefined);

  const [searchTerm, setSearchTerm] = useState('');
  const [timelineViewMode, setTimelineViewMode] = useState<'calendar' | 'gantt'>('calendar');

  // Derive current view from URL path
  const getCurrentViewFromPath = (): string => {
    const path = location.pathname;
    if (path.includes('/calendar') || path.includes('/gantt') || path.includes('/timeline')) return 'timeline';
    // Fail-safe: If admin, everything else is overview
    if (user?.isAdmin) return 'overview';

    if (path.includes('/dashboard') || path.includes('/overview') || path.includes('/overseer')) return 'overview';
    if (path.includes('/board')) return 'board';
    if (path.includes('/whiteboard')) return 'whiteboard';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/home')) return 'home';
    if (path.includes('/list')) return 'list';
    if (path.includes('/members')) return 'members';
    return 'home';
  };

  const currentView = getCurrentViewFromPath();

  const setCurrentView = (view: string) => {
    navigate(`/app/${view}`);
  };

  // Modals
  const [isAddTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [isTaskDetailsModalOpen, setTaskDetailsModalOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isCreateSpaceModalOpen, setCreateSpaceModalOpen] = useState(false);
  const [isJoinSpaceModalOpen, setJoinSpaceModalOpen] = useState(false);
  const [isSpaceSettingsModalOpen, setSpaceSettingsModalOpen] = useState(false);
  const [isDailyStandupOpen, setDailyStandupOpen] = useState(false);
  const [hasCheckedStandup, setHasCheckedStandup] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Selection
  const [taskToEdit, setTaskToEdit] = useState<Task | Partial<Task> | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDeleteId, setTaskToDeleteId] = useState<number | null>(null);

  // Load Background Asset Safely
  useEffect(() => {
    // We can now use the GIF directly from the public folder
    setBackgroundVideo('/background.gif');
  }, []);




  // Load User Data
  useEffect(() => {
    if (user) {
      loadEmployees();
      loadSpaces();
    }
  }, [user]);

  // Load Tasks when Space Changes
  useEffect(() => {
    if (activeSpaceId) {
      loadTasks(activeSpaceId);
    } else {
      setTasks([]);
    }
  }, [activeSpaceId]);

  const loadEmployees = async () => {
    try {
      const emps = await dataService.getAllEmployees();
      setEmployees(emps);
    } catch (err) {
      console.error("Failed to load employees", err);
    }
  };

  const loadSpaces = async () => {
    if (!user) return;
    try {
      const loadedSpaces = await dataService.getSpaces(user.employeeId);
      setSpaces(loadedSpaces);

      if (loadedSpaces.length > 0) {
        const currentSpaceExists = loadedSpaces.some(s => s.id === activeSpaceId);
        if (!activeSpaceId || !currentSpaceExists) {
          setActiveSpaceId(loadedSpaces[0].id);
        }
      } else {
        setActiveSpaceId('');
      }
    } catch (err) {
      console.error("Failed to load spaces", err);
    }
  };

  // Load admin data if user is admin
  const loadAdminData = async () => {
    if (!user?.isAdmin) return;
    try {
      const [adminSpaces, adminTasks] = await Promise.all([
        dataService.getAllSpaces(),
        dataService.getAllTasksAcrossSpaces(),
      ]);
      setAllSpaces(adminSpaces);
      setAllTasks(adminTasks);
    } catch (err) {
      console.error("Failed to load admin data", err);
    }
  };

  // Load admin data when user is admin
  useEffect(() => {
    if (user?.isAdmin) {
      loadAdminData();
    }
  }, [user]);

  const loadTasks = async (spaceId: string) => {
    setIsLoadingTasks(true);
    try {
      const loadedTasks = await dataService.getTasks(spaceId, user?.employeeId);

      setTasks(loadedTasks);
    } catch (err) {
      console.error("Failed to load tasks", err);
      showNotification("Failed to load tasks", 'error');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Check for Daily Standup
  useEffect(() => {
    if (!isLoadingTasks && activeSpaceId && user && !hasCheckedStandup) {
      // Check if user has tasks created today (or assigned)
      const today = new Date().toDateString();
      const hasTasksToday = tasks.some(t =>
        t.assigneeId === user.employeeId &&
        new Date(t.createdAt).toDateString() === today
      );

      if (!hasTasksToday) {
        // Only show if we actually have a valid space
        setDailyStandupOpen(true);
      }
      setHasCheckedStandup(true);
    }
  }, [isLoadingTasks, activeSpaceId, user, tasks, hasCheckedStandup]);

  const currentUserEmployee = useMemo(() => {
    return employees.find(e => e.id === user?.employeeId);
  }, [employees, user]);

  const currentSpace = spaces.find(s => s.id === activeSpaceId);

  const { tasks: dailyTasks } = useDailyTasks();

  const filteredTasks = useMemo(() => {
    // Determine if we should search globally (on Home or Admin Overseer)
    const isGlobalView = currentView === 'home' || currentView === 'overview';

    let baseTasks = tasks;

    // If it's not a global view, we restrict to the active space
    if (!isGlobalView) {
      if (!activeSpaceId) return [];
      baseTasks = tasks.filter(task => task.spaceId === activeSpaceId);
    }

    if (!searchTerm) return baseTasks;

    const term = searchTerm.toLowerCase();
    return baseTasks.filter(task =>
      task.title.toLowerCase().includes(term) ||
      (task.tags && task.tags.some(tag => tag.toLowerCase().includes(term))) ||
      (task.description && task.description.toLowerCase().includes(term))
    );
  }, [tasks, activeSpaceId, searchTerm, currentView]);

  const spaceMembers = useMemo(() => {
    if (!currentSpace) return [];
    return employees.filter(e => currentSpace.members.includes(e.id));
  }, [currentSpace, employees]);

  const logActivity = (message: string) => {
    if (!user) return;
    const currentEmp = employees.find(e => e.id === user.employeeId);
    if (!currentEmp) return;

    const newLog: ActivityLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      message,
      user: { name: currentEmp.name, avatarUrl: currentEmp.avatarUrl }
    };
    setActivityLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const handleCreateSpace = async (name: string, description?: string) => {
    if (!user) return;
    try {
      const newSpace = await dataService.createSpace(name, user.employeeId, description);
      setSpaces([...spaces, newSpace]);
      setActiveSpaceId(newSpace.id);
      showNotification(`Created space "${name}"`);
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleJoinSpace = async (code: string) => {
    if (!user) return;
    try {
      const joinedSpace = await dataService.joinSpace(code, user.employeeId);

      // Check if space is already in the list
      const existingSpaceIndex = spaces.findIndex(s => s.id === joinedSpace.id);

      if (existingSpaceIndex >= 0) {
        // Update existing space (in case members changed)
        const updatedSpaces = [...spaces];
        updatedSpaces[existingSpaceIndex] = joinedSpace;
        setSpaces(updatedSpaces);
        showNotification(`Switched to "${joinedSpace.name}"`);
      } else {
        // Add new space
        setSpaces([...spaces, joinedSpace]);
        showNotification(`Joined "${joinedSpace.name}"`);
      }

      setActiveSpaceId(joinedSpace.id);
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleAddMemberToSpace = async (spaceId: string, memberId: string) => {
    if (!user) return;
    try {
      await dataService.addMemberToSpace(spaceId, memberId);
      const updatedSpace = await dataService.getSpaceById(spaceId);
      setSpaces(spaces.map(s => s.id === spaceId ? updatedSpace : s));
      const memberName = employees.find(e => e.id === memberId)?.name || 'Member';

      // Notify the new member
      dataService.createNotification({
        user_id: memberId,
        title: 'Added to Workspace',
        message: `${user.fullName || user.username} added you to "${updatedSpace.name}"`,
        type: 'system',
        target_id: spaceId
      }).catch(err => console.error("Notification Error:", err));

      showNotification(`${memberName} added to workspace`, 'success');
    } catch (err: any) {
      showNotification(err.message || 'Failed to add member', 'error');
    }
  };

  const handleRemoveMemberFromSpace = async (spaceId: string, memberId: string) => {
    try {
      await dataService.removeMemberFromSpace(spaceId, memberId);
      const updatedSpace = await dataService.getSpaceById(spaceId);
      setSpaces(spaces.map(s => s.id === spaceId ? updatedSpace : s));
      const memberName = employees.find(e => e.id === memberId)?.name || 'Member';
      showNotification(`${memberName} removed from workspace`, 'success');
    } catch (err: any) {
      showNotification(err.message || 'Failed to remove member', 'error');
    }
  };

  const handleDeleteSpace = async (spaceId: string) => {
    try {
      await dataService.deleteSpace(spaceId);
      setSpaces(spaces.filter(s => s.id !== spaceId));

      // If the deleted space was active, switch to another space or null
      if (activeSpaceId === spaceId) {
        const remainingSpaces = spaces.filter(s => s.id !== spaceId);
        setActiveSpaceId(remainingSpaces.length > 0 ? remainingSpaces[0].id : '');
        setCurrentView('dashboard');
      }


      showNotification('Workspace deleted successfully', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete workspace', 'error');
    }
  };

  const handleOpenAddTaskModal = (task: Task | Partial<Task> | null = null) => {
    setTaskToEdit(task);
    setAddTaskModalOpen(true);
  };

  const handleSaveTask = async (data: any, id: number | null) => {
    console.log("handleSaveTask called", { data, id, activeSpaceId, user });
    let spaceId = data.spaceId || activeSpaceId;

    // Fallback: If editing an existing task and spaceId is missing (e.g. Admin global view), find it from the task list
    if (!spaceId && id) {
      const existingTask = tasks.find(t => t.id === id);
      if (existingTask) {
        spaceId = existingTask.spaceId;
        console.log("Recovered spaceId from existing task:", spaceId);
      }
    }
    if (!spaceId || !user) {
      console.error("Missing spaceId or user", { spaceId, user });
      showNotification("Internal Error: Missing workspace or user context", 'error');
      return null;
    }

    // MERGE with existing task to preserve status, created_at, etc.
    let baseTask = {};
    if (id) {
      const existing = tasks.find(t => t.id === id);
      if (existing) {
        baseTask = existing;
      }
    }

    const payload = {
      ...baseTask, // Start with existing data
      ...data,     // Override with form data
      id: id || undefined,
      spaceId: spaceId,
      assigneeId: data.assigneeId || user.employeeId
    };

    try {
      console.log("Upserting task payload:", JSON.stringify(payload));
      const savedTask = await dataService.upsertTask(payload);
      console.log("Task upserted successfully:", JSON.stringify(savedTask));

      if (!savedTask || !savedTask.id) {
        throw new Error("Saved task is missing ID: " + JSON.stringify(savedTask));
      }

      if (id) {
        setTasks(tasks.map(t => t.id === id ? { ...t, ...savedTask } : t));
        logActivity(`updated "${data.title}"`);
      } else {
        setTasks([savedTask, ...tasks]);
        logActivity(`created "${savedTask.title}"`);
      }

      // Notify assignee if it's not the current user
      if (savedTask.assigneeId && savedTask.assigneeId !== user.employeeId) {
        dataService.createNotification({
          user_id: savedTask.assigneeId,
          title: id ? 'Task Updated' : 'New Task Assigned',
          message: `${user.fullName || user.username} ${id ? 'updated' : 'assigned'} task: ${savedTask.title}`,
          type: 'task',
          target_id: savedTask.id.toString()
        }).catch(err => console.error("Notification Error:", err));
      }

      setAddTaskModalOpen(false);
      return savedTask;
    } catch (err: any) {
      console.error("Error in handleSaveTask:", err);
      showNotification("Failed to save task", 'error');
      return null;
    }
  };

  const handleUpdateTask = async (taskId: number, updates: Partial<Task>) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;

    const updatedTask = { ...taskToUpdate, ...updates };
    setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));

    try {
      await dataService.upsertTask(updatedTask);
      if (updates.dueDate) {
        logActivity(`updated deadline for "${taskToUpdate.title}"`);
      }
    } catch (err: any) {
      console.error(err);
      showNotification("Failed to update task", 'error');
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: TaskStatus) => {
    console.log("handleUpdateTaskStatus called", { taskId, newStatus });
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) {
      console.error("Task not found with ID", taskId, "Available IDs:", tasks.map(t => t.id));
      return;
    }
    if (taskToUpdate.status === newStatus) {
      console.log("Status is already", newStatus, "skipping update");
      return;
    }

    // Optimistic UI Update
    const completedAt = newStatus === TaskStatus.DONE ? new Date().toISOString() : taskToUpdate.completedAt;
    const updatedTask = { ...taskToUpdate, status: newStatus, completedAt };

    // Optimistic unblocking
    const unblockedTasks = tasks.map(t => (t.blockedById === taskId) ? { ...t, blockedById: null } : t);
    setTasks(unblockedTasks.map(t => t.id === taskId ? updatedTask : t));

    try {
      if (!updatedTask.spaceId) {
        throw new Error("Missing workspace context (spaceId) for task");
      }
      await dataService.upsertTask(updatedTask);
      logActivity(`moved "${taskToUpdate.title}" to ${newStatus}`);
      showNotification(`Moved to ${newStatus}`, 'success');
    } catch (err: any) {
      console.error("Failed to update status:", err);
      showNotification("Failed to update status: " + (err.message || "Unknown error"), 'error');
      // Revert optimism
      setTasks(tasks.map(t => t.id === taskId ? taskToUpdate : t));
    }
  };

  const handleToggleTimer = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const now = new Date();
    let updated: Task;

    if (task.timerStartTime) {
      // Stop
      const start = new Date(task.timerStartTime);
      const dur = now.getTime() - start.getTime();
      try {
        await dataService.logTaskTime(task.id, task.timerStartTime, now.toISOString(), dur);
        await dataService.upsertTask({ ...task, timerStartTime: null });

        // Refetch or manual update? Manual for speed.
        updated = { ...task, timerStartTime: null, timeLogs: [{ id: 'temp', startTime: task.timerStartTime, endTime: now.toISOString(), duration: dur }, ...(task.timeLogs || [])] };
        logActivity(`logged time on "${task.title}"`);
        showNotification(`Timer stopped: ${Math.floor(dur / 1000 / 60)}m ${Math.floor((dur / 1000) % 60)}s`, 'success');
      } catch (err) { showNotification("Failed to log time", 'error'); return; }
    } else {
      // Start
      try {
        await dataService.upsertTask({ ...task, timerStartTime: now.toISOString() });
        updated = { ...task, timerStartTime: now.toISOString() };
        logActivity(`started timer on "${task.title}"`);
        showNotification("Timer started!", 'success');
      } catch (err) { showNotification("Failed to start timer", 'error'); return; }
    }
    setTasks(tasks.map(t => t.id === id ? updated : t));

    // Update selectedTask if it's the same task being updated
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask(updated);
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-white selection:bg-[#CEFD4A] selection:text-black relative font-sans">
      <Background videoSrc={backgroundVideo} />



      <TopNav
        activeSpaceName={currentSpace ? currentSpace.name : 'TaskFlow'}
        currentUserEmployee={currentUserEmployee}
        user={user}
        onOpenProfile={() => setProfileModalOpen(true)}
        onLogout={logout}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        currentView={currentView}
        timelineViewMode={timelineViewMode}
        onTimelineViewModeChange={setTimelineViewMode}
      />

      <div className="flex-1 flex flex-col min-w-0 relative z-0 pt-24 pb-32 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-none">
          <div className="max-w-[1800px] mx-auto animate-in fade-in duration-500">

            {/* ADMIN VIEW - Daily Overview or Timeline */}
            {user.isAdmin ? (
              <>
                {(currentView === 'overview' || currentView === 'home') && (
                  <AdminOverseerView
                    spaces={allSpaces}
                    tasks={allTasks}
                    employees={employees}
                    searchTerm={searchTerm}
                    onViewTask={(task) => { setSelectedTask(task); setTaskDetailsModalOpen(true); }}
                    onAddTask={(assigneeId, spaceId) => handleOpenAddTaskModal({ assigneeId, spaceId })}
                    userName={user.fullName || user.username}
                  />
                )}

                {currentView === 'timeline' && (
                  <>
                    {timelineViewMode === 'calendar' ? (
                      <CalendarView
                        tasks={filteredTasks}
                        onViewTask={(task) => { setSelectedTask(task); setTaskDetailsModalOpen(true); }}
                      />
                    ) : (
                      <GanttChart
                        tasks={filteredTasks}
                        employees={spaceMembers}
                        onViewTask={(task) => { setSelectedTask(task); setTaskDetailsModalOpen(true); }}
                      />
                    )}
                  </>
                )}
              </>
            ) : (
              // EMPLOYEE VIEW - Normal navigation with all views
              <>
                {/* Home View - Always accessible */}
                {currentView === 'home' && (
                  <HomeView
                    tasks={filteredTasks}
                    employees={spaceMembers}
                    currentSpace={currentSpace}
                    user={user}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onUpdateTaskStatus={handleUpdateTaskStatus}
                    onUpdateTask={handleUpdateTask}
                    onAddTask={(task) => handleSaveTask(task, null)}
                  />
                )}

                {/* Overview/Dashboard View */}
                {currentView === 'overview' && (
                  <AdminDashboard tasks={filteredTasks} employees={spaceMembers} activityLogs={activityLogs} isAdmin={user?.isAdmin} />
                )}

                {/* Whiteboard - Daily Task (Standalone) */}
                {currentView === 'whiteboard' && (
                  <div className="h-[calc(100vh-140px)]">
                    <Whiteboard />
                  </div>
                )}

                {/* Space-specific views */}
                {!activeSpaceId && !['home', 'overview', 'whiteboard'].includes(currentView) ? (
                  <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
                    <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                      <Cog6ToothIcon className="w-10 h-10 text-neutral-400" />
                    </div>
                    <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">No Space Selected</h2>
                    <p className="text-neutral-500 dark:text-neutral-400 max-w-md mb-6">
                      Join an existing team space using a code, or create a new one to get started.
                    </p>
                    <div className="flex gap-4">
                      <button onClick={() => setCreateSpaceModalOpen(true)} className="px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 shadow-lg transition-all duration-300">Create Space</button>
                      <button onClick={() => setJoinSpaceModalOpen(true)} className="px-6 py-3 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-white font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all duration-300">Join Space</button>
                    </div>
                  </div>
                ) : activeSpaceId && (
                  <>

                    {/* View Switching */}
                    {currentView === 'dashboard' && (
                      <AdminDashboard tasks={filteredTasks} employees={spaceMembers} activityLogs={activityLogs} isAdmin={user?.isAdmin} />
                    )}

                    {currentView === 'list' && (
                      <TaskListView
                        tasks={filteredTasks}
                        employees={spaceMembers}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        onEditTask={handleOpenAddTaskModal}
                        onDeleteTask={(id) => { setTaskToDeleteId(id); setDeleteModalOpen(true); }}
                        onViewTask={(task) => { setSelectedTask(task); setTaskDetailsModalOpen(true); }}
                        onUpdateTaskStatus={handleUpdateTaskStatus}
                        onToggleTimer={handleToggleTimer}
                      />
                    )}

                    {currentView === 'board' && (
                      <TaskBoard
                        tasks={filteredTasks}
                        allTasks={tasks}
                        employees={spaceMembers}
                        onEditTask={handleOpenAddTaskModal}
                        onDeleteTask={(id) => { setTaskToDeleteId(id); setDeleteModalOpen(true); }}
                        onUpdateTaskStatus={handleUpdateTaskStatus}
                        onViewTask={(task) => { setSelectedTask(task); setTaskDetailsModalOpen(true); }}
                        onToggleTimer={handleToggleTimer}
                      />
                    )}


                    {currentView === 'members' && (
                      <MembersView
                        employees={spaceMembers}
                        tasks={filteredTasks}
                        currentUser={{ employeeId: user?.employeeId, role: user?.role }}
                      />
                    )}

                    {currentView === 'timeline' && (
                      <>
                        {timelineViewMode === 'calendar' ? (
                          <CalendarView
                            tasks={filteredTasks}
                            onViewTask={(task) => { setSelectedTask(task); setTaskDetailsModalOpen(true); }}
                          />
                        ) : (
                          <GanttChart
                            tasks={filteredTasks}
                            employees={spaceMembers}
                            onViewTask={(task) => { setSelectedTask(task); setTaskDetailsModalOpen(true); }}
                          />
                        )}
                      </>
                    )}

                    {currentView === 'settings' && currentSpace && (
                      <SpaceSettingsView
                        space={currentSpace}
                        members={spaceMembers}
                        allEmployees={employees}
                        currentUserId={user?.employeeId}
                        onAddMember={handleAddMemberToSpace}
                        onRemoveMember={handleRemoveMemberFromSpace}
                        onDeleteSpace={handleDeleteSpace}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Hide BottomDock for admins - they only see Daily Overview */}
      <div>
        <BottomDock
          currentView={currentView}
          onViewChange={setCurrentView}
          activeSpaceId={activeSpaceId}
          isAdmin={user.isAdmin}
        />
      </div>

      {/* Modals */}
      {isAddTaskModalOpen && (
        <AddTaskModal
          isOpen={isAddTaskModalOpen}
          onClose={() => setAddTaskModalOpen(false)}
          onSave={handleSaveTask}
          employees={employees} // Admin should see all employees, or at least many
          taskToEdit={taskToEdit as Task}
          allTasks={allTasks}
          currentUserId={user?.employeeId}
          isAdmin={user?.isAdmin}
        />
      )}



      {isTaskDetailsModalOpen && selectedTask && (
        <TaskDetailsModal
          isOpen={isTaskDetailsModalOpen}
          onClose={() => setTaskDetailsModalOpen(false)}
          task={selectedTask}
          employees={spaceMembers}
          allTasks={filteredTasks}
          onAddComment={async (taskId, content) => {
            if (!user) return;
            try {
              const newComment = await dataService.addTaskComment(taskId, user.employeeId, content);
              const updatedTask = { ...selectedTask, comments: [...selectedTask.comments, newComment] };
              setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
              setSelectedTask(updatedTask);
            } catch (err) { console.error(err); }
          }}
          onDeleteTask={(id) => { setTaskToDeleteId(id); setDeleteModalOpen(true); }}
          onToggleTimer={handleToggleTimer}
        />
      )}

      {isDeleteModalOpen && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={async () => {
            if (taskToDeleteId) {
              try {
                await dataService.deleteTask(taskToDeleteId);
                setTasks(tasks.filter(t => t.id !== taskToDeleteId));
                showNotification('Deleted', 'success');
              } catch (err) { showNotification('Delete failed', 'error'); }
              setDeleteModalOpen(false);
            }
          }}
          title="Delete Task"
          message="This will permanently remove the task."
        />
      )}

      {isProfileModalOpen && user && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          user={user}
          currentUserEmployee={currentUserEmployee}
          onSave={(name, avatar) => {
            updateUser({ fullName: name, avatarUrl: avatar });
            showNotification('Profile updated successfully', 'success');
          }}
          onLogout={() => {
            setProfileModalOpen(false);
            logout();
          }}
        />
      )}

      <CreateSpaceModal
        isOpen={isCreateSpaceModalOpen}
        onClose={() => setCreateSpaceModalOpen(false)}
        onCreate={handleCreateSpace}
      />

      <JoinSpaceModal
        isOpen={isJoinSpaceModalOpen}
        onClose={() => setJoinSpaceModalOpen(false)}
        onJoin={handleJoinSpace}
      />

      {currentSpace && (
        <SpaceSettingsModal
          isOpen={isSpaceSettingsModalOpen}
          onClose={() => setSpaceSettingsModalOpen(false)}
          space={currentSpace}
          members={spaceMembers}
        />
      )}
    </div>
  );
};

// Main App Component with Routes
const App: React.FC = () => {
  // Check configuration first
  if (!isSupabaseConfigured) {
    return <SetupRequiredScreen />;
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<LoginPage />} />

      {/* Protected App Routes */}
      <Route path="/app" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/app/:view" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/app/home" replace />} />
      <Route path="*" element={<Navigate to="/app/home" replace />} />
    </Routes>
  );
};

export default App;
