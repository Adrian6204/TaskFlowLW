
import React, { useState } from 'react';
import { Space, Employee } from '../types';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { UserIcon } from './icons/UserIcon';
import { UsersIcon } from './icons/UsersIcon';
import { KeyIcon } from './icons/KeyIcon';
import { PencilIcon } from './icons/PencilIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import ConfirmationModal from './ConfirmationModal';
import { cardAccents } from './WorkspaceHomePage';
import { getFallbackAvatar, deleteWorkspaceLogo } from '../services/supabaseService';
import { supabase } from '../lib/supabaseClient';

interface SpaceSettingsViewProps {
  space: Space;
  members: (Employee & { role?: 'admin' | 'member' })[];
  allEmployees: Employee[];
  currentUserId?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  onRemoveMember: (spaceId: string, memberId: string) => void;
  onAddMember: (spaceId: string, memberId: string) => void;
  onDeleteSpace: (spaceId: string) => void;
  onUpdateSpace?: (spaceId: string, updates: { name: string; description: string; theme?: string; logoUrl?: string | null }) => Promise<void>;
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
  onUpdateSpace
}) => {
  const [copied, setCopied] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [showDangerZone, setShowDangerZone] = useState(false);

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState(space.name);
  const [editDescription, setEditDescription] = useState(space.description || '');
  const [editTheme, setEditTheme] = useState(space.theme || '');
  const [editLogoUrl, setEditLogoUrl] = useState(space.logoUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const themeIndex = (space.theme && !isNaN(parseInt(space.theme)))
    ? parseInt(space.theme) % cardAccents.length
    : 0;
  const accent = cardAccents[themeIndex];

  React.useEffect(() => {
    setEditName(space.name);
    setEditDescription(space.description || '');
    setEditTheme(space.theme || '');
    setEditLogoUrl(space.logoUrl || '');
  }, [space]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please upload an image file'); return; }
    if (file.size > 2 * 1024 * 1024) { alert('File size exceeds 2MB limit'); return; }
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${space.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('workspace-logos').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('workspace-logos').getPublicUrl(fileName);
      if (editLogoUrl && editLogoUrl.includes('/workspace-logos/')) {
        const oldPath = editLogoUrl.split('/workspace-logos/')[1];
        if (oldPath) await deleteWorkspaceLogo(oldPath);
      }
      setEditLogoUrl(publicUrl);
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => setEditLogoUrl('');

  const handleSaveInfo = async () => {
    if (!editName.trim() || !onUpdateSpace) return;
    setIsSaving(true);
    try {
      if (space.logoUrl && space.logoUrl !== editLogoUrl && space.logoUrl.includes('/workspace-logos/')) {
        const oldPath = space.logoUrl.split('/workspace-logos/')[1];
        if (oldPath) await deleteWorkspaceLogo(oldPath);
      }
      await onUpdateSpace(space.id, { name: editName, description: editDescription, theme: editTheme, logoUrl: editLogoUrl || null });
      setIsEditingInfo(false);
    } finally {
      setIsSaving(false);
    }
  };

  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Employee | null>(null);
  const [showDeleteSpaceModal, setShowDeleteSpaceModal] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(space.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const confirmDeleteSpace = () => {
    onDeleteSpace(space.id);
    setShowDeleteSpaceModal(false);
  };

  const isOwner = currentUserId === space.ownerId;

  const availableEmployees = allEmployees.filter(emp => !members.some(m => m.id === emp.id));
  const filteredAvailable = availableEmployees.filter(e =>
    e.name.toLowerCase().includes(addMemberSearch.toLowerCase()) ||
    (e.email || '').toLowerCase().includes(addMemberSearch.toLowerCase())
  );

  // Shared card class
  const card = 'bg-white/60 dark:bg-white/5 rounded-[24px] p-6 border border-white/30 dark:border-white/5 shadow-sm';

  // Section header row with icon
  const SectionHeader = ({ icon, label, children }: { icon: React.ReactNode; label: string; children?: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5">
          {icon}
        </div>
        <span className={`text-[11px] font-black uppercase tracking-widest ${accent?.text || 'text-slate-500'} ${accent?.darkText || 'dark:text-white/40'}`}>{label}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white/60 dark:bg-black/40 backdrop-blur-[40px] md:border border-white/40 dark:border-white/5 md:shadow-xl shadow-black/5 dark:shadow-none md:rounded-[32px] overflow-hidden animate-fade-in">

      {/* Header */}
      <div className="px-6 md:px-8 py-4 md:py-6 border-b border-black/5 dark:border-white/5 flex items-center gap-4">
        <div className={`p-2.5 md:p-3 bg-gradient-to-br ${accent?.from || 'from-slate-900'} ${accent?.to || 'to-slate-800'} rounded-xl md:rounded-2xl shadow-lg shrink-0`}>
          <Cog6ToothIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white truncate">Workspace Settings</h2>
          <p className="text-[10px] md:text-[11px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest mt-0.5 truncate">{space.name}</p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* ── Workspace Information ── */}
        <div className={card}>
          <SectionHeader
            icon={<Cog6ToothIcon className={`w-4 h-4 ${accent?.text || 'text-slate-500'}`} />}
            label="Workspace Information"
          >
            {(isAdmin || isSuperAdmin || isOwner) && !isEditingInfo && (
              <button
                onClick={() => setIsEditingInfo(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-white/60 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                <PencilIcon className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
          </SectionHeader>

          {isEditingInfo ? (
            <div className="space-y-5">
              {/* Logo upload — compact inline row */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/8 dark:border-white/8">
                <div className="relative group/logo shrink-0">
                  <div className={`absolute -inset-1 bg-gradient-to-r ${accent?.from || 'from-lime-500'} ${accent?.to || 'to-emerald-500'} rounded-2xl opacity-0 group-hover/logo:opacity-40 blur transition-all duration-300 ${isUploading ? 'opacity-40 animate-pulse' : ''}`} />
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-2xl overflow-hidden shadow border-2 border-white dark:border-white/10 bg-white dark:bg-black/20 flex items-center justify-center ${isUploading ? 'blur-sm grayscale' : ''}`}>
                      {editLogoUrl
                        ? <img src={editLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                        : <span className={`text-2xl font-black ${accent?.text || 'text-slate-900'}`}>{editName.charAt(0).toUpperCase()}</span>
                      }
                    </div>
                    <label htmlFor="logo-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/logo:opacity-100 rounded-2xl cursor-pointer transition-all">
                      <PhotoIcon className="w-4 h-4 text-white" />
                    </label>
                    <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest">Workspace Logo</p>
                  <p className="text-[10px] text-slate-400 dark:text-white/20 mt-0.5">Square image, PNG or JPG · Max 2MB</p>
                  <div className="flex items-center gap-2 mt-2">
                    <label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70 text-[10px] font-bold uppercase tracking-wider transition-all">
                      <PhotoIcon className="w-3 h-3" /> Change Photo
                    </label>
                    {editLogoUrl && (
                      <button onClick={handleRemoveLogo} disabled={isUploading} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50">
                        <TrashIcon className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest block mb-2">Workspace Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/25 focus:bg-white dark:focus:bg-black/30 transition-all font-medium"
                  placeholder="Enter workspace name"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest block mb-2">Description</label>
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full bg-black/5 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-2xl py-3 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-black/20 dark:focus:border-white/25 focus:bg-white dark:focus:bg-black/30 transition-all min-h-[72px] resize-none font-medium"
                  placeholder="Add a description..."
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest block mb-3">Color Theme</label>
                <div className="flex flex-wrap gap-3">
                  {cardAccents.map((ac, index) => {
                    const ringColors = ['#046241','#133020','#FFB347','#FFC370','#059669','#d97706'];
                    const isSelected = editTheme === index.toString();
                    return (
                      <button
                        key={index}
                        onClick={() => setEditTheme(index.toString())}
                        className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${ac.from} ${ac.to} transition-all duration-200 relative ${isSelected ? 'scale-110' : 'opacity-50 hover:opacity-90 hover:scale-105'}`}
                        style={isSelected ? { boxShadow: `0 0 0 2px white, 0 0 0 4px ${ringColors[index]}` } : undefined}
                      >
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white shadow" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveInfo}
                  disabled={isSaving || !editName.trim()}
                  className={`px-6 py-2.5 bg-gradient-to-r ${accent?.from || 'from-lime-500'} ${accent?.to || 'to-emerald-500'} text-white font-bold text-sm rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ boxShadow: `0 4px 14px ${['#046241','#133020','#FFB347','#FFC370','#059669','#d97706'][themeIndex]}40` }}
                >
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  onClick={() => { setIsEditingInfo(false); setEditName(space.name); setEditDescription(space.description || ''); setEditTheme(space.theme || ''); setEditLogoUrl(space.logoUrl || ''); }}
                  className="px-6 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-white/60 font-bold text-sm rounded-xl transition-colors border-none"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
              <div className={`w-20 h-20 rounded-2xl overflow-hidden shadow-lg border-2 border-white dark:border-white/10 bg-gradient-to-br ${accent?.from || 'from-slate-200'} ${accent?.to || 'to-slate-300'} flex items-center justify-center shrink-0`}>
                {space.logoUrl
                  ? <img src={space.logoUrl} alt={space.name} className="w-full h-full object-cover" />
                  : <span className="text-3xl font-black text-white">{space.name.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div className="flex-1 min-w-0 text-center md:text-left">
                <p className="text-xl font-black text-slate-900 dark:text-white truncate">{space.name}</p>
                <p className="text-[11px] text-slate-400 dark:text-white/30 mt-1">{space.description || 'No description provided.'}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 md:w-6 md:h-6 rounded-lg bg-gradient-to-br ${accent?.from} ${accent?.to}`} />
                    <span className="text-[10px] md:text-[11px] font-bold text-slate-400 dark:text-white/30">Theme {themeIndex + 1}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-300 dark:text-white/20">·</span>
                  <span className="text-[10px] md:text-[11px] font-bold text-slate-400 dark:text-white/30">{members.length} members</span>
                  <span className="text-[11px] font-bold text-slate-300 dark:text-white/20 hidden md:inline">·</span>
                  <span className="text-[10px] md:text-[11px] font-bold text-slate-400 dark:text-white/30 hidden md:inline">Created {new Date(space.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Invite / Join Code ── */}
        <div className={card}>
          <SectionHeader
            icon={<KeyIcon className={`w-4 h-4 ${accent?.text || 'text-slate-500'}`} />}
            label="Invite Members"
          />
          <p className="text-sm text-slate-500 dark:text-white/40 mb-5 -mt-2">Share this code with your team. They enter it via "Join with Code" in the sidebar.</p>

          <div className="flex items-center gap-4 p-5 bg-black/5 dark:bg-black/20 rounded-2xl border border-black/5 dark:border-white/5">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest mb-1.5">Join Code</p>
              <code className="text-3xl font-mono font-black text-slate-900 dark:text-white tracking-[0.25em]">{space.joinCode}</code>
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-300 shrink-0 ${
                copied
                  ? 'bg-lime-500 text-white shadow-lg shadow-lime-500/20'
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95'
              }`}
            >
              {copied ? <CheckCircleIcon className="w-4 h-4" /> : <KeyIcon className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>

        {/* ── Members ── */}
        <div className={card}>
          <SectionHeader
            icon={<UsersIcon className={`w-4 h-4 ${accent?.text || 'text-slate-500'}`} />}
            label={`Members (${members.length})`}
          >
            {(isAdmin || isSuperAdmin || isOwner) && availableEmployees.length > 0 && (
              <button
                onClick={() => { setShowAddMember(!showAddMember); setAddMemberSearch(''); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r ${accent?.from || 'from-lime-500'} ${accent?.to || 'to-emerald-500'} text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95`}
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add Member
              </button>
            )}
          </SectionHeader>

          {/* Search-based Add Member panel */}
          {showAddMember && (isAdmin || isSuperAdmin || isOwner) && (
            <div className="mb-4 p-4 bg-black/5 dark:bg-black/20 rounded-2xl border border-black/5 dark:border-white/5">
              <div className="relative mb-3">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search by name or email…"
                  value={addMemberSearch}
                  onChange={e => setAddMemberSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-lime-500/50"
                />
              </div>
              <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
                {filteredAvailable.length === 0 && (
                  <p className="text-center text-[12px] text-slate-400 dark:text-white/30 py-4">
                    {addMemberSearch.length > 0 ? 'No matching users found.' : 'All employees are already members.'}
                  </p>
                )}
                {filteredAvailable.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => { onAddMember(space.id, emp.id); setShowAddMember(false); setAddMemberSearch(''); }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-colors text-left group"
                  >
                    <img src={emp.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-black/5 dark:border-white/10 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{emp.name}</p>
                      <p className="text-[11px] text-slate-400 dark:text-white/30 truncate">{emp.email}</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${accent?.text || 'text-lime-600'} bg-lime-500/10 opacity-0 group-hover:opacity-100 transition-opacity`}>Add</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Members list */}
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {members.map(member => (
              <div
                key={member.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={member.avatarUrl}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-white/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{member.name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-white/30 truncate">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {member.id === space.ownerId ? (
                    <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full">
                      Owner
                    </span>
                  ) : member.role === 'admin' ? (
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest ${accent?.text || 'text-lime-600'} bg-lime-500/10 rounded-full`}>
                      Admin
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 bg-black/5 dark:bg-white/5 rounded-full">
                      Member
                    </span>
                  )}
                  {(isOwner || isSuperAdmin) && member.id !== space.ownerId && (
                    <button
                      onClick={() => handleRemoveMemberClick(member)}
                      className="p-1.5 text-slate-300 dark:text-white/20 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Danger Zone ── */}
        {(isOwner || isSuperAdmin) && (
          <div className="bg-red-50/60 dark:bg-red-950/20 rounded-[24px] border border-red-200/40 dark:border-red-900/30 overflow-hidden">
            <button
              onClick={() => setShowDangerZone(!showDangerZone)}
              className="w-full flex items-center justify-between px-6 py-5 hover:bg-red-50/60 dark:hover:bg-red-950/20 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-red-500/10">
                  <TrashIcon className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-red-500">Danger Zone</span>
              </div>
              <ChevronDownIcon className={`w-4 h-4 text-red-400 transition-transform duration-200 ${showDangerZone ? 'rotate-180' : ''}`} />
            </button>

            {showDangerZone && (
              <div className="px-6 pb-6 border-t border-red-200/40 dark:border-red-900/30">
                <p className="text-sm text-red-700/80 dark:text-red-300/70 mt-5 mb-5 leading-relaxed">
                  Deleting this workspace will permanently remove all tasks, time logs, and data. <strong>This action cannot be undone.</strong>
                </p>
                <button
                  onClick={() => setShowDeleteSpaceModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-red-600/20"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete Workspace
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showRemoveMemberModal}
        onClose={() => { setShowRemoveMemberModal(false); setMemberToRemove(null); }}
        onConfirm={confirmRemoveMember}
        title="Remove Member"
        message={memberToRemove ? `Are you sure you want to remove ${memberToRemove.name} from "${space.name}"? They will lose access to all tasks and data in this workspace.` : ''}
        confirmText="Remove Member"
        cancelText="Cancel"
      />
      <ConfirmationModal
        isOpen={showDeleteSpaceModal}
        onClose={() => setShowDeleteSpaceModal(false)}
        onConfirm={confirmDeleteSpace}
        title="Delete Workspace"
        message={`Are you sure you want to permanently delete "${space.name}"? This action cannot be undone and will delete all tasks, time logs, and data in this workspace.`}
        confirmText="Delete Workspace"
        cancelText="Cancel"
      />
    </div>
  );
};

export default SpaceSettingsView;
