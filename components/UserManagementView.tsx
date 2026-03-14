import React, { useState, useEffect, useRef } from 'react';
import { EmployeeWithRole, Space, Employee, Position } from '../types';
import * as dataService from '../services/supabaseService';
import BentoCard from './BentoCard';
import { KeyIcon } from './icons/KeyIcon';
import { TrashIcon } from './icons/TrashIcon';
import { UsersIcon } from './icons/UsersIcon';
import { PlusIcon } from './icons/PlusIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
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
    const [selectedRoleToEnroll, setSelectedRoleToEnroll] = useState<'member' | 'admin'>('member');

    // Inline Editing State
    const [editingPositionUserId, setEditingPositionUserId] = useState<string | null>(null);
    const [editingPositionValue, setEditingPositionValue] = useState<string[]>([]);
    const [positionDropdownOpen, setPositionDropdownOpen] = useState(false);
    const positionDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (positionDropdownRef.current && !positionDropdownRef.current.contains(event.target as Node)) {
                setPositionDropdownOpen(false);
                if (editingPositionUserId) {
                    const user = users.find(u => u.id === editingPositionUserId);
                    if (user) {
                        const newValue = editingPositionValue.join(', ');
                        if (newValue !== user.position) {
                            handlePositionSave(user, newValue);
                        } else {
                            setEditingPositionUserId(null);
                        }
                    }
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [editingPositionUserId, editingPositionValue, users]);

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
        if (!user.spaceId) {
            // If they aren't in a workspace, open the enroll modal to put them in one as an admin
            setSelectedUserToEnroll(user.id);
            setSelectedRoleToEnroll('admin');
            setIsEnrollModalOpen(true);
            return;
        }

        const action = user.role === 'admin' ? 'Revoke' : 'Grant';
        const newRole = user.role === 'admin' ? 'member' : 'admin';

        setConfirmModal({
            isOpen: true,
            title: `${action} Workspace Admin?`,
            message: `Are you sure you want to ${action.toLowerCase()} Workspace Admin rights for ${user.name}? They will ${action === 'Grant' ? 'gain' : 'lose'} the ability to manage tasks and members inside the "${user.spaceName}" workspace.`,
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
            title: `${action} System Admin Access?`,
            message: newStatus
                ? `Are you sure you want to GRANT ${user.name} System Admin access? They will have FULL control over every workspace and setting in the entire system.`
                : `Are you sure you want to REVOKE System Admin access from ${user.name}? They will lose all administrative control immediately.`,
            type: newStatus ? 'danger' : 'warning', // Danger for granting so they pay attention
            onConfirm: async () => {
                try {
                    // Optimistic update
                    setUsers(users.map(u => u.id === user.id ? { ...u, isSuperAdmin: newStatus } : u));

                    await dataService.updateSuperAdminStatus(user.id, newStatus);
                    // Optional: Toast success
                } catch (error) {
                    console.error("Failed to update system admin status", error);
                    alert("Failed to update System Admin status. Please try again.");
                    loadUsers(); // Revert on error
                } finally {
                    setConfirmModal({ ...confirmModal, isOpen: false });
                }
            }
        });
    };

    const handlePositionSave = async (user: EmployeeWithRole, finalValue: string) => {
        if (!finalValue.trim()) {
            setEditingPositionUserId(null);
            return;
        }

        try {
            // Optimistic update
            setUsers(users.map(u => u.id === user.id ? { ...u, position: finalValue } : u));
            setEditingPositionUserId(null);

            await dataService.updateProfile(user.id, { position: finalValue });
        } catch (error) {
            console.error("Failed to update position", error);
            alert("Failed to update position. Please try again.");
            loadUsers(); // Revert on error
        }
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

    const handleResetPassword = async (user: EmployeeWithRole) => {
        setConfirmModal({
            isOpen: true,
            title: `RESET PASSWORD?`,
            message: `Are you sure you want to reset ${user.name}'s password to the default password? They will be forced to change it on their next login.`,
            type: 'warning',
            onConfirm: async () => {
                try {
                    await dataService.resetUserPassword(user.id);
                    setConfirmModal({
                        isOpen: true,
                        title: "Success",
                        message: `Password for ${user.name} has been reset to the default.`,
                        type: "info",
                        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                    });
                } catch (error: any) {
                    console.error("Failed to reset password", error);
                    setConfirmModal({
                        isOpen: true,
                        title: "Error",
                        message: error.message || "Failed to reset password. Please try again.",
                        type: "warning",
                        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                    });
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
            await dataService.addMemberToSpace(selectedSpaceToEnroll, selectedUserToEnroll, selectedRoleToEnroll);
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

    // Filter users with extra safety
    const filteredUsers = users.filter(u => {
        const name = (u.name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const space = (u.spaceName || '').toLowerCase();
        const search = (searchTerm || '').toLowerCase();

        return name.includes(search) ||
            email.includes(search) ||
            space.includes(search);
    });

    return (
        <div className="min-h-full space-y-6 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-white/60 dark:bg-black/40 backdrop-blur-[40px] border border-white/40 dark:border-white/5 rounded-[32px] p-8 shadow-xl shadow-black/5 dark:shadow-none mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Team Management</h1>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 shadow-sm animate-in fade-in zoom-in duration-500">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
                                    {users.length} Total Users
                                </span>
                            </div>
                        </div>
                        <p className="text-slate-500 dark:text-white/40 font-bold text-sm uppercase tracking-wide">
                            Manage access and roles across the organization
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Find user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500/50 flex-1 md:min-w-[300px]"
                        />
                        <button
                            onClick={() => {
                                setSelectedUserToEnroll('');
                                setSelectedRoleToEnroll('member');
                                setIsEnrollModalOpen(true);
                            }}
                            className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-black/5"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Enroll Member
                        </button>
                    </div>
                </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredUsers.map(user => (
                    <BentoCard
                        key={user.id}
                        className={`p-8 group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-none ${user.mustChangePassword ? 'ring-1 ring-rose-500/30 bg-rose-500/[0.02] shadow-[0_0_20px_-5px_rgba(244,63,94,0.1)]' : ''}`}
                    >
                        {/* Maintenance Actions — Subtle top-right row */}
                        <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                            <button
                                onClick={() => handleResetPassword(user)}
                                className="p-2 rounded-lg bg-white dark:bg-white/10 text-slate-400 dark:text-white/40 hover:text-amber-500 hover:bg-amber-500/10 transition-all border border-slate-200/50 dark:border-white/5"
                                title="Reset Password"
                            >
                                <KeyIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => handleDeleteAccount(user)}
                                disabled={user.id === currentUserId}
                                className={`p-2 rounded-lg bg-white dark:bg-white/10 text-slate-400 dark:text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all border border-slate-200/50 dark:border-white/5 ${user.id === currentUserId ? 'opacity-0 pointer-events-none' : ''}`}
                                title="Delete Account"
                            >
                                <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    <img src={user.avatarUrl} alt={user.name} className="w-14 h-14 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 z-10 relative shadow-md" />
                                    {user.mustChangePassword && (
                                        <div className="absolute inset-0 rounded-2xl bg-rose-500 animate-pulse opacity-20 scale-110"></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-xl leading-tight mb-2 whitespace-normal text-left" title={user.name}>{user.name}</h3>
                                    {editingPositionUserId === user.id ? (
                                        <div className="relative" ref={positionDropdownRef}>
                                            <div
                                                onClick={() => setPositionDropdownOpen(!positionDropdownOpen)}
                                                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 flex items-center justify-between cursor-pointer min-w-[140px]"
                                            >
                                                <span className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest truncate">
                                                    {editingPositionValue.length ? editingPositionValue.join(', ') : "Select Position"}
                                                </span>
                                                <svg className={`w-3 h-3 text-rose-500 transition-transform ${positionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>

                                            {positionDropdownOpen && (
                                                <div className="absolute z-[100] w-64 mt-2 bg-white dark:bg-[#1E1E20] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto left-0 animate-in fade-in zoom-in-95 duration-200">
                                                    {Array.from(new Set([...Object.values(Position), ...editingPositionValue])).map((pos) => {
                                                        const isSelected = editingPositionValue.includes(pos);
                                                        return (
                                                            <label key={pos} className="flex items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-slate-100 dark:border-white/5 last:border-0">
                                                                <input
                                                                    type="checkbox"
                                                                    className="hidden"
                                                                    checked={isSelected}
                                                                    onChange={() => {
                                                                        if (isSelected) {
                                                                            setEditingPositionValue(editingPositionValue.filter(p => p !== pos));
                                                                        } else {
                                                                            setEditingPositionValue([...editingPositionValue, pos]);
                                                                        }
                                                                    }}
                                                                />
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 shrink-0 transition-colors ${isSelected ? 'bg-rose-500 border-rose-500' : 'border-slate-300 dark:border-white/20'}`}>
                                                                    {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                                                                </div>
                                                                <span className="text-[11px] font-bold text-slate-700 dark:text-white/90 uppercase tracking-wider text-left">{pos}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setEditingPositionUserId(user.id);
                                                const posData = user.position || '';
                                                const initialPositions = posData.split(/[,\/]/).map(p => p.trim()).filter(Boolean);
                                                setEditingPositionValue(initialPositions);
                                                setPositionDropdownOpen(true);
                                            }}
                                            className="group/pos flex items-start gap-1.5 text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest hover:text-rose-600 dark:hover:text-rose-300 transition-colors w-full text-left"
                                        >
                                            <span className="flex-1 text-left whitespace-normal">{user.position || 'No Position'}</span>
                                            <PencilSquareIcon className="w-3 h-3 mt-0.5 opacity-0 group-hover/pos:opacity-100 transition-opacity shrink-0" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-6 flex-wrap">
                            {user.isSuperAdmin && (
                                <span className="px-2.5 py-1 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[9px] font-black uppercase tracking-widest border border-primary-500/20">
                                    System Admin
                                </span>
                            )}
                            {user.role === 'admin' && (
                                <span className="px-2.5 py-1 rounded-lg bg-lime-500 text-black text-[9px] font-black uppercase tracking-widest border border-lime-500/20 shadow-sm">
                                    Workspace Admin
                                </span>
                            )}
                            {user.mustChangePassword && (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[9px] font-black uppercase tracking-widest border border-rose-500/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                                    </svg>
                                    Initial Password
                                </span>
                            )}
                        </div>

                        <div className="space-y-4 mb-8 p-5 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-200/40 dark:border-white/5">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">Workspace</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold ${user.spaceName === 'Unassigned' ? 'text-slate-400 italic' : 'text-slate-900 dark:text-white/90'}`}>
                                        {user.spaceName}
                                    </span>
                                    {user.spaceId && (
                                        <button
                                            onClick={() => handleRemoveFromWorkspace(user)}
                                            className="p-1 hover:bg-red-500/20 hover:text-red-500 text-slate-400 rounded transition-colors"
                                            title="Remove from Workspace"
                                        >
                                            <XMarkIcon className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">Email Address</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white/90 truncate" title={user.email}>{user.email}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <button
                                onClick={() => handleToggleSuperAdmin(user)}
                                disabled={user.id === currentUserId}
                                className={`w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300
                                    ${user.isSuperAdmin
                                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 ring-2 ring-primary-500'
                                        : 'bg-white dark:bg-white/5 text-slate-500 dark:text-white/40 border border-slate-200 dark:border-white/10 hover:border-primary-500 hover:text-primary-600'
                                    } ${user.id === currentUserId ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                                `}
                            >
                                <UsersIcon className="w-4 h-4" />
                                {user.isSuperAdmin ? 'Full Access Granted' : 'Give System Admin Access'}
                            </button>

                            {(!user.spaceId) && (
                                <button
                                    onClick={() => handleToggleAdmin(user)}
                                    className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 bg-amber-100 dark:bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500 hover:text-white active:scale-95"
                                >
                                    <KeyIcon className="w-4 h-4" />
                                    Quick Assign & Manage
                                </button>
                            )}
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

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest mb-2">Role in Workspace</label>
                                <select
                                    value={selectedRoleToEnroll}
                                    onChange={(e) => setSelectedRoleToEnroll(e.target.value as 'member' | 'admin')}
                                    className="w-full bg-slate-100 dark:bg-black/20 border-none rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-lime-500 outline-none appearance-none"
                                >
                                    <option value="member">Member</option>
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
