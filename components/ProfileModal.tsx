
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Employee, Position } from '../types';
import { UserIcon } from './icons/UserIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';
import { useTheme, ColorScheme } from './hooks/useTheme';
import { usePreferences, LandingPage, WeekStartDay, TimeFormat, TaskVisibility } from './hooks/usePreferences';
import { supabase } from '../lib/supabaseClient';
import { deleteAvatar, getFallbackAvatar } from '../services/supabaseService';
import { useAuth } from '../auth/AuthContext';
import CustomDropdown from './CustomDropdown';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    currentUserEmployee: Employee | undefined;
    onSave: (data: { name: string; avatarUrl: string; phone: string; position: string; email?: string }) => void;
    onLogout?: () => void;
}

type Tab = 'profile' | 'workflow' | 'security';

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (val: boolean) => void }> = ({ enabled, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
);

const ColorOption: React.FC<{ color: ColorScheme; selected: boolean; onSelect: () => void }> = ({ color, selected, onSelect }) => {
    const bgClasses: Record<ColorScheme, string> = {
        indigo: 'bg-primary-500',
        emerald: 'bg-emerald-500',
        rose: 'bg-rose-500',
        amber: 'bg-amber-500',
        violet: 'bg-violet-500',
        sky: 'bg-sky-500',
    };

    return (
        <button
            onClick={onSelect}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${bgClasses[color]} ${selected ? 'ring-4 ring-offset-2 ring-slate-300 dark:ring-slate-600 scale-110' : 'hover:scale-105'}`}
            title={color.charAt(0).toUpperCase() + color.slice(1)}
        >
            {selected && (
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            )}
        </button>
    );
};

const SegmentedControl: React.FC<{ options: { label: string; value: string }[], value: string, onChange: (val: any) => void }> = ({ options, value, onChange }) => (
    <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-lg">
        {options.map((opt) => (
            <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${value === opt.value
                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
                    }`}
            >
                {opt.label}
            </button>
        ))}
    </div>
);

const Select: React.FC<{ options: { label: string; value: string }[], value: string, onChange: (val: any) => void }> = ({ options, value, onChange }) => (
    <CustomDropdown
        value={value}
        onChange={onChange}
        options={options}
    />
);

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, currentUserEmployee, onSave, onLogout }) => {
    const navigate = useNavigate();
    const { updatePassword, logout, markPasswordChanged } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [show, setShow] = useState(false);
    const [showDefaultPasswordWarning, setShowDefaultPasswordWarning] = useState(false);

    // Profile State
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [phone, setPhone] = useState('');
    const [position, setPosition] = useState<string[]>([]);
    const [email, setEmail] = useState('');

    const [positionDropdownOpen, setPositionDropdownOpen] = useState(false);
    const positionDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (positionDropdownRef.current && !positionDropdownRef.current.contains(event.target as Node)) {
                setPositionDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Preferences State
    const [theme, toggleTheme, colorScheme, setColorScheme] = useTheme();
    const [preferences, setPreferences] = usePreferences();

    // Notifications State - REMOVED
    const [isUploading, setIsUploading] = useState(false);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const data = currentUserEmployee || user;
            setFullName(data.fullName || (data as Employee).name || (data as User).username || '');
            setAvatarUrl(data.avatarUrl || '');
            setPhone(data.phone || '');
            const posData = (data.position as string) || '';
            const rawParts = posData.split(/[,\/]/).map(p => p.trim()).filter(Boolean);
            const normalizedPositions = rawParts.map(part => {
                const canonical = Object.values(Position).find(p => p.toLowerCase() === part.toLowerCase());
                return canonical || part;
            });
            setPosition(Array.from(new Set(normalizedPositions)));
            setEmail(data.email || '');

            const timer = setTimeout(() => setShow(true), 10);
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                clearTimeout(timer);
                document.removeEventListener('keydown', handleKeyDown);
            };
        } else {
            setShow(false);
            // Reset tab when closing
            setTimeout(() => {
                setActiveTab('profile');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordError('');
                setPasswordSuccess('');
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
            }, 300);
        }
    }, [isOpen, onClose, user, currentUserEmployee]);

    if (!isOpen) return null;

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (fullName.trim()) {
            // Check if avatar has changed and delete old one if applicable
            const originalAvatar = currentUserEmployee?.avatarUrl || user.avatarUrl;
            if (avatarUrl && originalAvatar && avatarUrl !== originalAvatar) {
                // Check if old avatar is stored in Supabase storage standard format
                // Typical format: .../storage/v1/object/public/avatars/path/to/file
                if (originalAvatar.includes('/storage/v1/object/public/avatars/')) {
                    const oldPath = originalAvatar.split('/avatars/')[1];
                    if (oldPath) {
                        await deleteAvatar(oldPath);
                    }
                }
            }

            onSave({
                name: fullName.trim(),
                avatarUrl,
                phone,
                position: position.join(', '),
                email
            });
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (!currentPassword) {
            setPasswordError('Current password is required');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return;
        }

        if (!/[A-Z]/.test(newPassword)) {
            setPasswordError('Password must contain at least one uppercase letter');
            return;
        }

        if (!/[0-9]/.test(newPassword)) {
            setPasswordError('Password must contain at least one number');
            return;
        }

        setIsUpdatingPassword(true);
        try {
            // updatePassword now handles:
            // 1. Current password verification
            // 2. Default password rejection (RPC)
            // 3. Auth password update
            // 4. Clearing the must_change_password flag
            await updatePassword(currentPassword, newPassword);

            setPasswordSuccess('Password updated successfully. Logging out...');
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
            setTimeout(async () => {
                await logout();
                onClose();
            }, 1500);
        } catch (error: any) {
            if (error.message === "New password cannot be the default password.") {
                setShowDefaultPasswordWarning(true);
            } else {
                setPasswordError(error.message || 'Failed to update password');
            }
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Simple validation
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert('File size exceeds 2MB limit');
            return;
        }

        try {
            setIsUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.employeeId}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const menuItems = [
        { id: 'profile', label: 'My Profile', icon: UserIcon },
        { id: 'workflow', label: 'Workflow', icon: Cog6ToothIcon },
        { id: 'security', label: 'Security', icon: LockClosedIcon },
    ];

    const colorSchemes: ColorScheme[] = ['indigo', 'emerald', 'rose', 'amber', 'violet', 'sky'];

    return (
        <div
            className={`fixed inset-0 z-50 flex justify-center items-center p-4 transition-all duration-300 ${show ? 'visible' : 'invisible'}`}
            role="dialog"
            aria-modal="true"
        >
            <div
                className={`absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-xl transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
                aria-hidden="true"
            />

            <div className={`bg-white/90 dark:bg-[#1E1E20]/95 backdrop-blur-3xl rounded-3xl shadow-2xl w-full max-w-4xl h-[600px] flex overflow-hidden relative z-10 transition-all duration-300 border border-white/20 dark:border-white/5 transform ${show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'}`}>

                {/* Sidebar */}
                <div className="w-64 flex flex-col border-r border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-transparent">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                <UserIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white">My Account</h2>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">Settings</p>
                            </div>
                        </div>

                        <nav className="space-y-1">
                            {menuItems.map(item => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id as Tab)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${isActive
                                            ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                                            : 'text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                    >
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-primary-500 dark:text-primary-400' : 'opacity-70'}`} />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="mt-auto p-6 border-t border-slate-200/50 dark:border-white/5">
                        {onLogout && (
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10 transition-colors"
                            >
                                <LogoutIcon className="w-4 h-4" />
                                Sign Out
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-black/20 overflow-hidden">
                    <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200/50 dark:border-white/5 bg-white/50 dark:bg-[#1E1E20]/50 backdrop-blur-xl sticky top-0 z-20">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{menuItems.find(i => i.id === activeTab)?.label}</h3>
                            <p className="text-xs text-slate-500 dark:text-white/40 font-medium">Manage your {activeTab} preferences</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-white/10 text-slate-500 dark:text-white/50 hover:bg-slate-300 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white transition-all"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                        {activeTab === 'profile' && (
                            <form onSubmit={handleSaveProfile} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Avatar Section — centered card */}
                                <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
                                    {/* Avatar with hover overlay */}
                                    <div className="relative group/avatar">
                                        {/* Glow ring */}
                                        <div className={`absolute -inset-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full opacity-0 group-hover/avatar:opacity-60 blur transition-all duration-300 ${isUploading ? 'opacity-60 animate-pulse' : ''}`}></div>
                                        <div className="relative">
                                            <img
                                                src={avatarUrl || getFallbackAvatar(fullName)}
                                                alt="Profile"
                                                className={`w-28 h-28 rounded-full object-cover border-4 border-white dark:border-[#2A2A2D] shadow-xl transition-all duration-300 ${isUploading ? 'blur-sm scale-95' : ''}`}
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    const fallbackUrl = getFallbackAvatar(fullName);
                                                    if (target.src !== fallbackUrl) target.src = fallbackUrl;
                                                }}
                                            />
                                            {/* Hover overlay */}
                                            <label
                                                htmlFor="avatar-upload"
                                                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer"
                                            >
                                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
                                            </label>
                                            <input
                                                type="file"
                                                id="avatar-upload"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                disabled={isUploading}
                                            />
                                        </div>
                                    </div>

                                    {/* Name & hint */}
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{fullName.trim() || 'Your Name'}</p>
                                        <p className="text-[11px] text-slate-400 dark:text-white/30 mt-0.5">JPG or PNG · Max 2MB</p>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2">
                                        <label
                                            htmlFor="avatar-upload"
                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-[11px] font-bold rounded-xl cursor-pointer hover:bg-primary-700 shadow-md shadow-primary-500/20 transition-all active:scale-95"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                            </svg>
                                            {isUploading ? 'Uploading…' : 'Upload Photo'}
                                        </label>
                                        {avatarUrl && !avatarUrl.includes('ui-avatars.com') && (
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (avatarUrl.includes('/storage/v1/object/public/avatars/')) {
                                                        const oldPath = avatarUrl.split('/avatars/')[1];
                                                        if (oldPath) await deleteAvatar(oldPath);
                                                    }
                                                    setAvatarUrl('');
                                                }}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border border-red-200/80 dark:border-red-500/20 text-[11px] font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-95"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <hr className="border-slate-200/50 dark:border-white/5" />

                                {/* Personal Details */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Enter your full name"
                                            className="w-full px-4 py-3 bg-slate-100 dark:bg-black/20 border-none rounded-xl focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 transition-all font-medium text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+63 9XX XXX XXXX"
                                            className="w-full px-4 py-3 bg-slate-100 dark:bg-black/20 border-none rounded-xl focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 transition-all font-medium text-sm"
                                        />
                                    </div>

                                    <div className="relative" ref={positionDropdownRef}>
                                        <label className="block text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">Position</label>
                                        <div
                                            onClick={() => setPositionDropdownOpen(!positionDropdownOpen)}
                                            className="w-full px-4 py-3 bg-slate-100 dark:bg-black/20 border-none rounded-xl focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white cursor-pointer transition-all font-medium text-sm min-h-[44px] flex items-center justify-between"
                                        >
                                            <span className={position.length ? "truncate max-w-[90%]" : "text-slate-400 dark:text-white/20"}>
                                                {position.length ? position.join(', ') : "Select your position"}
                                            </span>
                                            <div className="text-slate-500 dark:text-white/40 ml-2 shrink-0">
                                                <svg className={`w-4 h-4 transition-transform ${positionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>

                                        {positionDropdownOpen && (
                                            <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1E1E20] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                                                {Array.from(new Set([...Object.values(Position), ...position])).map((pos) => {
                                                    const isSelected = position.includes(pos);
                                                    return (
                                                        <label key={pos} className="flex items-center px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-slate-100 dark:border-white/5 last:border-0">
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={isSelected}
                                                                onChange={() => {
                                                                    if (isSelected) {
                                                                        setPosition(position.filter(p => p !== pos));
                                                                    } else {
                                                                        setPosition([...position, pos]);
                                                                    }
                                                                }}
                                                            />
                                                            <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 shrink-0 transition-colors ${isSelected ? 'bg-primary-500 border-primary-500' : 'border-slate-300 dark:border-white/20'}`}>
                                                                {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-700 dark:text-white/90">{pos}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <hr className="border-slate-200/50 dark:border-white/5" />

                                {/* Appearance */}
                                <section className="space-y-6">
                                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">Appearance</h4>
                                    <div className="space-y-4">
                                        <div className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-slate-200/50 dark:border-white/5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-primary-500/20 text-primary-400' : 'bg-orange-500/20 text-orange-500'}`}>
                                                        {theme === 'dark' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white text-sm">Interface Theme</p>
                                                        <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">Select your preferred lighting mode.</p>
                                                    </div>
                                                </div>
                                                <div className="flex bg-slate-100 dark:bg-black/40 rounded-xl p-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => theme === 'dark' && toggleTheme()}
                                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-white/40 dark:hover:text-white'}`}
                                                    >
                                                        Light
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => theme === 'light' && toggleTheme()}
                                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${theme === 'dark'
                                                                ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                                                                : 'text-slate-500 hover:text-slate-700 dark:text-white/40 dark:hover:text-white'
                                                            }`}
                                                    >
                                                        Dark
                                                    </button>
                                                </div>
                                            </div>
                                        </div>


                                    </div>
                                </section>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all active:scale-95"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'security' && (
                            <form onSubmit={handleUpdatePassword} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">Change Password</h4>
                                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 p-5 space-y-6">
                                        <p className="text-xs text-slate-500 dark:text-white/40">Secure your account by updating your password regularly.</p>

                                        <div className="space-y-4">
                                            <div className="relative group">
                                                <label className="block text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">Current Password</label>
                                                <div className="relative">
                                                    <input
                                                        id="current-password"
                                                        name="current-password"
                                                        type={showCurrentPassword ? "text" : "password"}
                                                        value={currentPassword}
                                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                                        placeholder="Enter current password"
                                                        className="w-full px-4 py-3 pr-12 bg-slate-100 dark:bg-black/20 border-none rounded-xl focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 transition-all font-medium text-sm"
                                                        required
                                                        autoComplete="current-password"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                            className="text-slate-400 dark:text-white/20 hover:text-slate-600 dark:hover:text-white transition-colors"
                                                        >
                                                            {showCurrentPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-2 relative group">
                                                <label className="block text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">New Password</label>
                                                <div className="relative">
                                                    <input
                                                        id="new-password"
                                                        name="new-password"
                                                        type={showNewPassword ? "text" : "password"}
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        placeholder="Enter new password"
                                                        className="w-full px-4 py-3 pr-12 bg-slate-100 dark:bg-black/20 border-none rounded-xl focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 transition-all font-medium text-sm"
                                                        required
                                                        autoComplete="new-password"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                            className="text-slate-400 dark:text-white/20 hover:text-slate-600 dark:hover:text-white transition-colors"
                                                        >
                                                            {showNewPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-2 relative group">
                                                <label className="block text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">Confirm New Password</label>
                                                <div className="relative">
                                                    <input
                                                        id="confirm-password"
                                                        name="confirm-password"
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        placeholder="Confirm new password"
                                                        className="w-full px-4 py-3 pr-12 bg-slate-100 dark:bg-black/20 border-none rounded-xl focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 transition-all font-medium text-sm"
                                                        required
                                                        autoComplete="new-password"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            className="text-slate-400 dark:text-white/20 hover:text-slate-600 dark:hover:text-white transition-colors"
                                                        >
                                                            {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {passwordError && (
                                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold">
                                                {passwordError}
                                            </div>
                                        )}
                                        {passwordSuccess && (
                                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-semibold">
                                                {passwordSuccess}
                                            </div>
                                        )}

                                        <div className="pt-2 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={isUpdatingPassword}
                                                className="px-6 py-2.5 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}

                        {activeTab === 'workflow' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Task Visibility */}
                                <section>
                                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">Task Visibility</h4>
                                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 p-5 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">Completed Tasks</p>
                                                <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">Control when completed tasks disappear.</p>
                                            </div>
                                            <div className="w-52">
                                                <Select
                                                    value={preferences.showCompletedTasks}
                                                    onChange={(val) => setPreferences('showCompletedTasks', val)}
                                                    options={[
                                                        { label: 'Always Show', value: 'always' },
                                                        { label: 'Recent Only (24h)', value: 'recent' },
                                                        { label: 'Never Show', value: 'never' },
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Performance Optimization */}
                                <section>
                                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">Performance</h4>
                                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 p-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">Low-End Device Mode</p>
                                                <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5 max-w-[280px]">Disables heavy 3D elements and visual effects for a smoother experience.</p>
                                            </div>
                                            <ToggleSwitch
                                                enabled={preferences.performanceMode}
                                                onChange={(val) => setPreferences('performanceMode', val)}
                                            />
                                        </div>
                                    </div>
                                </section>
                                {/* Automation */}
                                <section>
                                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">Automation</h4>
                                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 p-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">Auto-Complete Recurring Tasks</p>
                                                <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5 max-w-[280px]">Automatically mark overdue recurring tasks as done to catch up on the schedule.</p>
                                            </div>
                                            <ToggleSwitch
                                                enabled={preferences.autoCompleteRecurring}
                                                onChange={(val) => setPreferences('autoCompleteRecurring', val)}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Team Hub Status */}
                                {(currentUserEmployee?.isSuperAdmin || user?.role === 'super_admin') && (
                                    <section>
                                        <h4 className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">Team Hub Status</h4>
                                        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 p-5">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm">Ignore Absent Status</p>
                                                    <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5 max-w-[280px]">Treat absent users as if they are active, preventing their tasks from being grayed out in the Team Hub.</p>
                                                </div>
                                                <ToggleSwitch
                                                    enabled={preferences.ignoreAbsentStatus}
                                                    onChange={(val) => setPreferences('ignoreAbsentStatus', val)}
                                                />
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Default Password Warning Modal */}
            {showDefaultPasswordWarning && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl">
                    <div className="bg-white dark:bg-[#1E1E20] rounded-2xl shadow-2xl border border-amber-500/30 p-6 mx-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Default Password Detected</h3>
                                <p className="text-xs text-slate-500 dark:text-white/50 leading-relaxed">
                                    You are using the default password. For your security, you must set a unique password before continuing.
                                </p>
                            </div>
                        </div>
                        <div className="mt-5 flex justify-end">
                            <button
                                onClick={() => {
                                    setShowDefaultPasswordWarning(false);
                                    onClose();
                                    navigate('/force-change-password', { replace: true });
                                }}
                                className="px-5 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-500/30 transition-all active:scale-95"
                            >
                                Set a New Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileModal;
