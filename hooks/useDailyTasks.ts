import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import * as dataService from '../services/supabaseService';

export type DailyTaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type DailyTaskPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

export interface DailyTask {
    id: string;
    text: string;
    status: DailyTaskStatus;
    priority: DailyTaskPriority;
    schedule?: string;
    isUnplanned?: boolean;
    description?: string;
}

export const useDailyTasks = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<DailyTask[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial load from Supabase
    useEffect(() => {
        if (!user?.employeeId) return;

        const loadDailyTasks = async () => {
            try {
                setLoading(true);
                const cloudTasks = await dataService.getDailyTasks(user.employeeId);
                setTasks(cloudTasks);
            } catch (err) {
                console.error('Failed to load daily tasks from cloud', err);
                // Fallback to localStorage for offline or errors
                const saved = localStorage.getItem('todayTasks');
                if (saved) {
                    try {
                        setTasks(JSON.parse(saved));
                    } catch (e) { }
                }
            } finally {
                setLoading(false);
            }
        };

        loadDailyTasks();
    }, [user?.employeeId]);

    // Save to localStorage as a cache/backup
    useEffect(() => {
        if (tasks.length > 0) {
            localStorage.setItem('todayTasks', JSON.stringify(tasks));
        } else if (!loading) {
            localStorage.removeItem('todayTasks');
        }
    }, [tasks, loading]);

    const addTask = async (text: string, schedule?: string, isUnplanned: boolean = false, priority: DailyTaskPriority = 'Medium', description?: string) => {
        const taskText = text.trim();
        if (!taskText || !user?.employeeId) return;

        const effectivePriority: DailyTaskPriority = isUnplanned ? 'Urgent' : priority;

        const newTask: DailyTask = {
            id: 'temp-' + Date.now().toString(), // Temporary ID for optimistic UI
            text: taskText,
            status: 'TODO',
            priority: effectivePriority,
            schedule,
            isUnplanned,
            description
        };

        // Optimistic update
        setTasks(prev => isUnplanned || effectivePriority === 'Urgent' ? [newTask, ...prev] : [...prev, newTask]);

        try {
            const saved = await dataService.syncDailyTask(user.employeeId, newTask);
            // Replace temporary ID with real ID
            setTasks(prev => prev.map(t => t.id === newTask.id ? { ...t, id: saved.id } : t));
            return { ...newTask, id: saved.id };
        } catch (err) {
            console.error('Failed to sync new task', err);
            // In a real app we might want to revert or show error, but let's keep it in local state for now
            return newTask;
        }
    };

    const updateTaskStatus = async (taskId: string, newStatus: DailyTaskStatus) => {
        if (!user?.employeeId) return;

        // Optimistic update
        setTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, status: newStatus } : task
        ));

        try {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                await dataService.syncDailyTask(user.employeeId, { ...task, status: newStatus });
            }
        } catch (err) {
            console.error('Failed to sync task status', err);
        }
    };

    const updateTaskPriority = async (taskId: string, newPriority: DailyTaskPriority) => {
        if (!user?.employeeId) return;

        // Optimistic update
        setTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, priority: newPriority } : task
        ));

        try {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                await dataService.syncDailyTask(user.employeeId, { ...task, priority: newPriority });
            }
        } catch (err) {
            console.error('Failed to sync task priority', err);
        }
    };

    const deleteTask = async (taskId: string) => {
        if (!user?.employeeId) return;

        // Optimistic update
        setTasks(prev => prev.filter(task => task.id !== taskId));

        try {
            // Only delete if it's not a temporary ID
            if (!taskId.startsWith('temp-')) {
                await dataService.deleteDailyTask(taskId);
            }
        } catch (err) {
            console.error('Failed to delete task from cloud', err);
        }
    };

    const updateTaskSchedule = async (taskId: string, newSchedule: string | undefined) => {
        if (!user?.employeeId) return;

        // Optimistic update
        setTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, schedule: newSchedule } : task
        ));

        try {
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                await dataService.syncDailyTask(user.employeeId, { ...task, schedule: newSchedule });
            }
        } catch (err) {
            console.error('Failed to sync task schedule', err);
        }
    };

    const clearAllTasks = () => {
        setTasks([]);
        localStorage.removeItem('todayTasks');
        // Note: For now we don't bulk delete in cloud in this session
    };

    return {
        tasks,
        loading,
        addTask,
        updateTaskStatus,
        updateTaskPriority,
        updateTaskSchedule,
        deleteTask,
        clearAllTasks
    };
};
