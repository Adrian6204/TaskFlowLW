
import React, { useState } from 'react';
import { Space, Employee } from '../types';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { UserIcon } from './icons/UserIcon';
import ConfirmationModal from './ConfirmationModal';

interface SpaceSettingsViewProps {
  space: Space;
  members: (Employee & { role?: 'admin' | 'assistant' | 'member' })[];
  allEmployees: Employee[];
  currentUserId?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  onRemoveMember: (spaceId: string, memberId: string) => void;
  onAddMember: (spaceId: string, memberId: string) => void;
  onDeleteSpace: (spaceId: string) => void;
  onUpdateRole?: (spaceId: string, memberId: string, role: 'admin' | 'assistant' | 'member') => void;
  onUpdateSpace?: (spaceId: string, name: string, description: string) => Promise<void>;
}

const SpaceSettingsView: React.FC<SpaceSettingsViewProps> = ({
  space,
  members,
  allEmployees,
  currentUserId,
  isAdmin,
  isSuperAdmin,
  onRemoveMember,
  onAddMember,
  onDeleteSpace,
  onUpdateRole,
  onUpdateSpace
}) => {
  const [copied, setCopied] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedNewMember, setSelectedNewMember] = useState('');

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState(space.name);
  const [editDescription, setEditDescription] = useState(space.description || '');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    setEditName(space.name);
    setEditDescription(space.description || '');
  }, [space]);

  const handleSaveInfo = async () => {
    if (!editName.trim() || !editDescription.trim() || !onUpdateSpace) return;
    setIsSaving(true);
    try {
      await onUpdateSpace(space.id, editName, editDescription);
      setIsEditingInfo(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirmation modals state
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Employee | null>(null);
  const [showDeleteSpaceModal, setShowDeleteSpaceModal] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(space.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddMember = () => {
    if (selectedNewMember) {
      onAddMember(space.id, selectedNewMember);
      setSelectedNewMember('');
      setShowAddMember(false);
    }
  };

  const handleRemoveMemberClick = (member: Employee) => {
    setMemberToRemove(member);
    setShowRemoveMemberModal(true);
  };

  const confirmRemoveMember = () => {
    if (memberToRemove) {
      onRemoveMember(space.id, memberToRemove.id);
      setShowRemoveMemberModal(false);
      setMemberToRemove(null);
    }
  };

  const handleDeleteSpaceClick = () => {
    setShowDeleteSpaceModal(true);
  };

  const confirmDeleteSpace = () => {
    onDeleteSpace(space.id);
    setShowDeleteSpaceModal(false);
  };

  // Get employees that are not already members
  const availableEmployees = allEmployees.filter(emp =>
    !members.some(member => member.id === emp.id)
  );

  const isOwner = currentUserId === space.ownerId;

  return (
    <div className="h-full flex flex-col bg-white/60 dark:bg-black/40 backdrop-blur-[40px] border border-white/40 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-none rounded-[32px] overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-center gap-4">
        <div className="p-3 bg-slate-900 dark:bg-white rounded-2xl shadow-lg">
          <Cog6ToothIcon className="w-6 h-6 text-white dark:text-slate-900" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">Workspace Settings</h2>
          <p className="text-sm font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest">{space.name}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8">

        {/* Workspace Info */}
        <div className="bg-white/50 dark:bg-white/5 rounded-[24px] p-6 border border-white/40 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest">Workspace Information</h3>
            {(isAdmin || isSuperAdmin || isOwner) && !isEditingInfo && (
              <button
                onClick={() => setIsEditingInfo(true)}
                className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                Edit
              </button>
            )}
          </div>

          {isEditingInfo ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest block mb-2">Workspace Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-black/20 border-none rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-lime-500 outline-none"
                  placeholder="Enter workspace name"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest block mb-2">Description</label>
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-black/20 border-none rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-lime-500 outline-none min-h-[100px] resize-none"
                  placeholder="Add a description..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveInfo}
                  disabled={isSaving || !editName.trim() || !editDescription.trim()}
                  className="px-6 py-2.5 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditingInfo(false);
                    setEditName(space.name);
                    setEditDescription(space.description || '');
                  }}
                  className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">Name</label>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{space.name}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">Description</label>
                <p className="text-sm font-medium text-slate-600 dark:text-white/70 mt-1">{space.description || 'No description provided.'}</p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">Created</label>
                <p className="text-sm font-medium text-slate-600 dark:text-white/70 mt-1">
                  {new Date(space.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Invite Section */}
        <div className="bg-white/50 dark:bg-white/5 rounded-[24px] p-6 border border-white/40 dark:border-white/5 shadow-sm">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2 uppercase tracking-wider">Invite New Members</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">Share this code with your team. They can enter it after clicking "Join with Code" in the sidebar.</p>

          <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl p-5 flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Join Code</p>
              <code className="text-3xl font-mono font-bold text-neutral-900 dark:text-white tracking-widest">{space.joinCode}</code>
            </div>
            <button
              onClick={handleCopy}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${copied
                ? 'bg-green-500 text-white'
                : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-95'
                }`}
            >
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>

        {/* Members Section */}
        <div className="bg-white/50 dark:bg-white/5 rounded-[24px] p-6 border border-white/40 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
              Active Members ({members.length})
            </h3>
            {(isAdmin || isSuperAdmin || isOwner) && availableEmployees.length > 0 && (
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-all duration-200"
              >
                <PlusIcon className="w-4 h-4" />
                Add Member
              </button>
            )}
          </div>

          {/* Add Member Form */}
          {showAddMember && (isAdmin || isSuperAdmin || isOwner) && (
            <div className="mb-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border-2 border-primary-200 dark:border-primary-800">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 block">
                Select Member to Add
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedNewMember}
                  onChange={(e) => setSelectedNewMember(e.target.value)}
                  className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:bg-neutral-800 dark:text-white transition-all duration-200"
                >
                  <option value="">Select a member...</option>
                  {availableEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddMember}
                  disabled={!selectedNewMember}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-neutral-400 text-white rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddMember(false);
                    setSelectedNewMember('');
                  }}
                  className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {members.map(member => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-neutral-900/50 transition-all duration-200 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={member.avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover border border-neutral-200/50 dark:border-neutral-700/50"
                  />
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">{member.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Role Tags */}
                  {member.role === 'admin' && <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-lime-500/10 text-lime-600 dark:text-[#CEFD4A] rounded">Workspace Admin</span>}
                  {member.role === 'assistant' && <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded">Assistant</span>}

                  {member.id === space.ownerId ? (
                    <span className="px-3 py-1 text-xs font-bold uppercase bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg">
                      Owner
                    </span>
                  ) : (
                    <>
                      {/* Role Management for Admins/SuperAdmins */}
                      {(isAdmin || isSuperAdmin) && member.role !== 'admin' && (
                        <button
                          onClick={() => onUpdateRole?.(space.id, member.id, member.role === 'assistant' ? 'member' : 'assistant')}
                          className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all duration-200 ${member.role === 'assistant'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-blue-500 hover:text-white'
                            }`}
                        >
                          {member.role === 'assistant' ? 'Revoke Assistant' : 'Make Assistant'}
                        </button>
                      )}

                      {/* Remove Member for Owner/SuperAdmins */}
                      {(isOwner || isSuperAdmin) && (
                        <button
                          onClick={() => handleRemoveMemberClick(member)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all duration-200"
                        >
                          <XMarkIcon className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone - Delete Workspace */}
        {(isOwner || isSuperAdmin) && (
          <div className="bg-red-50/80 dark:bg-red-950/30 rounded-[24px] p-6 border border-red-200/50 dark:border-red-900/40 shadow-sm backdrop-blur-md">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <TrashIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-900 dark:text-red-200 mb-2 uppercase tracking-wider">Danger Zone</h3>
                <p className="text-sm text-red-800 dark:text-red-300 mb-4">
                  Deleting this workspace will permanently remove all tasks, time logs, and data. This action cannot be undone.
                </p>
                <button
                  onClick={handleDeleteSpaceClick}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all duration-200 active:scale-95"
                >
                  <TrashIcon className="w-5 h-5" />
                  Delete Workspace
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Remove Member Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRemoveMemberModal}
        onClose={() => {
          setShowRemoveMemberModal(false);
          setMemberToRemove(null);
        }}
        onConfirm={confirmRemoveMember}
        title="Remove Member"
        message={memberToRemove ? `Are you sure you want to remove ${memberToRemove.name} from "${space.name}"? They will lose access to all tasks and data in this workspace.` : ''}
        confirmText="Remove Member"
        cancelText="Cancel"
      />

      {/* Delete Workspace Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteSpaceModal}
        onClose={() => setShowDeleteSpaceModal(false)}
        onConfirm={confirmDeleteSpace}
        title="Delete Workspace"
        message={`Are you sure you want to permanently delete "${space.name}"? This action cannot be undone and will delete all tasks, time logs, comments, and data in this workspace.`}
        confirmText="Delete Workspace"
        cancelText="Cancel"
      />
    </div>
  );
};

export default SpaceSettingsView;
