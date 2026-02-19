import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Employee, Task, Space, ActivityLog } from '../types';
import * as dataService from '../services/supabaseService';
import AdminDashboard from './AdminDashboard';
import AdminOverseerView from './AdminOverseerView';
import CalendarView from './CalendarView';
import GanttChart from './GanttChart';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import TaskDetailsModal from './TaskDetailsModal';
import AddTaskModal from './AddTaskModal';
import ProfileModal from './ProfileModal';
import CreateSpaceModal from './CreateSpaceModal';
import JoinSpaceModal from './JoinSpaceModal';
import Background from './Background';
import UserManagementView from './UserManagementView';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { useTheme } from './hooks/useTheme';

interface LeadershipAppProps {
    user: User;
    onLogout: () => void;
}

const LeadershipApp: React.FC<LeadershipAppProps> = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [allTasks, setAllTasks] = useState<Task[]>([]);


    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [, , , , compactMode] = useTheme();

    // View State
    const [timelineViewMode, setTimelineViewMode] = useState<'calendar' | 'gantt'>('calendar');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [isTaskDetailsModalOpen, setTaskDetailsModalOpen] = useState(false);
    const [isAddTaskModalOpen, setAddTaskModalOpen] = useState(false);
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [isCreateSpaceModalOpen, setCreateSpaceModalOpen] = useState(false);
    const [isJoinSpaceModalOpen, setJoinSpaceModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [taskToEdit, setTaskToEdit] = useState<Task | Partial<Task> | null>(null);

    // Derive Current View
    const currentView = useMemo(() => {
        const path = location.pathname;
        if (path.includes('/analytics')) return 'analytics';
        if (path.includes('/overview')) return 'overview';
        if (path.includes('/team')) return 'team';
        if (path.includes('/timeline')) return 'timeline';
        if (path.includes('/settings')) return 'settings';
        return 'analytics'; // Default
    }, [location.pathname]);

    // Load Data
    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            const [emps, spcs, tasks] = await Promise.all([
                dataService.getAllUsersWithRoles(),
                dataService.getAllSpaces(),
                dataService.getAllTasksAcrossSpaces()
            ]);
            setEmployees(emps);
            setSpaces(spcs);
            setAllTasks(tasks);
        } catch (err) {
            console.error("Failed to load leadership data", err);
        }
    };

    const handleViewChange = (view: string) => {
        navigate(`/app/${view}`);
    };

    const handleSaveTask = async (task: any, id: number | null) => {
        // Implement basic save for now, reusing service
        try {
            await dataService.upsertTask({ ...task, id });
            loadData(); // Reload for simplicity
            setAddTaskModalOpen(false);
        } catch (e) {
            console.error(e);
        }
    };


    const handleAddComment = async (taskId: number, content: string) => {
        try {
            await dataService.addTaskComment(taskId, user.employeeId, content);
            loadData();
        } catch (e) { console.error(e); }
    };

    const handleToggleTimer = async (taskId: number) => {
        const task = allTasks.find(t => t.id === taskId);
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
                    title: task.title,
                    spaceId: task.spaceId
                });
            } else {
                // Start timer
                await dataService.upsertTask({
                    ...task,
                    timerStartTime: new Date().toISOString(),
                    title: task.title,
                    spaceId: task.spaceId
                });
            }
            loadData();
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

    const handleSaveProfile = async (data: { name: string; avatarUrl: string; phone: string; position: string; email?: string }) => {
        try {
            await dataService.updateProfile(user.employeeId, {
                fullName: data.name,
                avatarUrl: data.avatarUrl,
                phone: data.phone,
                position: data.position,
                email: data.email
            });
            loadData(); // Reload to reflect changes
            setProfileModalOpen(false);
        } catch (e) {
            console.error(e);
        }
    };


    return (
        <>
            <div className="flex h-screen overflow-hidden bg-transparent text-white relative font-sans">
                <Background videoSrc="/background.gif" />

                <div className="flex flex-col h-full w-full relative z-0">
                    <TopNav
                        activeSpaceName="Command Center"
                        currentUserEmployee={employees.find(e => e.id === user.employeeId)}
                        user={user}
                        onOpenProfile={() => setProfileModalOpen(true)}
                        onLogout={onLogout}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        currentView={currentView}
                        timelineViewMode={timelineViewMode}
                        onTimelineViewModeChange={setTimelineViewMode}
                        hideBrandOnDesktop={false}
                    />

                    <div className="flex-1 flex overflow-hidden">
                        <Sidebar
                            isOpen={isSidebarOpen}
                            onToggle={() => setSidebarOpen(!isSidebarOpen)}
                            activeSpaceId=""
                            activeListId={null}
                            spaces={spaces}
                            lists={[]}
                            currentView={currentView}
                            onSelectSpace={() => { }}
                            onViewChange={handleViewChange}
                            onOpenProfile={() => setProfileModalOpen(true)}
                            onLogout={onLogout}
                            onCreateSpace={() => setCreateSpaceModalOpen(true)}
                            onJoinSpace={() => setJoinSpaceModalOpen(true)}
                            onCreateList={() => { }}
                            onCreateTask={() => setAddTaskModalOpen(true)}
                            onSelectList={() => { }}
                            currentUserEmployee={employees.find(e => e.id === user.employeeId)}
                            user={user}
                            compactMode={compactMode}
                        />

                        <main className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-none">
                            <div className="max-w-[1800px] mx-auto animate-in fade-in duration-500">

                                {currentView === 'analytics' && (
                                    <AdminDashboard
                                        tasks={allTasks}
                                        employees={employees}
                                        activityLogs={activityLogs}
                                        isAdmin={true}
                                    />
                                )}

                                {currentView === 'overview' && (
                                    <AdminOverseerView
                                        spaces={spaces}
                                        tasks={allTasks}
                                        employees={employees}
                                        searchTerm={searchTerm}
                                        onViewTask={(t) => { setSelectedTask(t); setTaskDetailsModalOpen(true); }}
                                        onAddTask={(mid, sid) => { setTaskToEdit({ assigneeId: mid, spaceId: sid }); setAddTaskModalOpen(true); }}
                                        userName={user.fullName}
                                    />
                                )}

                                {currentView === 'team' && user.isAdmin && (
                                    <UserManagementView currentUserId={user.employeeId} spaces={spaces} />
                                )}

                                {currentView === 'timeline' && (
                                    <div className="h-[calc(100vh-200px)]">
                                        {timelineViewMode === 'calendar' ? (
                                            <CalendarView tasks={allTasks} onViewTask={(t) => { setSelectedTask(t); setTaskDetailsModalOpen(true); }} />
                                        ) : (
                                            <GanttChart tasks={allTasks} employees={employees} onViewTask={(t) => { setSelectedTask(t); setTaskDetailsModalOpen(true); }} />
                                        )}
                                    </div>
                                )}

                                {currentView === 'settings' && (
                                    <div className="p-8 text-center text-slate-500">
                                        <Cog6ToothIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <h2 className="text-xl font-bold">System Settings</h2>
                                        <p>Configure workspace defaults and permissions.</p>
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>
                </div>

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

                {isAddTaskModalOpen && (
                    <AddTaskModal
                        isOpen={isAddTaskModalOpen}
                        onClose={() => setAddTaskModalOpen(false)}
                        onSave={handleSaveTask}
                        taskToEdit={taskToEdit}
                        employees={employees}
                        activeSpaceId={allTasks[0]?.spaceId || ''}
                        spaces={spaces}
                        currentUserId={user.employeeId}
                        isAdmin={user.isAdmin}
                    />
                )}

                {isTaskDetailsModalOpen && selectedTask && (
                    <TaskDetailsModal
                        isOpen={isTaskDetailsModalOpen}
                        onClose={() => setTaskDetailsModalOpen(false)}
                        task={selectedTask}
                        employees={employees}
                        allTasks={allTasks}
                        onAddComment={handleAddComment}
                        onToggleTimer={handleToggleTimer}
                        currentUserId={user.employeeId}
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
            </div>
        </>
    );
};

export default LeadershipApp;
