import { Task, TaskStatus } from '../types';

/**
 * Checks if a task is overdue based on its due date and due time.
 * A task is overdue if:
 * 1. It has a due date.
 * 2. It is not DONE.
 * 3. The current time is past the due date + due time (or 23:59:59 if no time is specified).
 */
export const isTaskOverdue = (task: Task): boolean => {
    if (!task.dueDate) return false;
    if (task.status === TaskStatus.DONE) return false;

    const now = new Date();

    // The effective date for the deadline is the end date if it exists, otherwise the due date.
    const deadlineStr = task.endDate || task.dueDate;
    const [year, month, day] = deadlineStr.split('-').map(Number);
    
    // Create a date object for the very end of that day (23:59:59.999)
    const deadline = new Date(year, month - 1, day, 23, 59, 59, 999);

    return now.getTime() > deadline.getTime();
};

/**
 * Checks if a task is available to be seen/worked on.
 * Recurring tasks spawned for a future date are only available after 7 AM (07:00) on that date.
 */
export const isTaskAvailable = (task: Task): boolean => {
    // Only applies to recurring tasks
    if (!task.recurrence || task.recurrence === 'none') return true;
    
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    
    // Threshold is 7 AM of the due date
    const availabilityThreshold = new Date(dueDate);
    availabilityThreshold.setHours(7, 0, 0, 0);
    
    return now.getTime() >= availabilityThreshold.getTime();
};

/**
 * Specifically for recurring tasks: checks if they should be auto-completed.
 * 1. If due before today: Yes.
 * 2. If due today: Yes, but only after 7 PM (19:00).
 */
export const isRecurringTaskReadyForAutoComplete = (task: Task): boolean => {
    if (!task.recurrence || task.recurrence === 'none') return false;
    if (task.status === TaskStatus.DONE) return false;

    const now = new Date();
    
    // Robust local date parsing (avoids UTC pitfalls with new Date("YYYY-MM-DD"))
    const [year, month, day] = task.dueDate.split('-').map(Number);
    const dueDate = new Date(year, month - 1, day);
    dueDate.setHours(0, 0, 0, 0);

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // If due before today
    if (dueDate.getTime() < today.getTime()) {
        return true;
    }

    // If due today, check if it's past 7 PM (19:00)
    if (dueDate.getTime() === today.getTime()) {
        return now.getHours() >= 19;
    }

    return false;
};
