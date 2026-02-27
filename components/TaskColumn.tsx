
import React, { useState } from 'react';
import { Task, Employee, TaskStatus } from '../types';
import TaskCard from './TaskCard';
import { PlusIcon } from './icons/PlusIcon';

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  allTasks: Task[];
  employees: Employee[];
  onEditTask: (task: Task) => void;
  onDeleteTask?: (taskId: number) => void;
  onUpdateTaskStatus: (taskId: number, newStatus: TaskStatus) => void;
  onViewTask: (task: Task) => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

const statusConfig = {
  [TaskStatus.TODO]: { glow: 'bg-orange-500 shadow-orange-500/50', text: 'text-white', label: 'In Queue' },
  [TaskStatus.IN_PROGRESS]: { glow: 'bg-primary-500 shadow-primary-500/50', text: 'text-white', label: 'Active Tasks' },
  [TaskStatus.DONE]: { glow: 'bg-emerald-500 shadow-emerald-500/50', text: 'text-white', label: 'Completed' },
};

const TaskColumn: React.FC<TaskColumnProps> = ({ status, tasks, allTasks, employees, onEditTask, onDeleteTask, onUpdateTaskStatus, onViewTask, currentUserId, isAdmin }) => {
  const config = statusConfig[status];
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    try {
      const droppedTask: Task = JSON.parse(e.dataTransfer.getData('application/json'));
      if (droppedTask && droppedTask.status !== status) {
        onUpdateTaskStatus(droppedTask.id, status);
      }
    } catch (error) {
      console.error("Failed to parse dropped task data", error);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragStart={(e) => {
        e.dataTransfer.setData('sourceColumn', status);
      }}
      className={`flex flex-col h-full rounded-[32px] transition-all duration-500 border border-black/5 dark:border-white/5 bg-white/60 dark:bg-black/20 backdrop-blur-2xl p-4 ${isOver ? 'ring-4 ring-lime-500/20 dark:ring-[#CEFD4A]/20 scale-[1.01] bg-white/80 dark:bg-black/40' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-6 mb-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${config.glow} shadow-[0_0_10px]`}></span>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white/80">{status}</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest pl-5">{config.label}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-black font-mono text-slate-900/10 dark:text-white/10 group-hover:text-slate-900/30 dark:group-hover:text-white/30 transition-colors">
            {tasks.length < 10 ? `0${tasks.length}` : tasks.length}
          </span>
        </div>
      </div>

      {/* Cards Area */}
      <div className="flex-1 space-y-4 min-h-[400px] px-1 scrollbar-none overflow-y-auto">
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            allTasks={allTasks}
            employee={employees.find(e => e.id === task.assigneeId)}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onUpdateTaskStatus={onUpdateTaskStatus}
            onViewTask={onViewTask}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />
        ))}
        {tasks.length === 0 && (
          <div className="h-40 border-2 border-dashed border-black/5 dark:border-white/5 rounded-3xl flex flex-col items-center justify-center text-slate-400 dark:text-white/10 group hover:border-black/10 dark:hover:border-white/10 transition-all duration-500">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-slate-600 dark:group-hover:text-white/20 transition-colors">Awaiting Tasks</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskColumn;
