import React, { useState } from 'react';
import { Employee, Task, TaskStatus, User, Space } from '../types';
import { useDailyTasks } from '../hooks/useDailyTasks';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon'; // Assuming this exists or use XMark
import { XMarkIcon } from './icons/XMarkIcon';
import { SearchIcon } from './icons/SearchIcon';
import * as dataService from '../services/supabaseService';

interface MembersViewProps {
  employees: Employee[];
  tasks: Task[];
  currentUser: User;
  currentSpace?: Space;
  onMemberUpdate?: () => void;
}

const MembersView: React.FC<MembersViewProps> = ({ employees, tasks, currentUser, currentSpace, onMemberUpdate }) => {

  const { tasks: dailyTasks } = useDailyTasks();
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const isAdmin = currentUser.isAdmin || currentUser.role === 'super_admin' || currentUser.position === 'Admin';
  // Check if current user is admin of THIS space specifically? 
  // For now simple admin check + Super Admin.
  // Ideally check space membership role too if available in employees list.
  console.log('MembersView currentUser:', currentUser);
  console.log('Is Admin:', isAdmin);

  const getTaskStats = (employeeId: string) => {
    const employeeTasks = tasks.filter(t => t.assigneeId === employeeId);
    return {
      total: employeeTasks.length,
      completed: employeeTasks.filter(t => t.status === TaskStatus.DONE).length,
      inProgress: employeeTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      todo: employeeTasks.filter(t => t.status === TaskStatus.TODO).length,
    };
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await dataService.searchUsers(query);
      // Filter out users who are already members
      const filtered = results.filter(u => !employees.some(e => e.id === u.id));
      setSearchResults(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!currentSpace) return;
    try {
      await dataService.addMemberToSpace(currentSpace.id, userId, 'member');
      if (onMemberUpdate) onMemberUpdate();
      setSearchQuery('');
      setSearchResults([]);
      setIsAddMemberModalOpen(false);
    } catch (error) {
      console.error(error);
      alert('Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentSpace) return;
    if (!window.confirm('Are you sure you want to remove this member from the workspace?')) return;
    try {
      await dataService.removeMemberFromSpace(currentSpace.id, userId);
      if (onMemberUpdate) onMemberUpdate();
    } catch (error) {
      console.error(error);
      alert('Failed to remove member');
    }
  };

  const handleDeleteAccount = async (userId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!currentUser.isAdmin && currentUser.role !== 'super_admin') return;
    if (!window.confirm('DANGER: Are you sure you want to PERMANENTLY DELETE this user account? This cannot be undone.')) return;

    // Double confirmation
    const confirmName = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmName !== 'DELETE') return;

    try {
      await dataService.deleteUserAccount(userId);
      if (onMemberUpdate) {
        console.log('Refreshing members list...');
        onMemberUpdate();
      }
    } catch (error) {
      console.error(error);
      alert('Failed to delete account');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-24 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Team Members</h2>
          <p className="text-slate-500 dark:text-white/40 mt-1 font-bold">
            {employees.length} members in this space
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsAddMemberModalOpen(true)}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Member
          </button>
        )}
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {employees.map((employee, index) => {
          const stats = getTaskStats(employee.id);
          const isMe = currentUser.employeeId === employee.id;

          return (
            <div
              key={employee.id}
              className="bg-white/60 dark:bg-black/40 backdrop-blur-[40px] rounded-[32px] border border-white/40 dark:border-white/5 p-8 hover:border-white/60 dark:hover:border-white/20 transition-all duration-300 stagger-children shadow-xl shadow-black/5 dark:shadow-none group relative"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {isAdmin && !isMe && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleRemoveMember(employee.id)}
                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                    title="Remove from Workspace"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                  {(currentUser.role === 'super_admin' || currentUser.isAdmin) && (
                    <button
                      onClick={(e) => handleDeleteAccount(employee.id, e)}
                      className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
                      title="Delete Account (Stictly Super Admin)"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

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
                    {employee.position || 'Member'}
                  </p>
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

      {/* Add Member Modal */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddMemberModalOpen(false)}>
          <div className="bg-white dark:bg-[#1E1E1E] rounded-[32px] w-full max-w-lg p-8 shadow-2xl animate-scale-in border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Add Member</h3>
              <button onClick={() => setIsAddMemberModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                <XMarkIcon className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <div className="relative mb-6">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, username or email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-100 dark:bg-black/20 rounded-2xl border-none focus:ring-2 focus:ring-lime-500 outline-none text-slate-900 dark:text-white font-medium"
                autoFocus
              />
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {isSearching && <p className="text-center text-slate-400 text-sm">Searching...</p>}
              {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                <p className="text-center text-slate-400 text-sm">No users found.</p>
              )}
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-white/40">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddMember(user.id)}
                    className="px-4 py-2 bg-lime-500 text-black text-xs font-bold uppercase rounded-xl hover:bg-lime-400 transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MembersView;
