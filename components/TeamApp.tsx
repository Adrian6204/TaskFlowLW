import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Employee, Task, Space, ActivityLog, TaskStatus } from '../types';
import * as dataService from '../services/supabaseService';
import HomeView from './HomeView';
import TaskBoard from './TaskBoard';
import Whiteboard from './Whiteboard';
import CalendarView from './CalendarView';
import GanttChart from './GanttChart';
import BottomDock from './BottomDock';
import TopNav from './TopNav';
import TaskDetailsModal from './TaskDetailsModal';
import AddTaskModal from './AddTaskModal';
import ProfileModal from './ProfileModal';
import Background from './Background';
import { useDailyTasks } from '../hooks/useDailyTasks';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';

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
    const [activeSpaceId, setActiveSpaceId] = useState<string>('');

    // View State
    const [searchTerm, setSearchTerm] = useState('');
    const [timelineViewMode, setTimelineViewMode] = useState<'calendar' | 'gantt'>('calendar');

    // Modals
    const [isAddTaskModalOpen, setAddTaskModalOpen] = useState(false);
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [isTaskDetailsModalOpen, setTaskDetailsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [taskToEdit, setTaskToEdit] = useState<Task | Partial<Task> | null>(null);

    // Custom Hooks
    const { tasks: dailyTasks } = useDailyTasks(); // simplified usage

    // Derive Current View
    const currentView = useMemo(() => {
        const path = location.pathname;
        if (path.includes('/home')) return 'home';
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

    const loadData = async () => {
        try {
            const emps = await dataService.getAllEmployees();
            const spcs = await dataService.getSpaces(user.employeeId);
            setEmployees(emps);
            setSpaces(spcs);

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

    const currentSpace = spaces.find(s => s.id === activeSpaceId);

    // Filtering
    const filteredTasks = useMemo(() => {
        let t = tasks;
        if (searchTerm) {
            t = t.filter(task => task.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return t;
    }, [tasks, searchTerm]);

    const spaceMembers = useMemo(() => {
        if (!currentSpace) return [];
        return employees.filter(e => currentSpace.members.includes(e.id));
    }, [currentSpace, employees]);

    const handleUpdateTaskStatus = async (id: number, status: TaskStatus) => {
        // Implement update logic
        try {
            const task = tasks.find(t => t.id === id);
            if (task) {
                await dataService.upsertTask({ ...task, status, spaceId: task.spaceId });
                loadSpaceTasks(activeSpaceId);
            }
        } catch (e) { console.error(e); }
    };

    const handleSaveTask = async (task: any, id: number | null) => {
        try {
            await dataService.upsertTask({ ...task, spaceId: activeSpaceId || '', id });
            loadSpaceTasks(activeSpaceId);
            setAddTaskModalOpen(false);
        } catch (e) { console.error(e); }
    };

    const handleUpdateTask = async (taskId: number, updates: Partial<Task>) => {
        try {
            const existingTask = tasks.find(t => t.id === taskId);
            if (!existingTask) return;

            // Merge existing task with updates to ensure all required fields (like title, spaceId) are present
            // and we don't overwrite with empty strings via upsertTask defaults.
            const mergedTask = { ...existingTask, ...updates };

            // upsertTask expects spaceId and title explicitly in the intersection type, even if they are in mergedTask
            await dataService.upsertTask({
                ...mergedTask,
                spaceId: mergedTask.spaceId || activeSpaceId || '',
                title: mergedTask.title || ''
            });

            loadSpaceTasks(activeSpaceId);
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

    return (
        <>
            <div className="flex h-screen overflow-hidden bg-transparent text-white relative font-sans">
                <Background videoSrc="/background.gif" />

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
                />

                <div className="flex-1 flex flex-col min-w-0 relative z-0 pt-24 pb-32 overflow-hidden">
                    <main className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-none">
                        <div className="max-w-[1800px] mx-auto animate-in fade-in duration-500">

                            {currentView === 'home' && (
                                <HomeView
                                    tasks={filteredTasks}
                                    employees={spaceMembers}
                                    currentSpace={currentSpace!}
                                    user={user}
                                    searchTerm={searchTerm}
                                    onSearchChange={setSearchTerm}
                                    onUpdateTaskStatus={handleUpdateTaskStatus}
                                    onUpdateTask={handleUpdateTask}
                                    onAddTask={(t) => handleSaveTask(t, null)}
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
                                        setAddTaskModalOpen(true);
                                    }}
                                    onViewTask={(t) => { setSelectedTask(t); setTaskDetailsModalOpen(true); }}
                                    onToggleTimer={handleToggleTimer}
                                />
                            )}

                            {currentView === 'whiteboard' && <Whiteboard />}

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

                <BottomDock
                    currentView={currentView}
                    onViewChange={(v) => navigate(`/app/${v}`)}
                    activeSpaceId={activeSpaceId}
                    isAdmin={false}
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

                {isAddTaskModalOpen && (
                    <AddTaskModal
                        isOpen={isAddTaskModalOpen}
                        onClose={() => setAddTaskModalOpen(false)}
                        onSave={handleSaveTask}
                        taskToEdit={taskToEdit}
                        allTasks={tasks}
                        employees={spaceMembers}
                        activeSpaceId={activeSpaceId}
                        spaces={spaces}
                    />
                )}
            </div>
        </>
    );
};

export default TeamApp;
