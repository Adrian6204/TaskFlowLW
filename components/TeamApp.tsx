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
import Background from './Background';
import ClickSpark from './ClickSpark';
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
            await dataService.upsertTask({ ...task, spaceId: activeSpaceId, id });
            loadSpaceTasks(activeSpaceId);
            setAddTaskModalOpen(false);
        } catch (e) { console.error(e); }
    };

    return (
        <>
            <ClickSpark sparkSize={10} sparkRadius={20} sparkCount={8} duration={400} />
            <div className="flex h-screen overflow-hidden bg-transparent text-white relative font-sans">
                <Background videoSrc="/background.gif" />

                <TopNav
                    activeSpaceName={currentSpace?.name || 'My Workspace'}
                    currentUserEmployee={employees.find(e => e.id === user.employeeId)}
                    user={user}
                    onOpenProfile={() => { }}
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
                                    onUpdateTask={() => { }}
                                    onAddTask={(t) => handleSaveTask(t, null)}
                                />
                            )}

                            {currentView === 'board' && (
                                <TaskBoard
                                    tasks={filteredTasks}
                                    employees={spaceMembers}
                                    onUpdateTaskStatus={handleUpdateTaskStatus}
                                    onUpdateTask={() => { }}
                                    onViewTask={() => { }}
                                />
                            )}

                            {currentView === 'whiteboard' && <Whiteboard />}

                            {currentView === 'timeline' && (
                                <div className="h-[calc(100vh-200px)]">
                                    {timelineViewMode === 'calendar' ? (
                                        <CalendarView tasks={filteredTasks} onViewTask={() => { }} />
                                    ) : (
                                        <GanttChart tasks={filteredTasks} employees={spaceMembers} onViewTask={() => { }} />
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

                {isAddTaskModalOpen && (
                    <AddTaskModal
                        isOpen={isAddTaskModalOpen}
                        onClose={() => setAddTaskModalOpen(false)}
                        onSave={handleSaveTask}
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
