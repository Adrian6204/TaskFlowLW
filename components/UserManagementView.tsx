import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
import CustomDropdown from './CustomDropdown';

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
        requireString?: string;
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
            requireString: 'DELETE',
            onConfirm: async () => {
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

    const handleRemoveFromWorkspace = async (user: EmployeeWithRole, spaceId: string, spaceName: string) => {
        setConfirmModal({
            isOpen: true,
            title: `Remove from Workspace?`,
            message: `Are you sure you want to remove ${user.name} from "${spaceName}"?`,
            type: 'warning',
            onConfirm: async () => {
                try {
                    await dataService.removeMemberFromSpace(spaceId, user.id);
                    loadUsers();
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

    // Filter users with extra safety
    const filteredUsers = users.filter(u => {
        const name = (u.name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const workspacesSearch = u.workspaces.some(w => w.spaceName.toLowerCase().includes(searchTerm.toLowerCase()));
        const search = (searchTerm || '').toLowerCase();

        return name.includes(search) ||
            email.includes(search) ||
            workspacesSearch;
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
                        className={`p-8 group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-black/5 dark:hover:shadow-none flex flex-col h-full ${user.mustChangePassword ? 'ring-1 ring-rose-500/30 bg-rose-500/[0.02] shadow-[0_0_20px_-5px_rgba(244,63,94,0.1)]' : ''}`}
                    >

                        <div className="flex items-start justify-between mb-6">
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
                                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 capitalize tracking-widest truncate">
                                                    {editingPositionValue.length ? editingPositionValue.join(', ') : "Select Position"}
                                                </span>
                                                <svg className={`w-3 h-3 text-emerald-600 transition-transform ${positionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>

                                            {positionDropdownOpen && (
                                                <div className="absolute z-[100] w-64 mt-2 bg-white dark:bg-black/80 dark:backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto left-0 animate-in fade-in zoom-in-95 duration-200">
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
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 shrink-0 transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-white/20'}`}>
                                                                    {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                                                                </div>
                                                                <span className="text-[11px] font-bold text-slate-700 dark:text-white/90 capitalize tracking-wider text-left">{pos}</span>
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
                                            className="group/pos flex items-start gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 capitalize tracking-widest hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors w-full text-left"
                                        >
                                            <span className="flex-1 text-left whitespace-normal">{user.position || 'No Position'}</span>
                                            <PencilSquareIcon className="w-3 h-3 mt-0.5 opacity-0 group-hover/pos:opacity-100 transition-opacity shrink-0" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-6 flex-wrap gap-y-4">
                            <div className="flex items-center gap-2 flex-wrap min-h-[28px]">
                                {user.isSuperAdmin && (
                                    <span className="px-2.5 py-1 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[9px] font-black uppercase tracking-widest border border-primary-500/20">
                                        System Admin
                                    </span>
                                )}
                                {user.mustChangePassword && (
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[9px] font-black uppercase tracking-widest border border-rose-500/20">
                                        Default Password
                                    </span>
                                )}
                            </div>

                            {/* Maintenance Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleResetPassword(user)}
                                    className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all"
                                    title="Reset Password"
                                >
                                    <KeyIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDeleteAccount(user)}
                                    disabled={user.id === currentUserId}
                                    className={`p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all ${user.id === currentUserId ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                                    title="Delete Account"
                                >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        <div className="mb-8 p-5 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-200/40 dark:border-white/5 flex flex-col min-h-[160px]">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest mb-3">Workspaces</span>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[160px]">
                                {user.workspaces.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {user.workspaces.map((w) => (
                                            <div key={w.spaceId} className="flex items-center justify-between group/ws bg-white/80 dark:bg-white/5 py-1.5 px-3 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-sm transition-all hover:border-lime-400/40 dark:hover:border-lime-400/30">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white/90 truncate mr-2">
                                                    {w.spaceName}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveFromWorkspace(user, w.spaceId, w.spaceName)}
                                                    className="p-1 px-1.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-lg transition-all opacity-0 group-hover/ws:opacity-100 flex-shrink-0"
                                                    title="Remove from Workspace"
                                                >
                                                    <XMarkIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <span className="text-sm font-bold text-slate-400 italic">Unassigned</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2.5 mt-auto">
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

                            <button
                                onClick={() => {
                                    setSelectedUserToEnroll(user.id);
                                    setIsEnrollModalOpen(true);
                                }}
                                className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 bg-amber-100 dark:bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500 hover:text-white active:scale-95"
                            >
                                <PlusIcon className="w-4 h-4" />
                                {user.workspaces.length > 0 ? 'Enroll in Additional Space' : 'Enroll in Workspace'}
                            </button>
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
            {isEnrollModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsEnrollModalOpen(false)}>
                    <div className="bg-white dark:bg-black/60 dark:backdrop-blur-xl rounded-[32px] w-full max-w-lg p-8 shadow-2xl animate-scale-in border border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Enroll Member to Workspace</h3>
                            <button onClick={() => setIsEnrollModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                                <XMarkIcon className="w-6 h-6 text-slate-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest mb-2">Select User</label>
                                <CustomDropdown
                                    value={selectedUserToEnroll}
                                    onChange={(val) => setSelectedUserToEnroll(val as string)}
                                    options={users
                                        .filter(u => u.id !== currentUserId)
                                        .map(u => ({
                                            value: u.id,
                                            label: u.name,
                                            subtitle: u.workspaces.length ? u.workspaces.map(w => w.spaceName).join(', ') : 'Unassigned'
                                        }))
                                    }
                                    placeholder="Search and choose user..."
                                    searchable
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest mb-2">Select Target Workspace</label>
                                <CustomDropdown
                                    value={selectedSpaceToEnroll}
                                    onChange={(val) => setSelectedSpaceToEnroll(val as string)}
                                    options={spaces.map(s => ({
                                        value: s.id,
                                        label: s.name
                                    }))}
                                    placeholder="Select target workspace..."
                                    searchable={spaces.length > 5}
                                />
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
                </div>,
                document.body
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                requireString={confirmModal.requireString}
            />
        </div>
    );
};

export default UserManagementView;
