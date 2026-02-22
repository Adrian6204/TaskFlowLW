import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { User, Employee, Task, Space, List, TaskStatus } from '../types';
import * as dataService from '../services/supabaseService';

// Views
import WorkspaceHomePage from './WorkspaceHomePage';
import HomeView from './HomeView';
import TaskBoard from './TaskBoard';
import Whiteboard from './Whiteboard';
import CalendarView from './CalendarView';
import GanttChart from './GanttChart';
import AdminDashboard from './AdminDashboard';
import AdminOverseerView from './AdminOverseerView';
import MembersView from './MembersView';
import UserManagementView from './UserManagementView';

// Modals
import TaskDetailsModal from './TaskDetailsModal';
import CreateTaskModal from './CreateTaskModal';
import ProfileModal from './ProfileModal';
import CreateSpaceModal from './CreateSpaceModal';
import JoinSpaceModal from './JoinSpaceModal';
import CreateListModal from './CreateListModal';

// Layout
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import Background from './Background';

// Hooks
import { useDailyTasks } from '../hooks/useDailyTasks';
import { useTheme } from './hooks/useTheme';
import { usePreferences } from './hooks/usePreferences';
import SpaceSettingsView from './SpaceSettingsView';

interface MainAppProps {
    user: User;
    onLogout: () => void;
}

const MainApp: React.FC<MainAppProps> = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [, , , ,] = useTheme();
    const [preferences] = usePreferences();

    // ─── URL Slug Helpers ────────────────────────────────────────────────
    /** Convert a space name to a URL-safe slug: "AI Interviewer" → "ai-interviewer" */
    const toSlug = (name: string) =>
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    /** Map internal view IDs to URL-readable segments and back */
    const VIEW_TO_URL: Record<string, string> = {
        home: 'overview',
        board: 'task-board',
        whiteboard: 'whiteboard',
        timeline: 'calendar',
        members: 'members',
        overview: 'analytics',
        team: 'user-management',
        settings: 'settings',
    };
    const URL_TO_VIEW: Record<string, string> = Object.fromEntries(
        Object.entries(VIEW_TO_URL).map(([k, v]) => [v, k])
    );
    // ─── Data State ──────────────────────────────────────────────────────
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]); // tasks for the active space
    const [allUserTasks, setAllUserTasks] = useState<Task[]>([]); // tasks across all user's spaces
    const [memberships, setMemberships] = useState<{ space_id: string; user_id: string; role: string }[]>([]);
    const [lists, setLists] = useState<List[]>([]);

    // ─── Active Space ─────────────────────────────────────────────────────
    // Derived from the URL: /app/workspace/:spaceSlug/view
    // We match on slug (name-based) and resolve back to the real space ID.
    const activeSpaceId = useMemo(() => {
        const match = location.pathname.match(/\/app\/workspace\/([^/]+)/);
        if (!match) return '';
        const slug = match[1];
        // First try direct UUID match (legacy URLs), then try slug match
        const byId = spaces.find(s => s.id === slug);
        const bySlug = spaces.find(s => toSlug(s.name) === slug);
        return (byId || bySlug)?.id || '';
    }, [location.pathname, spaces]);

    const [activeListId, setActiveListId] = useState<number | null>(null);

    // ─── UI State ─────────────────────────────────────────────────────────
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [timelineViewMode, setTimelineViewMode] = useState<'calendar' | 'gantt'>('calendar');

    // ─── Modals ───────────────────────────────────────────────────────────
    const [isCreateTaskModalOpen, setCreateTaskModalOpen] = useState(false);
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [isCreateSpaceModalOpen, setCreateSpaceModalOpen] = useState(false);
    const [isJoinSpaceModalOpen, setJoinSpaceModalOpen] = useState(false);
    const [isCreateListModalOpen, setCreateListModalOpen] = useState(false);
    const [createListSpaceId, setCreateListSpaceId] = useState<string | null>(null);
    const [isTaskDetailsModalOpen, setTaskDetailsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [taskToEdit, setTaskToEdit] = useState<Task | Partial<Task> | null>(null);

    // Custom Hooks
    const { tasks: dailyTasks } = useDailyTasks();

    // ─── Derived Current View ─────────────────────────────────────────────
    const currentView = useMemo(() => {
        const path = location.pathname;
        if (path === '/app' || path === '/app/' || path === '/app/home') return 'home';
        // Workspace-specific views: map URL segment back to internal view ID
        const match = path.match(/\/app\/workspace\/[^/]+\/(.+)/);
        if (match) return URL_TO_VIEW[match[1]] || match[1];
        return 'home';
    }, [location.pathname]);

    const currentSpace = useMemo(() => spaces.find(s => s.id === activeSpaceId), [spaces, activeSpaceId]);

    // ─── Role Resolution ──────────────────────────────────────────────────
    const isSuperAdmin = user.role === 'super_admin' || user.isAdmin === true;

    const currentSpaceRole = useMemo(() => {
        if (isSuperAdmin) return 'admin'; // super admin always has full access
        if (!activeSpaceId) return 'member';
        const mem = memberships.find(m => m.space_id === activeSpaceId && m.user_id === user.employeeId);
        return (mem?.role || 'member') as 'admin' | 'member';
    }, [isSuperAdmin, activeSpaceId, memberships, user.employeeId]);

    // ─── Initial Redirect ─────────────────────────────────────────────────
    useEffect(() => {
        if (location.pathname === '/app' || location.pathname === '/app/') {
            navigate('/app/home', { replace: true });
        }
    }, [location.pathname, navigate]);

    // ─── Data Loading ─────────────────────────────────────────────────────
    useEffect(() => {
        loadData();
    }, [user.employeeId]);

    useEffect(() => {
        if (activeSpaceId) {
            loadSpaceTasks(activeSpaceId);
            setActiveListId(null);
        }
    }, [activeSpaceId]);

    const loadData = async () => {
        try {
            const [emps, spcs] = await Promise.all([
                dataService.getAllEmployees(),
                dataService.getSpaces(user.employeeId),
            ]);
            setEmployees(emps);
            setSpaces(spcs);

            if (spcs.length > 0) {
                const spaceIds = spcs.map(s => s.id);
                const [allListsResults, mems] = await Promise.all([
                    Promise.all(spcs.map(s => dataService.getLists(s.id))),
                    dataService.getMemberships(spaceIds),
                ]);
                setLists(allListsResults.flat());
                setMemberships(mems);

                // Fetch all tasks for all user's spaces
                await refreshAllUserTasks(spcs);
            }
        } catch (err) {
            console.error('Failed to load data', err);
        }
    };

    const refreshAllUserTasks = async (spcs?: Space[]) => {
        const spacesToUse = spcs || spaces;
        if (spacesToUse.length === 0) return;
        const allTasksResults = await Promise.all(
            spacesToUse.map(s => dataService.getTasks(s.id, user.employeeId))
        );
        setAllUserTasks(allTasksResults.flat());
    };

    const loadSpaceTasks = async (sid: string) => {
        try {
            const t = await dataService.getTasks(sid, user.employeeId);
            setTasks(t);
        } catch (e) {
            console.error(e);
        }
    };

    const loadLists = async () => {
        if (spaces.length > 0) {
            const allListsResults = await Promise.all(spaces.map(s => dataService.getLists(s.id)));
            setLists(allListsResults.flat());
        }
    };

    // ─── Computed Values ──────────────────────────────────────────────────
    const filteredTasks = useMemo(() => {
        let t = tasks;
        if (activeListId) t = t.filter(task => task.listId === activeListId);
        if (searchTerm) t = t.filter(task => task.title.toLowerCase().includes(searchTerm.toLowerCase()));
        return t;
    }, [tasks, searchTerm, activeListId]);

    const spaceMembers = useMemo(() => {
        if (!currentSpace) return [];
        return employees
            .filter(e => currentSpace.members.includes(e.id))
            .map(e => {
                const membership = memberships.find(m => m.user_id === e.id && m.space_id === currentSpace.id);
                return { ...e, role: (membership?.role || 'member') as 'admin' | 'member' };
            });
    }, [currentSpace, employees, memberships]);

    // ─── Handlers ─────────────────────────────────────────────────────────
    const handleSelectSpace = (spaceId: string) => {
        const space = spaces.find(s => s.id === spaceId);
        const slug = space ? toSlug(space.name) : spaceId;
        navigate(`/app/workspace/${slug}/overview`);
    };

    const handleViewChange = (view: string) => {
        if (activeSpaceId) {
            // Inside a workspace — all views including 'home' (Overview) stay in workspace context
            const space = spaces.find(s => s.id === activeSpaceId);
            const slug = space ? toSlug(space.name) : activeSpaceId;
            const urlView = VIEW_TO_URL[view] || view;
            navigate(`/app/workspace/${slug}/${urlView}`);
        } else {
            // On the global home page
            navigate('/app/home');
        }
    };

    const handleUpdateTaskStatus = async (id: number, status: TaskStatus) => {
        try {
            const task = tasks.find(t => t.id === id) || allUserTasks.find(t => t.id === id);
            if (task) {
                await dataService.upsertTask({ ...task, status, spaceId: task.spaceId });
                if (activeSpaceId) loadSpaceTasks(activeSpaceId);
                refreshAllUserTasks();
            }
        } catch (e) { console.error(e); }
    };

    const handleSaveTask = async (task: any, id: number | null) => {
        try {
            const sid = activeSpaceId || (spaces.length > 0 ? spaces[0].id : '');
            if (!sid) return;
            await dataService.upsertTask({ ...task, spaceId: sid, id });
            loadSpaceTasks(sid);
            refreshAllUserTasks();
            setCreateTaskModalOpen(false);
        } catch (e) { console.error(e); }
    };

    const handleUpdateTask = async (taskId: number, updates: Partial<Task>) => {
        try {
            const existingTask = tasks.find(t => t.id === taskId) || allUserTasks.find(t => t.id === taskId);
            if (!existingTask) return;
            const mergedTask = { ...existingTask, ...updates };
            await dataService.upsertTask({
                ...mergedTask,
                spaceId: mergedTask.spaceId || activeSpaceId || '',
                title: mergedTask.title || '',
            });
            if (activeSpaceId) loadSpaceTasks(activeSpaceId);
            refreshAllUserTasks();
        } catch (e) { console.error(e); }
    };

    const handleToggleTimer = async (taskId: number) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        try {
            if (task.timerStartTime) {
                const start = new Date(task.timerStartTime);
                const end = new Date();
                const duration = end.getTime() - start.getTime();
                await dataService.logTaskTime(taskId, task.timerStartTime, end.toISOString(), duration);
                await dataService.upsertTask({ ...task, timerStartTime: null, spaceId: task.spaceId, title: task.title });
            } else {
                await dataService.upsertTask({ ...task, timerStartTime: new Date().toISOString(), spaceId: task.spaceId, title: task.title });
            }
            loadSpaceTasks(activeSpaceId);
        } catch (e) { console.error(e); }
    };

    const handleAddComment = async (taskId: number, content: string) => {
        try {
            await dataService.addTaskComment(taskId, user.employeeId, content);
            loadSpaceTasks(activeSpaceId);
        } catch (e) { console.error(e); }
    };

    const handleSaveProfile = async (data: { name: string; avatarUrl: string; phone: string; position: string; email?: string }) => {
        try {
            await dataService.updateProfile(user.employeeId, {
                fullName: data.name,
                avatarUrl: data.avatarUrl,
                phone: data.phone,
                position: data.position,
                email: data.email,
            });
            loadData();
            setProfileModalOpen(false);
        } catch (e) { console.error(e); }
    };

    const handleCreateSpace = async (name: string, description?: string) => {
        try {
            await dataService.createSpace(name, user.employeeId, description);
            loadData();
            setCreateSpaceModalOpen(false);
        } catch (e) { console.error(e); }
    };

    const handleJoinSpace = async (code: string) => {
        try {
            await dataService.joinSpace(code, user.employeeId);
            loadData();
            setJoinSpaceModalOpen(false);
        } catch (e) { console.error(e); }
    };

    const handleCreateList = async (name: string) => {
        if (!createListSpaceId) return;
        try {
            await dataService.createList(createListSpaceId, name);
            loadLists();
            setCreateListModalOpen(false);
            setCreateListSpaceId(null);
        } catch (e) { console.error(e); }
    };

    // ─── Whether we're on a workspace route ───────────────────────────────
    const isOnWorkspace = !!activeSpaceId;
    const isOnHome = !isOnWorkspace || currentView === 'home';

    return (
        <>
            <div className="flex h-screen overflow-hidden bg-transparent text-white relative font-sans">
                <Background videoSrc="/background.gif" />

                <div className="flex flex-col h-full w-full relative z-0">
                    <TopNav
                        activeSpaceName={isOnWorkspace ? (currentSpace?.name || 'Workspace') : 'TaskFlow'}
                        currentUserEmployee={employees.find(e => e.id === user.employeeId)}
                        user={user}
                        onOpenProfile={() => setProfileModalOpen(true)}
                        onLogout={onLogout}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        currentView={currentView}
                        timelineViewMode={timelineViewMode}
                        onTimelineViewModeChange={setTimelineViewMode}
                        onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
                        hideBrandOnDesktop={false}
                    />

                    <div className="flex-1 flex overflow-hidden">
                        <Sidebar
                            isOpen={isSidebarOpen}
                            onToggle={() => setSidebarOpen(!isSidebarOpen)}
                            activeSpaceId={activeSpaceId}
                            activeListId={activeListId}
                            spaces={spaces}
                            lists={lists}
                            currentView={currentView}
                            onSelectSpace={handleSelectSpace}
                            onViewChange={handleViewChange}
                            onOpenProfile={() => setProfileModalOpen(true)}
                            onLogout={onLogout}
                            onCreateSpace={isSuperAdmin ? () => setCreateSpaceModalOpen(true) : () => { }}
                            onJoinSpace={() => setJoinSpaceModalOpen(true)}
                            onCreateList={(sid: string) => { setCreateListSpaceId(sid); setCreateListModalOpen(true); }}
                            onCreateTask={() => setCreateTaskModalOpen(true)}
                            onSelectList={(lid: number | null) => setActiveListId(lid)}
                            currentUserEmployee={employees.find(e => e.id === user.employeeId)}
                            user={user}
                            isSuperAdmin={isSuperAdmin}
                            currentSpaceRole={currentSpaceRole}
                            allUserTasks={allUserTasks}
                        />

                        <main className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-none">
                            <div className="max-w-[1800px] mx-auto animate-in fade-in duration-500">

                                {/* ── Home: Workspace Cards ── */}
                                {currentView === 'home' && !isOnWorkspace && (
                                    <WorkspaceHomePage
                                        spaces={spaces}
                                        user={user}
                                        onSelectSpace={handleSelectSpace}
                                        onCreateSpace={() => setCreateSpaceModalOpen(true)}
                                        onJoinSpace={() => setJoinSpaceModalOpen(true)}
                                        memberships={memberships}
                                    />
                                )}

                                {/* ── Workspace Detail Views ── */}

                                {/* Workspace Home / Daily Tasks */}
                                {isOnWorkspace && currentView === 'home' && (
                                    <HomeView
                                        tasks={allUserTasks}
                                        employees={spaceMembers}
                                        currentSpace={currentSpace!}
                                        user={user}
                                        searchTerm={searchTerm}
                                        onSearchChange={setSearchTerm}
                                        onUpdateTaskStatus={handleUpdateTaskStatus}
                                        onUpdateTask={handleUpdateTask}
                                        onAddTask={() => Promise.resolve(setCreateTaskModalOpen(true))}
                                    />
                                )}

                                {/* Task Board */}
                                {isOnWorkspace && currentView === 'board' && (
                                    <TaskBoard
                                        tasks={filteredTasks}
                                        allTasks={tasks}
                                        employees={spaceMembers}
                                        onUpdateTaskStatus={handleUpdateTaskStatus}
                                        onEditTask={(t) => { setTaskToEdit(t); setCreateTaskModalOpen(true); }}
                                        onViewTask={(t) => { setSelectedTask(t); setTaskDetailsModalOpen(true); }}
                                        onToggleTimer={handleToggleTimer}
                                    />
                                )}

                                {/* Whiteboard */}
                                {isOnWorkspace && currentView === 'whiteboard' && <Whiteboard />}

                                {/* Timeline / Calendar */}
                                {isOnWorkspace && currentView === 'timeline' && (
                                    <div className="h-[calc(100vh-200px)]">
                                        {timelineViewMode === 'calendar' ? (
                                            <CalendarView tasks={filteredTasks} onViewTask={(t) => { setSelectedTask(t); setTaskDetailsModalOpen(true); }} />
                                        ) : (
                                            <GanttChart tasks={filteredTasks} employees={spaceMembers} onViewTask={(t) => { setSelectedTask(t); setTaskDetailsModalOpen(true); }} />
                                        )}
                                    </div>
                                )}

                                {/* Overview / Analytics (admin + super_admin only) */}
                                {isOnWorkspace && currentView === 'overview' && (currentSpaceRole === 'admin' || isSuperAdmin) && (
                                    <AdminDashboard
                                        tasks={tasks}
                                        employees={spaceMembers}
                                        activityLogs={[]}
                                        isAdmin={isSuperAdmin}
                                    />
                                )}

                                {/* Members */}
                                {isOnWorkspace && currentView === 'members' && (
                                    <MembersView
                                        employees={spaceMembers}
                                        tasks={allUserTasks}
                                        currentUser={user}
                                        currentSpace={currentSpace}
                                        onMemberUpdate={loadData}
                                    />
                                )}

                                {/* User Management (super_admin only) */}
                                {isOnWorkspace && currentView === 'team' && isSuperAdmin && (
                                    <UserManagementView currentUserId={user.employeeId} spaces={spaces} />
                                )}

                                {/* Space Settings (admin + super_admin) */}
                                {isOnWorkspace && currentView === 'settings' && (currentSpaceRole === 'admin' || isSuperAdmin) && currentSpace && (
                                    <SpaceSettingsView
                                        space={currentSpace}
                                        members={spaceMembers}
                                        allEmployees={employees}
                                        currentUserId={user.employeeId}
                                        onRemoveMember={async (spaceId, memberId) => {
                                            try {
                                                await dataService.removeMemberFromSpace(spaceId, memberId);
                                                loadData();
                                            } catch (e) { console.error(e); }
                                        }}
                                        onAddMember={async (spaceId, memberId) => {
                                            try {
                                                await dataService.addMemberToSpace(spaceId, memberId);
                                                loadData();
                                            } catch (e) { console.error(e); }
                                        }}
                                        onDeleteSpace={async (spaceId) => {
                                            try {
                                                await dataService.deleteSpace(spaceId);
                                                navigate('/app/home');
                                                loadData();
                                            } catch (e) { console.error(e); }
                                        }}
                                    />
                                )}

                                {/* Overseer View (super_admin analytics) */}
                                {isOnWorkspace && currentView === 'analytics' && isSuperAdmin && (
                                    <AdminOverseerView
                                        spaces={spaces}
                                        tasks={allUserTasks}
                                        employees={employees}
                                        searchTerm={searchTerm}
                                        onViewTask={(t) => { setSelectedTask(t); setTaskDetailsModalOpen(true); }}
                                        onAddTask={(mid, sid) => { setTaskToEdit({ assigneeId: mid, spaceId: sid }); setCreateTaskModalOpen(true); }}
                                        userName={user.fullName}
                                    />
                                )}

                            </div>
                        </main>
                    </div>
                </div>

                {/* ── Modals ── */}
                {isProfileModalOpen && (
                    <ProfileModal
                        isOpen={isProfileModalOpen}
                        onClose={() => setProfileModalOpen(false)}
                        user={user}
                        currentUserEmployee={employees.find(e => e.id === user.employeeId)}
                        onSave={handleSaveProfile}
                        onLogout={onLogout}
                    />
                )}

                {isTaskDetailsModalOpen && selectedTask && (
                    <TaskDetailsModal
                        isOpen={isTaskDetailsModalOpen}
                        onClose={() => setTaskDetailsModalOpen(false)}
                        task={selectedTask}
                        employees={employees}
                        allTasks={tasks}
                        onAddComment={handleAddComment}
                        onToggleTimer={handleToggleTimer}
                        currentUserId={user.employeeId}
                    />
                )}

                {isCreateTaskModalOpen && (
                    <CreateTaskModal
                        isOpen={isCreateTaskModalOpen}
                        onClose={() => { setCreateTaskModalOpen(false); setTaskToEdit(null); }}
                        onSave={handleSaveTask}
                        taskToEdit={taskToEdit}
                        employees={spaceMembers}
                        activeSpaceId={activeSpaceId}
                        spaces={spaces}
                        lists={lists}
                        currentUserId={user.employeeId}
                        isAdmin={user.isAdmin}
                    />
                )}

                {isCreateSpaceModalOpen && isSuperAdmin && (
                    <CreateSpaceModal
                        isOpen={isCreateSpaceModalOpen}
                        onClose={() => setCreateSpaceModalOpen(false)}
                        onCreate={handleCreateSpace}
                    />
                )}

                {isJoinSpaceModalOpen && (
                    <JoinSpaceModal
                        isOpen={isJoinSpaceModalOpen}
                        onClose={() => setJoinSpaceModalOpen(false)}
                        onJoin={handleJoinSpace}
                    />
                )}

                {isCreateListModalOpen && (
                    <CreateListModal
                        isOpen={isCreateListModalOpen}
                        onClose={() => setCreateListModalOpen(false)}
                        onCreate={handleCreateList}
                    />
                )}
            </div>
        </>
    );
};

export default MainApp;
