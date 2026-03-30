import React, { useState } from 'react';
import { Employee, Task, TaskStatus, User, Space } from '../types';
import { useDailyTasks } from '../hooks/useDailyTasks';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon'; // Assuming this exists or use XMark
import { XMarkIcon } from './icons/XMarkIcon';
import { SearchIcon } from './icons/SearchIcon';
import * as dataService from '../services/supabaseService';
import { usePresenceContext, statusColor } from '../context/PresenceContext';

interface MembersViewProps {
  employees: Employee[];
  tasks: Task[];
  currentUser: User;
  currentSpace?: Space;
  onMemberUpdate?: () => void;
}

const MembersView: React.FC<MembersViewProps> = ({ employees, tasks, currentUser, currentSpace, onMemberUpdate }) => {

  const { tasks: dailyTasks } = useDailyTasks();
  const { getStatus } = usePresenceContext();
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const isAdmin = currentUser.isAdmin || currentUser.role === 'super_admin' || currentUser.position === 'Admin';
  // Check if current user is admin of THIS space specifically? 
  // For now simple admin check + Super Admin.
  // Ideally check space membership role too if available in employees list.

  const getTaskStats = (employeeId: string) => {
    const employeeTasks = tasks.filter(t => t.assigneeIds?.includes(employeeId) || t.assigneeId === employeeId);
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
      const filtered = results.filter((u: Employee) => !employees.some(e => e.id === u.id));
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

  const handleConfirmRemove = async (userId: string) => {
    if (!currentSpace) return;
    try {
      await dataService.removeMemberFromSpace(currentSpace.id, userId);
      if (onMemberUpdate) onMemberUpdate();
      setMemberToRemove(null);
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
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Team Members</h2>
          <p className="text-zinc-500 dark:text-white/40 mt-1 font-bold">
            {employees.length} members in this space
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsAddMemberModalOpen(true)}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Add Member
          </button>
        )}
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {employees.map((employee, index) => {
          const isMe = currentUser.employeeId === employee.id;
          const positions = employee.position
            ? (employee.position as string).split(',').map(p => p.trim()).filter(Boolean)
            : ['Member'];

          return (
            <div
              key={employee.id}
              className="bg-white/60 dark:bg-black/40 backdrop-blur-[40px] rounded-[28px] border border-white/40 dark:border-white/5 hover:border-white/60 dark:hover:border-white/20 transition-all duration-300 shadow-xl shadow-black/5 dark:shadow-none group relative p-5"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Remove button */}
              {isAdmin && !isMe && (
                <button
                  onClick={() => setMemberToRemove(employee.id)}
                  className="absolute top-4 right-4 p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove from Workspace"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <img
                    src={employee.avatarUrl}
                    alt={employee.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-zinc-700 shadow-sm"
                  />
                  <div
                    title={getStatus(employee.id)}
                    className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white dark:border-zinc-900 rounded-full transition-colors duration-500 ${statusColor(getStatus(employee.id))} ${getStatus(employee.id) === 'online' ? 'animate-pulse' : ''}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white leading-tight">
                    {employee.name}
                    {isMe && <span className="ml-1.5 text-[9px] font-bold text-primary-500 uppercase tracking-widest">You</span>}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {positions.slice(0, 2).map(pos => (
                      <span key={pos} className="text-[10px] font-bold text-zinc-400 dark:text-white/40 bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md">
                        {pos}
                      </span>
                    ))}
                    {positions.length > 2 && (
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-white/40">+{positions.length - 2}</span>
                    )}
                  </div>
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

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setMemberToRemove(null)}>
          <div className="bg-white dark:bg-[#1E1E1E] rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-scale-in border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <XMarkIcon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Remove Member</h3>
              <p className="text-zinc-500 dark:text-white/60 mb-8">
                Are you sure you want to remove this member from the workspace?
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMemberToRemove(null)}
                  className="flex-1 py-4 bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmRemove(memberToRemove)}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/25"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddMemberModalOpen(false)}>
          <div className="bg-white dark:bg-[#1E1E1E] rounded-[32px] w-full max-w-lg p-8 shadow-2xl animate-scale-in border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white">Add Member</h3>
              <button onClick={() => setIsAddMemberModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                <XMarkIcon className="w-6 h-6 text-zinc-500" />
              </button>
            </div>

            <div className="relative mb-6">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by name, username or email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-black/20 rounded-2xl border-none focus:ring-2 focus:ring-lime-500 outline-none text-zinc-900 dark:text-white font-medium"
                autoFocus
              />
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {isSearching && <p className="text-center text-zinc-400 text-sm">Searching...</p>}
              {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                <p className="text-center text-zinc-400 text-sm">No users found.</p>
              )}
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-white/40">{user.email}</p>
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
