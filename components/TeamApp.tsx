
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Employee, Task, Space, ActivityLog, TaskStatus, List } from '../types';
import * as dataService from '../services/supabaseService';
import HomeView from './HomeView';
import TaskBoard from './TaskBoard';
import Whiteboard from './Whiteboard';
import CalendarView from './CalendarView';
import GanttChart from './GanttChart';
import BottomDock from './BottomDock';
import TopNav from './TopNav';
import TaskDetailsModal from './TaskDetailsModal';
// import AddTaskModal from './AddTaskModal';
import CreateTaskModal from './CreateTaskModal';
import ProfileModal from './ProfileModal';
import CreateSpaceModal from './CreateSpaceModal';
import JoinSpaceModal from './JoinSpaceModal';
import CreateListModal from './CreateListModal';
import Sidebar from './Sidebar';
import Background from './Background';
import { useDailyTasks } from '../hooks/useDailyTasks';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { useTheme } from './hooks/useTheme';
import AdminDashboard from './AdminDashboard';
import MembersView from './MembersView';

interface TeamAppProps {
    user: User;
    onLogout: () => void;
}

const TeamApp: React.FC<TeamAppProps> = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [allUserTasks, setAllUserTasks] = useState<Task[]>([]);
    const [activeSpaceId, setActiveSpaceId] = useState<string>('');
    const [memberships, setMemberships] = useState<{ space_id: string; user_id: string; role: string }[]>([]);
    const [lists, setLists] = useState<List[]>([]);
    const [activeListId, setActiveListId] = useState<number | null>(null);

    // Sidebar State
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [, , , , compactMode] = useTheme();

    // View State
    const [searchTerm, setSearchTerm] = useState('');
    const [timelineViewMode, setTimelineViewMode] = useState<'calendar' | 'gantt'>('calendar');

    // Modals
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
    const { tasks: dailyTasks } = useDailyTasks(); // simplified usage

    // Derive Current View
    const currentView = useMemo(() => {
        const path = location.pathname;
        if (path.includes('/home')) return 'home';
        if (path.includes('/overview')) return 'overview';
        if (path.includes('/members')) return 'members';
        if (path.includes('/board')) return 'board';
        if (path.includes('/whiteboard')) return 'whiteboard';
        if (path.includes('/timeline')) return 'timeline';
        if (path.includes('/settings')) return 'settings';
        return 'home'; // Default
    }, [location.pathname]);

    // Load Data
    useEffect(() => {
        loadData();
    }, [user]);

    useEffect(() => {
        if (activeSpaceId) {
            loadSpaceTasks(activeSpaceId);
        }
    }, [activeSpaceId]);

    const refreshAllUserTasks = async () => {
        const spcs = await dataService.getSpaces(user.employeeId);
        if (spcs.length > 0) {
            const allTasksPromises = spcs.map(s => dataService.getTasks(s.id, user.employeeId));
            const allTasksResults = await Promise.all(allTasksPromises);
            const flattenedTasks = allTasksResults.flat();
            setAllUserTasks(flattenedTasks);
        }
    };

    const loadData = async () => {
        try {
            const emps = await dataService.getAllEmployees();
            const spcs = await dataService.getSpaces(user.employeeId);
            setEmployees(emps);
            setSpaces(spcs);

            // Fetch lists for all spaces
            if (spcs.length > 0) {
                const allListsPromises = spcs.map(s => dataService.getLists(s.id));
                const allListsResults = await Promise.all(allListsPromises);
                setLists(allListsResults.flat());
            }

            // Fetch memberships to correctly identify roles in each space
            const spaceIds = spcs.map(s => s.id);
            if (spaceIds.length > 0) {
                const mems = await dataService.getMemberships(spaceIds);
                setMemberships(mems);
            }

            // Fetch tasks for all user's spaces to populate overview/analytics
            await refreshAllUserTasks();

            if (spcs.length > 0 && !activeSpaceId) {
                setActiveSpaceId(spcs[0].id);
            }
        } catch (err) {
            console.error("Failed to load team data", err);
        }
    };

    const loadSpaceTasks = async (sid: string) => {
        try {
            const t = await dataService.getTasks(sid, user.employeeId);
            setTasks(t);
        } catch (e) { console.error(e); }
    };

    const loadLists = async () => {
        if (spaces.length > 0) {
            const allListsPromises = spaces.map(s => dataService.getLists(s.id));
            const allListsResults = await Promise.all(allListsPromises);
            setLists(allListsResults.flat());
        }
    };

    const currentSpace = spaces.find(s => s.id === activeSpaceId);

    // Filtering
    const filteredTasks = useMemo(() => {
        let t = tasks;
        if (activeListId) {
            t = t.filter(task => task.listId === activeListId);
        }
        if (searchTerm) {
            t = t.filter(task => task.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return t;
    }, [tasks, searchTerm, activeListId]);

    const spaceMembers = useMemo(() => {
        if (!currentSpace) return [];
        return employees
            .filter(e => currentSpace.members.includes(e.id))
            .map(e => {
                const membership = memberships.find(m => m.user_id === e.id && m.space_id === currentSpace.id);
                // Cast to specific string union if needed, or string is fine as it matches 'admin'|'member'
                const role = (membership?.role || 'member') as 'admin' | 'member';
                // Super admin status comes from profile (e.isAdmin in backend, or relying on auth user for self)
                // For other employees, we might need isSuperAdmin check if we fetched it.
                // NOTE: getAllEmployees returns basic Employee. isSuperAdmin might be missing if we reverted to getAllEmployees.

                return { ...e, role };
            });
    }, [currentSpace, employees, memberships]);

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
            if (!sid) {
                console.error("No active space to save task to");
                return;
            }
            await dataService.upsertTask({ ...task, spaceId: sid, id });
            loadSpaceTasks(sid);
            // Also refresh all user tasks to keep dashboard/overview in sync
            await dataService.upsertTask({ ...task, spaceId: sid, id });
            loadSpaceTasks(sid);
            // Also refresh all user tasks to keep dashboard/overview in sync
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
                title: mergedTask.title || ''
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
                // Stop timer
                const start = new Date(task.timerStartTime);
                const end = new Date();
                const duration = end.getTime() - start.getTime();
                await dataService.logTaskTime(taskId, task.timerStartTime, end.toISOString(), duration);

                // Clear timer
                await dataService.upsertTask({
                    ...task,
                    timerStartTime: null,
                    spaceId: task.spaceId,
                    title: task.title
                });
            } else {
                // Start timer
                await dataService.upsertTask({
                    ...task,
                    timerStartTime: new Date().toISOString(),
                    spaceId: task.spaceId,
                    title: task.title
                });
            }
            loadSpaceTasks(activeSpaceId);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddComment = async (taskId: number, content: string) => {
        try {
            await dataService.addTaskComment(taskId, user.employeeId, content);
            loadSpaceTasks(activeSpaceId); // Refresh to show comment
        } catch (e) { console.error(e); }
    };

    const handleSaveProfile = async (data: { name: string; avatarUrl: string; phone: string; position: string; email?: string }) => {
        try {
            await dataService.updateProfile(user.employeeId, {
                fullName: data.name,
                avatarUrl: data.avatarUrl,
                phone: data.phone,
                position: data.position,
                email: data.email
            });
            loadData();
            setProfileModalOpen(false);
        } catch (e) {
            console.error(e);
        }
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
            loadLists(); // Refresh lists
            setCreateListModalOpen(false);
            setCreateListSpaceId(null);
        } catch (e) { console.error(e); }
    };

    return (
        <>
            <div className="flex h-screen overflow-hidden bg-transparent text-white relative font-sans">
                <Background videoSrc="/background.gif" />

                <div className="flex flex-col h-full w-full relative z-0">
                    <TopNav
                        activeSpaceName={currentSpace?.name || 'My Workspace'}
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
                            onSelectSpace={(sid: string) => setActiveSpaceId(sid)}
                            onViewChange={(v: string) => navigate(`/app/${v}`)}
                            onOpenProfile={() => setProfileModalOpen(true)}
                            onLogout={onLogout}
                            onCreateSpace={() => setCreateSpaceModalOpen(true)}
                            onJoinSpace={() => setJoinSpaceModalOpen(true)}
                            onCreateList={(sid: string) => { setCreateListSpaceId(sid); setCreateListModalOpen(true); }}
                            onCreateTask={() => setCreateTaskModalOpen(true)}
                            onSelectList={(lid: number | null) => setActiveListId(lid)}
                            currentUserEmployee={employees.find(e => e.id === user.employeeId)}
                            user={user}
                            compactMode={compactMode}
                        />

                        <main className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-none">
                            <div className="max-w-[1800px] mx-auto animate-in fade-in duration-500">

                                {currentView === 'home' && (
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

                                {currentView === 'board' && (
                                    <TaskBoard
                                        tasks={filteredTasks}
                                        allTasks={tasks}
                                        employees={spaceMembers}
                                        onUpdateTaskStatus={handleUpdateTaskStatus}
                                        onEditTask={(t) => {
                                            setTaskToEdit(t);
                                            setCreateTaskModalOpen(true);
                                        }}
                                        onViewTask={(t) => { setSelectedTask(t); setTaskDetailsModalOpen(true); }}
                                        onToggleTimer={handleToggleTimer}
                                    />
                                )}

                                {currentView === 'whiteboard' && <Whiteboard />}

                                {currentView === 'overview' && (
                                    <AdminDashboard
                                        tasks={allUserTasks}
                                        employees={employees}
                                        activityLogs={[]}
                                        isAdmin={false}
                                    />
                                )}

                                {currentView === 'members' && (
                                    <MembersView
                                        employees={spaceMembers} // Show only space members? Or all? "Team Members" implies space members.
                                        tasks={allUserTasks}
                                        currentUser={user}
                                        currentSpace={currentSpace} // Pass current space
                                        onMemberUpdate={loadData} // callback to refresh
                                    />
                                )}

                                {currentView === 'timeline' && (
                                    <div className="h-[calc(100vh-200px)]">
                                        {timelineViewMode === 'calendar' ? (
                                            <CalendarView tasks={filteredTasks} onViewTask={(t) => { setSelectedTask(t); setTaskDetailsModalOpen(true); }} />
                                        ) : (
                                            <GanttChart tasks={filteredTasks} employees={spaceMembers} onViewTask={(t) => { setSelectedTask(t); setTaskDetailsModalOpen(true); }} />
                                        )}
                                    </div>
                                )}

                            </div>
                        </main>
                    </div>
                </div>

                {/* BottomDock removed in favor of Sidebar for desktop layout */}
                {/* <BottomDock
                    currentView={currentView}
                    onViewChange={(v) => navigate(`/app/${v}`)}
                    activeSpaceId={activeSpaceId}
                    isAdmin={false}
                /> */}

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
                        onClose={() => setCreateTaskModalOpen(false)}
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

                {isCreateSpaceModalOpen && (
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

export default TeamApp;
