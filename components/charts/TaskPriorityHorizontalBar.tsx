import React from 'react';
import { Task, Priority, TaskStatus } from '../../types';

interface Props {
    tasks: Task[];
}

const priorityConfig = [
    { key: Priority.URGENT, label: 'Urgent', bar: 'bg-red-500', text: 'text-red-500' },
    { key: Priority.HIGH, label: 'High', bar: 'bg-orange-500', text: 'text-orange-500' },
    { key: Priority.MEDIUM, label: 'Medium', bar: 'bg-yellow-500', text: 'text-yellow-500' },
    { key: Priority.LOW, label: 'Low', bar: 'bg-zinc-400', text: 'text-zinc-400' },
];

export default function TaskPriorityHorizontalBar({ tasks }: Props) {
    const activeTasks = tasks.filter((t) => t.status !== TaskStatus.DONE);

    const counts = priorityConfig.reduce((acc, curr) => {
        acc[curr.key] = activeTasks.filter((t) => t.priority === curr.key).length;
        return acc;
    }, {} as Record<Priority, number>);

    // Use absolute max among priorities so the longest bar represents the priority with the most tasks
    const maxCount = Math.max(...Object.values(counts), 1);

    return (
        <div className="flex flex-col justify-center h-full gap-5 px-2">
            {priorityConfig.map((cfg) => {
                const count = counts[cfg.key];
                const percentage = (count / maxCount) * 100;

                return (
                    <div key={cfg.key} className="flex items-center gap-4">
                        <div className="w-16 shrink-0 text-right">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{cfg.label}</span>
                        </div>
                        <div className="flex-1 h-2 bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden flex items-center">
                            <div
                                className={`h-full rounded-full ${cfg.bar} transition-all duration-1000 ease-out`}
                                style={{ width: `${Math.max(percentage, 2)}%` }} // min width so it's always visible
                            />
                        </div>
                        <div className="w-8 shrink-0 text-left">
                            <span className={`text-lg font-black ${cfg.text}`}>{count}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
