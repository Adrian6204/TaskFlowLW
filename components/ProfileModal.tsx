
import React, { useState, useEffect } from 'react';
import { User, Employee, Position } from '../types';
import { UserIcon } from './icons/UserIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import { BellIcon } from './icons/BellIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';
import { useTheme, ColorScheme } from './hooks/useTheme';
import { usePreferences, LandingPage, WeekStartDay, TimeFormat, TaskVisibility } from './hooks/usePreferences';
import { supabase } from '../lib/supabaseClient';
import { deleteAvatar } from '../services/supabaseService';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    currentUserEmployee: Employee | undefined;
    onSave: (data: { name: string; avatarUrl: string; phone: string; position: string; email?: string }) => void;
    onLogout?: () => void;
}

type Tab = 'profile' | 'preferences' | 'workflow' | 'notifications';

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
    <div className="relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full appearance-none bg-slate-100 dark:bg-white/5 border border-transparent dark:border-white/5 text-slate-900 dark:text-white text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:outline-none"
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 dark:text-white/40">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </div>
    </div>
);

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, currentUserEmployee, onSave, onLogout }) => {
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [show, setShow] = useState(false);

    // Profile State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [phone, setPhone] = useState('');
    const [position, setPosition] = useState('');
    const [email, setEmail] = useState('');

    // Preferences State
    const [theme, toggleTheme, colorScheme, setColorScheme] = useTheme();
    const [preferences, setPreferences] = usePreferences();

    // Notifications State
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(true);
    const [mentionNotifs, setMentionNotifs] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const data = currentUserEmployee || user;
            const fullName = data.fullName || (data as Employee).name || (data as User).username || '';
            const names = fullName.split(' ');
            setFirstName(names[0] || '');
            setLastName(names.slice(1).join(' ') || '');
            setAvatarUrl(data.avatarUrl || '');
            setPhone(data.phone || '');
            setPosition((data.position as string) || '');
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
            setTimeout(() => setActiveTab('profile'), 300);
        }
    }, [isOpen, onClose, user, currentUserEmployee]);

    if (!isOpen) return null;

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName) {
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
                name: fullName,
                avatarUrl,
                phone,
                position,
                email
            });
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
        { id: 'workflow', label: 'Workflow', icon: SunIcon }, // Using SunIcon as placeholder for workflow/preferences
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
                                {/* Avatar Section */}
                                <div className="flex items-start gap-8">
                                    <div className="relative group">
                                        <div className={`absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full opacity-75 blur transition duration-200 group-hover:opacity-100 ${isUploading ? 'animate-pulse' : ''}`}></div>
                                        <img
                                            src={avatarUrl || 'https://via.placeholder.com/150'}
                                            alt="Profile"
                                            className={`relative w-28 h-28 rounded-full object-cover border-4 border-white dark:border-[#2A2A2D] shadow-xl ${isUploading ? 'blur-[2px]' : ''}`}
                                            onError={(e) => {
                                                const fullName = `${firstName} ${lastName}`.trim();
                                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${fullName}&background=random`;
                                            }}
                                        />
                                        <label htmlFor="avatar-upload" className="absolute bottom-1 right-1 bg-white dark:bg-[#3A3A3E] text-slate-700 dark:text-white p-2 rounded-full shadow-lg border border-slate-100 dark:border-white/10 cursor-pointer hover:scale-105 transition-transform">
                                            <PencilSquareIcon className="w-4 h-4" />
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
                                    <div className="flex-1 pt-2">
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Profile Picture</h4>
                                        <p className="text-xs text-slate-500 dark:text-white/40 leading-relaxed max-w-sm">
                                            This will be displayed on your profile and task comments.
                                            Supported formats: JPG, PNG. Max size: 2MB.
                                        </p>
                                    </div>
                                </div>

                                <hr className="border-slate-200/50 dark:border-white/5" />

                                {/* Personal Details */}
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">First Name</label>
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                placeholder="First name"
                                                className="w-full px-4 py-3 bg-slate-100 dark:bg-black/20 border-none rounded-xl focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 transition-all font-medium text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">Last Name</label>
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                placeholder="Last name"
                                                className="w-full px-4 py-3 bg-slate-100 dark:bg-black/20 border-none rounded-xl focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 transition-all font-medium text-sm"
                                            />
                                        </div>
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

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">Position</label>
                                        <div className="relative">
                                            <select
                                                value={position}
                                                onChange={(e) => setPosition(e.target.value)}
                                                className="w-full px-4 py-3 bg-slate-100 dark:bg-black/20 border-none rounded-xl focus:ring-2 focus:ring-primary-500/50 text-slate-900 dark:text-white appearance-none cursor-pointer transition-all font-medium text-sm"
                                            >
                                                <option value="" disabled>Select your position</option>
                                                {Object.values(Position).map((pos) => (
                                                    <option key={pos} value={pos} className="bg-white dark:bg-slate-800">{pos}</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500 dark:text-white/40">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

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

                        {activeTab === 'preferences' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Appearance */}
                                <section>
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
                                                        onClick={() => theme === 'dark' && toggleTheme()}
                                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-white/40 dark:hover:text-white'}`}
                                                    >
                                                        Light
                                                    </button>
                                                    <button
                                                        onClick={() => theme === 'light' && toggleTheme()}
                                                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${theme === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-white/40 dark:hover:text-white'}`}
                                                    >
                                                        Dark
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-slate-200/50 dark:border-white/5">
                                            <div className="mb-4">
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">Accent Color</p>
                                                <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">Choose a primary color for buttons and highlights.</p>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
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


                            </div>
                        )}

                        {activeTab === 'workflow' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* General */}
                                <section>
                                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">General</h4>
                                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 p-5 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">Default Landing Page</p>
                                                <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">Which view to show when you log in.</p>
                                            </div>
                                            <div className="w-40">
                                                <Select
                                                    value={preferences.landingPage}
                                                    onChange={(val) => setPreferences('landingPage', val)}
                                                    options={[
                                                        { label: 'Home', value: 'home' },
                                                        { label: 'Dashboard', value: 'dashboard' },
                                                        { label: 'Overview', value: 'overview' },
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Calendar */}
                                <section>
                                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">Calendar</h4>
                                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 p-5 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">Start of Week</p>
                                                <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">Adjust the calendar grid.</p>
                                            </div>
                                            <div className="w-32">
                                                <SegmentedControl
                                                    value={preferences.weekStartDay}
                                                    onChange={(val) => setPreferences('weekStartDay', val)}
                                                    options={[
                                                        { label: 'Sunday', value: 'sunday' },
                                                        { label: 'Monday', value: 'monday' },
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-white/5 pt-6">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">Time Format</p>
                                                <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">Display time in 12h or 24h format.</p>
                                            </div>
                                            <div className="w-32">
                                                <SegmentedControl
                                                    value={preferences.timeFormat}
                                                    onChange={(val) => setPreferences('timeFormat', val)}
                                                    options={[
                                                        { label: '12h', value: '12h' },
                                                        { label: '24h', value: '24h' },
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Task Visibility */}
                                <section>
                                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">Task Visibility</h4>
                                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 p-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">Show Completed Tasks</p>
                                                <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">Control when completed tasks are visible.</p>
                                            </div>
                                            <div className="w-40">
                                                <Select
                                                    value={preferences.showCompletedTasks}
                                                    onChange={(val) => setPreferences('showCompletedTasks', val)}
                                                    options={[
                                                        { label: 'Always', value: 'always' },
                                                        { label: 'Never', value: 'never' },
                                                        { label: 'Recent (24h)', value: 'recent' },
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-500/20 rounded-2xl p-4 flex gap-3">
                                    <BellIcon className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                                    <p className="text-sm font-medium text-primary-900 dark:text-primary-200">
                                        Notification settings are currently simulated. Changes will be saved to your local session instantly.
                                    </p>
                                </div>

                                <section>
                                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">Email Alerts</h4>
                                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
                                        <div className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">Daily Digest</p>
                                                <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">A summary of your tasks at 9:00 AM.</p>
                                            </div>
                                            <ToggleSwitch enabled={emailNotifs} onChange={setEmailNotifs} />
                                        </div>
                                        <div className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">Task Assignments</p>
                                                <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">When someone assigns a new task to you.</p>
                                            </div>
                                            <ToggleSwitch enabled={true} onChange={() => { }} />
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest mb-4">Push Notifications</h4>
                                    <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
                                        <div className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">Due Date Reminders</p>
                                                <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">1 hour before a task is due.</p>
                                            </div>
                                            <ToggleSwitch enabled={pushNotifs} onChange={setPushNotifs} />
                                        </div>
                                        <div className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">Mentions & Comments</p>
                                                <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">When someone mentions you in a task.</p>
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
