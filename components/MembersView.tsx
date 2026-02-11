import React, { useState } from 'react';
import { Employee, Task, TaskStatus } from '../types';
import { useDailyTasks } from '../hooks/useDailyTasks';

interface MembersViewProps {
  employees: Employee[];
  tasks: Task[];
  currentUser?: { employeeId: string; role: string };
}

const MembersView: React.FC<MembersViewProps> = ({ employees, tasks, currentUser }) => {

  const { tasks: dailyTasks } = useDailyTasks();

  const getTaskStats = (employeeId: string) => {
    const employeeTasks = tasks.filter(t => t.assigneeId === employeeId);
    return {
      total: employeeTasks.length,
      completed: employeeTasks.filter(t => t.status === TaskStatus.DONE).length,
      inProgress: employeeTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      todo: employeeTasks.filter(t => t.status === TaskStatus.TODO).length,
    };
  };

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Team Members</h2>
        <p className="text-slate-500 dark:text-white/40 mt-1 font-bold">
          {employees.length} members in this space
        </p>
      </div>



      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((employee, index) => {
          const stats = getTaskStats(employee.id);
          return (
            <div
              key={employee.id}
              className="bg-white/60 dark:bg-black/40 backdrop-blur-[40px] rounded-[32px] border border-white/40 dark:border-white/5 p-8 hover:border-white/60 dark:hover:border-white/20 transition-all duration-300 stagger-children shadow-xl shadow-black/5 dark:shadow-none"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src={employee.avatarUrl}
                    alt={employee.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-neutral-200/50 dark:border-neutral-700/50"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                    {employee.name}
                  </h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-white/40">
                    {stats.total} total tasks
                  </p>
                </div>
              </div>

              {/* Stats / Active Tasks List */}
              <div className="mt-6 flex-1 min-h-[120px] max-h-[180px] overflow-y-auto custom-scrollbar pr-1 -mr-1">
                <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-3 sticky top-0 bg-white/60 dark:bg-black/40 backdrop-blur-xl z-10 py-1">Current Focus</p>

                <div className="space-y-2">
                  {(() => {
                    const activeProjectTasks = tasks.filter(t => t.assigneeId === employee.id && t.status !== TaskStatus.DONE);

                    const isCurrentUser = currentUser?.employeeId === employee.id;
                    const activeDailyTasks = isCurrentUser ? dailyTasks.filter(t => t.status !== 'DONE') : [];

                    const allDisplayTasks = [
                      ...activeProjectTasks.map(t => ({ id: t.id, title: t.title, priority: t.priority, isDaily: false })),
                      ...activeDailyTasks.map(t => ({ id: t.id, title: t.text, priority: t.priority, isDaily: true }))
                    ];

                    if (allDisplayTasks.length === 0) {
                      return (
                        <div className="text-center py-4">
                          <p className="text-[10px] text-slate-400 dark:text-white/30 italic">No active tasks.</p>
                        </div>
                      );
                    }

                    return allDisplayTasks.map(task => (
                      <div key={task.id} className="p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 flex items-start gap-2 group hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                        <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.isDaily ? 'bg-lime-500 shadow-[0_0_4px_rgba(132,204,22,0.5)]' :
                          task.priority === 'Urgent' ? 'bg-red-500' :
                            task.priority === 'High' ? 'bg-orange-500' :
                              'bg-slate-400 dark:bg-white/40'
                          }`}></div>
                        <p className="text-xs font-bold text-slate-700 dark:text-white/80 line-clamp-2 leading-relaxed">
                          {task.title}
                        </p>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {employees.length === 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-500 dark:text-neutral-400">No members in this space yet</p>
        </div>
      )}
    </div>
  );
};

export default MembersView;
