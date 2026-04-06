import React from 'react';
import { Employee, Priority } from '../types';
import { PRIORITIES } from '../constants';

interface FilterBarProps {
  employees: Employee[];
  filters: { assignee: string; priority: string };
  setFilters: React.Dispatch<React.SetStateAction<{ assignee: string; priority: string }>>;
  showAssigneeFilter: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ employees, filters, setFilters, showAssigneeFilter }) => {
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-slate-100/60 dark:bg-black/40 dark:backdrop-blur-md rounded-xl border border-slate-200 dark:border-white/10">
      {showAssigneeFilter && (
        <div className="flex-1">
          <label htmlFor="assignee-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Filter by Assignee
          </label>
          <select
            id="assignee-filter"
            name="assignee"
            value={filters.assignee}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-white/5 dark:text-white"
          >
            <option value="all">All Assignees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="flex-1">
        <label htmlFor="priority-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Filter by Priority
        </label>
        <select
          id="priority-filter"
          name="priority"
          value={filters.priority}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        >
          <option value="all">All Priorities</option>
          {PRIORITIES.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FilterBar;