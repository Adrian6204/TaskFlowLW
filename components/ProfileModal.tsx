
import React, { useState, useEffect } from 'react';
import { User, Employee } from '../types';
import { UserIcon } from './icons/UserIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { BellIcon } from './icons/BellIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { useTheme, ColorScheme } from './hooks/useTheme';
import { supabase } from '../lib/supabaseClient';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    currentUserEmployee: Employee | undefined;
    onSave: (name: string, avatarUrl: string) => void;
    onLogout?: () => void;
}

type Tab = 'profile' | 'preferences' | 'notifications';

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
        indigo: 'bg-indigo-500',
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

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, currentUserEmployee, onSave, onLogout }) => {
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [show, setShow] = useState(false);

    // Profile State
    const [name, setName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');

    // Preferences State
    const [theme, toggleTheme, colorScheme, setColorScheme] = useTheme();
    const [compactMode, setCompactMode] = useState(false);

    // Notifications State
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(true);
    const [mentionNotifs, setMentionNotifs] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (currentUserEmployee) {
                setName(currentUserEmployee.fullName || currentUserEmployee.name);
                setAvatarUrl(currentUserEmployee.avatarUrl);
            } else {
                setName(user.fullName || user.username);
                setAvatarUrl(user.avatarUrl || '');
            }

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
            setTimeout(() => setActiveTab('profile'), 300);
        }
    }, [isOpen, onClose, user, currentUserEmployee]);

    if (!isOpen) return null;

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name, avatarUrl);
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
        { id: 'preferences', label: 'Preferences', icon: Cog6ToothIcon },
        { id: 'notifications', label: 'Notifications', icon: BellIcon },
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

            <div className={`bg-white/80 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[40px] shadow-2xl w-full max-w-4xl h-[650px] flex overflow-hidden relative z-10 transition-all duration-300 border border-black/10 dark:border-white/10 transform ${show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'}`}>

                {/* Sidebar */}
                <div className="w-64 bg-black/5 dark:bg-black/20 border-r border-black/5 dark:border-white/5 flex flex-col">
                    <div className="p-8 border-b border-black/5 dark:border-white/5">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Account</h2>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mt-1">System Controller</p>
                    </div>

                    <nav className="flex-1 p-4 space-y-2">
                        {menuItems.map(item => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as Tab)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === item.id
                                        ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-lg shadow-black/5'
                                        : 'text-slate-400 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                        {onLogout && (
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10 transition-colors"
                            >
                                <LogoutIcon className="w-5 h-5" />
                                Sign Out
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col bg-transparent overflow-y-auto scrollbar-none">
                    <div className="flex items-center justify-between p-8 border-b border-black/5 dark:border-white/5 sticky top-0 bg-transparent backdrop-blur-xl z-10">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">{activeTab} Interface</h3>
                        <button onClick={onClose} className="p-3 bg-black/5 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl transition-all">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-8 max-w-2xl">
                        {activeTab === 'profile' && (
                            <form onSubmit={handleSaveProfile} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Avatar Section */}
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <img
                                            src={avatarUrl || 'https://via.placeholder.com/150'}
                                            alt="Profile"
                                            className={`w-24 h-24 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800 shadow-md ${isUploading ? 'blur-[2px]' : ''}`}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${name}&background=random`;
                                            }}
                                        />
                                        <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <span className="text-white text-xs font-bold">{isUploading ? '...' : 'Change'}</span>
                                        </label>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-slate-900 dark:text-white">Profile Picture</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">
                                            Click the avatar or use the button below to upload a new one. (Max 2MB)
                                        </p>
                                        <input
                                            type="file"
                                            id="avatar-upload"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            disabled={isUploading}
                                        />
                                        <label
                                            htmlFor="avatar-upload"
                                            className={`inline-flex px-4 py-2 border border-black/10 dark:border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-all text-slate-900 dark:text-white ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/5 dark:hover:bg-white/5 active:scale-95'}`}
                                        >
                                            {isUploading ? 'Uploading...' : 'Choose File'}
                                        </label>
                                    </div>
                                </div>

                                <hr className="border-slate-200 dark:border-slate-800" />

                                {/* Personal Details */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-900 dark:text-white sm:text-sm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                                            <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md text-slate-500 dark:text-slate-400 text-sm capitalize">
                                                {user.role}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Employee ID</label>
                                            <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md text-slate-500 dark:text-slate-400 text-sm font-mono">
                                                {user.employeeId}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all active:scale-95"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Appearance */}
                                <section>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Appearance</h4>
                                    <div className="space-y-4">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-primary-500/20 text-primary-400' : 'bg-orange-500/20 text-orange-500'}`}>
                                                        {theme === 'dark' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900 dark:text-white">Interface Theme</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">Select your preferred lighting mode.</p>
                                                    </div>
                                                </div>
                                                <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                                                    <button
                                                        onClick={() => theme === 'dark' && toggleTheme()}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${theme === 'light' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                                                    >
                                                        Light
                                                    </button>
                                                    <button
                                                        onClick={() => theme === 'light' && toggleTheme()}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${theme === 'dark' ? 'bg-slate-600 text-white shadow' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                                                    >
                                                        Dark
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                                            <div className="mb-3">
                                                <p className="font-medium text-slate-900 dark:text-white">Accent Color</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Choose a primary color for buttons and highlights.</p>
                                            </div>
                                            <div className="flex flex-wrap gap-4">
                                                {colorSchemes.map(color => (
                                                    <ColorOption
                                                        key={color}
                                                        color={color}
                                                        selected={colorScheme === color}
                                                        onSelect={() => setColorScheme(color)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Interface */}
                                <section>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Interface</h4>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                        <div className="flex items-center justify-between p-4">
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">Compact Mode</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Reduce spacing for higher density.</p>
                                            </div>
                                            <ToggleSwitch enabled={compactMode} onChange={setCompactMode} />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 flex gap-3">
                                    <BellIcon className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                                    <p className="text-sm text-primary-800 dark:text-primary-200">
                                        Notification settings are currently simulated for demonstration. Changes will be saved to your local session.
                                    </p>
                                </div>

                                <section>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Email Alerts</h4>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                        <div className="flex items-center justify-between p-4">
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">Daily Digest</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">A summary of your tasks at 9:00 AM.</p>
                                            </div>
                                            <ToggleSwitch enabled={emailNotifs} onChange={setEmailNotifs} />
                                        </div>
                                        <div className="flex items-center justify-between p-4">
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">Task Assignments</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">When someone assigns a new task to you.</p>
                                            </div>
                                            <ToggleSwitch enabled={true} onChange={() => { }} />
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Push Notifications</h4>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                        <div className="flex items-center justify-between p-4">
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">Due Date Reminders</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">1 hour before a task is due.</p>
                                            </div>
                                            <ToggleSwitch enabled={pushNotifs} onChange={setPushNotifs} />
                                        </div>
                                        <div className="flex items-center justify-between p-4">
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">Mentions & Comments</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">When someone mentions you in a task.</p>
                                            </div>
                                            <ToggleSwitch enabled={mentionNotifs} onChange={setMentionNotifs} />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
