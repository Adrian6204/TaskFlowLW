import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Employee, Task, Space, ActivityLog } from '../types';
import * as dataService from '../services/supabaseService';
import AdminDashboard from './AdminDashboard';
import AdminOverseerView from './AdminOverseerView';
import CalendarView from './CalendarView';
import GanttChart from './GanttChart';
import BottomDock from './BottomDock';
import TopNav from './TopNav';
import TaskDetailsModal from './TaskDetailsModal';
import AddTaskModal from './AddTaskModal';
import ProfileModal from './ProfileModal';
import Background from './Background';
import ClickSpark from './ClickSpark';
import UserManagementView from './UserManagementView';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';

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

    // View State
    const [timelineViewMode, setTimelineViewMode] = useState<'calendar' | 'gantt'>('calendar');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [isTaskDetailsModalOpen, setTaskDetailsModalOpen] = useState(false);
    const [isAddTaskModalOpen, setAddTaskModalOpen] = useState(false);
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
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
                dataService.getAllEmployees(),
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
        <ClickSpark sparkSize={10} sparkRadius={20} sparkCount={8} duration={400} className="h-screen w-full">
            <div className="flex h-full overflow-hidden bg-transparent text-white relative font-sans">
                <Background videoSrc="/background.gif" />

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
                />

                <div className="flex-1 flex flex-col min-w-0 relative z-0 pt-24 pb-32 overflow-hidden">
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
                                <UserManagementView currentUserId={user.employeeId} />
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

                <BottomDock
                    currentView={currentView}
                    onViewChange={handleViewChange}
                    activeSpaceId="" // Admin view doesn't focus one space
                    isAdmin={true}
                    isSuperAdmin={user.isAdmin}
                />

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
                        activeSpaceId={allTasks[0]?.spaceId || ''} // Fallback
                        spaces={spaces} // Pass all spaces for admin to choose
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
            </div>
        </ClickSpark>
    );
};

export default LeadershipApp;
