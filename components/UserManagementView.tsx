import React, { useState, useEffect } from 'react';
import { EmployeeWithRole, Space, Employee } from '../types';
import * as dataService from '../services/supabaseService';
import BentoCard from './BentoCard';
import { KeyIcon } from './icons/KeyIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PlusIcon } from './icons/PlusIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import ConfirmationModal from './ConfirmationModal';

interface UserManagementViewProps {
    currentUserId: string;
    spaces?: Space[];
}

const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUserId, spaces = [] }) => {
    const [users, setUsers] = useState<EmployeeWithRole[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Enroll Modal State
    const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
    const [selectedUserToEnroll, setSelectedUserToEnroll] = useState<string>('');
    const [selectedSpaceToEnroll, setSelectedSpaceToEnroll] = useState<string>(spaces[0]?.id || '');

    // Confirmation State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'danger' | 'warning' | 'info';
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning',
        onConfirm: () => { }
    });

    useEffect(() => {
        loadUsers();
    }, []);

    // Update selected space default if spaces load later
    useEffect(() => {
        if (spaces.length > 0 && !selectedSpaceToEnroll) {
            setSelectedSpaceToEnroll(spaces[0].id);
        }
    }, [spaces]);

    const loadUsers = async () => {
        try {
            const data = await dataService.getAllUsersWithRoles();
            setUsers(data as EmployeeWithRole[]);
        } catch (error) {
            console.error("Failed to load users", error);
        }
    };

    const handleToggleAdmin = (user: EmployeeWithRole) => {
        if (!user.spaceId) return; // Can't start admin if not in a space

        const action = user.role === 'admin' ? 'Revoke' : 'Grant';
        const newRole = user.role === 'admin' ? 'member' : 'admin';

        setConfirmModal({
            isOpen: true,
            title: `${action} Workspace Admin?`,
            message: `Are you sure you want to ${action.toLowerCase()} Workspace Admin rights for ${user.name}? They will ${action === 'Grant' ? 'gain' : 'lose'} the ability to manage tasks and members within their workspace.`,
            type: user.role === 'admin' ? 'warning' : 'info',
            onConfirm: async () => {
                try {
                    // Optimistic update
                    setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));

                    await dataService.updateWorkspaceRole(user.id, user.spaceId, newRole);
                    // Optional: Toast success
                } catch (error) {
                    console.error("Failed to update role", error);
                    alert("Failed to update role. Please try again.");
                    loadUsers(); // Revert on error
                } finally {
                    setConfirmModal({ ...confirmModal, isOpen: false });
                }
            }
        });
    };

    const handleToggleSuperAdmin = (user: EmployeeWithRole) => {
        const newStatus = !user.isSuperAdmin;
        const action = newStatus ? 'Grant' : 'Revoke';

        // Prevent revoking own super admin status
        if (user.id === currentUserId && !newStatus) {
            alert("You cannot revoke your own Super Admin status.");
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: `${action} Super Admin Access?`,
            message: newStatus
                ? `Are you sure you want to GRANT ${user.name} Super Admin access? They will have full control over the entire system, including managing other admins.`
                : `Are you sure you want to REVOKE Super Admin access from ${user.name}? They will lose access to the global Command Center immediately.`,
            type: newStatus ? 'danger' : 'warning', // Danger for granting so they pay attention
            onConfirm: async () => {
                try {
                    // Optimistic update
                    setUsers(users.map(u => u.id === user.id ? { ...u, isSuperAdmin: newStatus } : u));

                    await dataService.updateSuperAdminStatus(user.id, newStatus);
                    // Optional: Toast success
                } catch (error) {
                    console.error("Failed to update super admin status", error);
                    alert("Failed to update Super Admin status. Please try again.");
                    loadUsers(); // Revert on error
                } finally {
                    setConfirmModal({ ...confirmModal, isOpen: false });
                }
            }
        });
    };

    const handleDeleteAccount = async (user: EmployeeWithRole) => {
        if (user.id === currentUserId) {
            alert("You cannot delete your own account.");
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: `PERMANENTLY DELETE ACCOUNT?`,
            message: `DANGER: This will permanently delete ${user.name}'s account and remove them from all workspaces. This action CANNOT be undone.`,
            type: 'danger',
            onConfirm: async () => {
                const confirmName = prompt(`Type "DELETE" to confirm deletion of ${user.name}:`);
                if (confirmName !== 'DELETE') return;

                try {
                    await dataService.deleteUserAccount(user.id);
                    setUsers(users.filter(u => u.id !== user.id)); // Optimistic remove
                } catch (error) {
                    console.error("Failed to delete account", error);
                    setConfirmModal({
                        isOpen: true,
                        title: "Error",
                        message: "Failed to delete account. Please try again.",
                        type: "warning",
                        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                    });
                    loadUsers();
                } finally {
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const handleRemoveFromWorkspace = async (user: EmployeeWithRole) => {
        if (!user.spaceId) return;

        setConfirmModal({
            isOpen: true,
            title: `Remove from Workspace?`,
            message: `Are you sure you want to remove ${user.name} from "${user.spaceName}"? They will become unassigned.`,
            type: 'warning',
            onConfirm: async () => {
                try {
                    await dataService.removeMemberFromSpace(user.spaceId, user.id);
                    loadUsers(); // Reload to reflect Unassigned
                } catch (error) {
                    console.error(error);
                    setConfirmModal({
                        isOpen: true,
                        title: "Error",
                        message: "Failed to remove user from workspace.",
                        type: "warning",
                        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                    });
                } finally {
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                }
            }
        })
    }

    const handleEnrollUser = async () => {
        if (!selectedUserToEnroll || !selectedSpaceToEnroll) return;

        try {
            await dataService.addMemberToSpace(selectedSpaceToEnroll, selectedUserToEnroll, 'member');
            setIsEnrollModalOpen(false);
            loadUsers(); // Reload
            setSelectedUserToEnroll('');
        } catch (error) {
            console.error(error);
            setConfirmModal({
                isOpen: true,
                title: "Error",
                message: "Failed to enroll user. They might already be a member of this workspace.",
                type: "warning",
                onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))
            });
        }
    };

    // Filter users
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.spaceName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-white/60 dark:bg-black/40 backdrop-blur-[40px] border border-white/40 dark:border-white/5 rounded-[32px] p-8 shadow-xl shadow-black/5 dark:shadow-none mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Team Management</h1>
                        <p className="text-slate-500 dark:text-white/40 font-bold text-sm uppercase tracking-wide">
                            Manage access and roles across the organization
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Find user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500/50 min-w-[200px]"
                        />
                        <button
                            onClick={() => setIsEnrollModalOpen(true)}
                            className="px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Enroll Member
                        </button>
                    </div>
                </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredUsers.map(user => (
                    <BentoCard key={user.id} className="p-6 group relative overflow-hidden">

                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-xl object-cover bg-slate-100 dark:bg-slate-800" />
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{user.name}</h3>
                                    <div className="flex flex-col gap-0.5">
                                        <p className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-wider">{user.position || 'No Position'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {user.isSuperAdmin && (
                                    <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/20">
                                        Super Admin
                                    </span>
                                )}
                                {user.role === 'admin' && (
                                    <span className="px-2 py-1 rounded bg-lime-500/10 text-lime-600 dark:text-[#CEFD4A] text-[10px] font-black uppercase tracking-widest border border-lime-500/20">
                                        Workspace Admin
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between text-sm py-2 border-b border-black/5 dark:border-white/5">
                                <span className="text-slate-500 dark:text-white/40 font-medium">Workspace</span>
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold ${user.spaceName === 'Unassigned' ? 'text-slate-400 italic' : 'text-slate-700 dark:text-white/80'}`}>
                                        {user.spaceName}
                                    </span>
                                    {user.spaceId && (
                                        <button
                                            onClick={() => handleRemoveFromWorkspace(user)}
                                            className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors"
                                            title="Remove from Workspace"
                                        >
                                            <XMarkIcon className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm py-2 border-b border-black/5 dark:border-white/5">
                                <span className="text-slate-500 dark:text-white/40 font-medium">Email</span>
                                <span className="font-bold text-slate-700 dark:text-white/80 text-xs truncate max-w-[150px]" title={user.email}>{user.email}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => handleToggleSuperAdmin(user)}
                                disabled={user.id === currentUserId} // Can't toggle self
                                className={`w-full py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all
                                    ${user.isSuperAdmin
                                        ? 'bg-purple-500/10 text-purple-600 hover:bg-purple-500 hover:text-white'
                                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-purple-500 hover:text-white'
                                    } ${user.id === currentUserId ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                <UsersIcon className="w-4 h-4" />
                                {user.isSuperAdmin ? 'Revoke Super Admin' : 'Make Super Admin'}
                            </button>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleToggleAdmin(user)}
                                    disabled={!user.spaceId}
                                    className={`flex-1 py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all
                                        ${user.role === 'admin'
                                            ? 'bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white'
                                            : 'bg-lime-500/10 text-lime-600 dark:text-[#CEFD4A] hover:bg-lime-500 hover:text-black'
                                        } ${(!user.spaceId) ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    <KeyIcon className="w-4 h-4" />
                                    {user.role === 'admin' ? 'Revoke Admin' : 'Make Workspace Admin'}
                                </button>

                                <button
                                    onClick={() => handleDeleteAccount(user)}
                                    disabled={user.id === currentUserId}
                                    className={`p-2 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all ${user.id === currentUserId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title="Delete Account"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                    </BentoCard>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-slate-400 dark:text-white/30 font-bold text-lg">No users found.</p>
                </div>
            )}

            {/* Enroll Modal */}
            {isEnrollModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setIsEnrollModalOpen(false)}>
                    <div className="bg-white dark:bg-[#1E1E1E] rounded-[32px] w-full max-w-lg p-8 shadow-2xl animate-scale-in border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Enroll Member to Workspace</h3>
                            <button onClick={() => setIsEnrollModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                                <XMarkIcon className="w-6 h-6 text-slate-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest mb-2">Select User</label>
                                <select
                                    value={selectedUserToEnroll}
                                    onChange={(e) => setSelectedUserToEnroll(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-black/20 border-none rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-lime-500 outline-none appearance-none"
                                >
                                    <option value="">-- Choose User --</option>
                                    {users.filter(u => u.id !== currentUserId).map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.spaceName})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest mb-2">Select Target Workspace</label>
                                <select
                                    value={selectedSpaceToEnroll}
                                    onChange={(e) => setSelectedSpaceToEnroll(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-black/20 border-none rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-lime-500 outline-none appearance-none"
                                >
                                    {spaces.length === 0 && <option value="">No workspaces available</option>}
                                    {spaces.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleEnrollUser}
                                disabled={!selectedUserToEnroll || !selectedSpaceToEnroll}
                                className="w-full py-3 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                Enroll User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
            />
        </div>
    );
};

export default UserManagementView;
