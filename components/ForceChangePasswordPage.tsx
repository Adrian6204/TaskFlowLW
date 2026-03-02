import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Logo } from './Logo';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';
import Background from './Background';
import InteractiveParticles from './InteractiveParticles';

const getStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { score, label: 'Fair', color: 'bg-amber-500' };
    if (score === 3) return { score, label: 'Good', color: 'bg-lime-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
};

const ForceChangePasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout, markPasswordChanged } = useAuth();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    const strength = getStrength(newPassword);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) return;
        if (!/[A-Z]/.test(newPassword)) return;
        if (!/[0-9]/.test(newPassword)) return;
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);
        try {
            const isAcceptable = await markPasswordChanged(newPassword);
            if (!isAcceptable) {
                setError('Please choose a different password.');
                return;
            }
            navigate('/app/home', { replace: true });
        } catch (err: any) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-screen w-full relative flex items-center justify-center bg-slate-50 dark:bg-black overflow-hidden font-sans transition-colors duration-500 p-4">
            <Background />
            <InteractiveParticles />

            {/* Theme Toggle */}
            <div className="absolute top-8 right-8 z-[100]">
                <button
                    onClick={toggleTheme}
                    className="p-3 bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white hover:bg-white/20 dark:hover:bg-white/10 transition-all shadow-xl"
                >
                    {theme === 'dark' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                    )}
                </button>
            </div>

            <div className="relative z-10 w-full max-w-4xl animate-fade-in flex flex-col gap-6">
                {/* Compact Logo Header */}
                <div className="flex items-center gap-4 justify-center lg:justify-start lg:ml-8">
                    <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20 dark:border-white/10 shadow-lg">
                        <Logo className="w-7 h-7 text-slate-900 dark:text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Task Flow</span>
                        <span className="text-[9px] font-bold text-slate-500 dark:text-white/30 uppercase tracking-widest">Security System</span>
                    </div>
                </div>

                {/* Landscape Glassmorphic Card */}
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl border border-black/5 dark:border-white/5 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-5 h-full">

                        {/* Left Side: Info & Policy (2/5) */}
                        <div className="lg:col-span-2 p-8 lg:p-12 bg-slate-900/5 dark:bg-white/5 border-b lg:border-b-0 lg:border-r border-black/5 dark:border-white/5 flex flex-col justify-center text-center lg:text-left">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">Hi {user?.fullName || user?.username}!</h2>
                            <p className="text-sm text-slate-500 dark:text-white/50 mb-10 font-medium leading-relaxed">To protect your account, please update your temporary password now.</p>

                            <div className="space-y-6">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] block">Policy Checklist</span>
                                <div className="space-y-3">
                                    {[
                                        { label: '6+ Characters', met: newPassword.length >= 6 },
                                        { label: 'One Uppercase', met: /[A-Z]/.test(newPassword) },
                                        { label: 'One Number', met: /[0-9]/.test(newPassword) },
                                    ].map(({ label, met }) => (
                                        <div key={label} className={`flex items-center gap-3 text-xs font-bold transition-all duration-500 ${met ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 dark:text-white/20'}`}>
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${met ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-black/10 dark:border-white/10 grayscale opacity-50'}`}>
                                                <svg className={`w-3 h-3 ${met ? 'block' : 'hidden'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            {label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Form (3/5) */}
                        <div className="lg:col-span-3 p-8 lg:p-12 flex flex-col justify-center">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-5">
                                    {/* New Password */}
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] ml-1">New Password</label>
                                        <div className="relative group">
                                            <input
                                                id="new-password"
                                                name="new-password"
                                                type={showNew ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                                                className="w-full bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl py-3.5 px-5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-black/10 dark:focus:border-white/10 transition-all duration-300 text-sm font-medium"
                                                placeholder="••••••••"
                                                required
                                                autoComplete="new-password"
                                            />
                                            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 hover:text-slate-600 dark:hover:text-white transition-colors">
                                                {showNew ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        {/* Strength Bar */}
                                        <div className="flex gap-1 pt-1 h-0.5 px-1">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className={`flex-1 rounded-full transition-all duration-700 ${i <= strength.score ? strength.color : 'bg-slate-200 dark:bg-white/10'}`} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] ml-1">Confirm New Password</label>
                                        <div className="relative group">
                                            <input
                                                id="confirm-password"
                                                name="confirm-password"
                                                type={showConfirm ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                                                className={`w-full bg-white/60 dark:bg-white/5 border rounded-2xl py-3.5 px-5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none transition-all duration-300 text-sm font-medium ${confirmPassword && confirmPassword !== newPassword ? 'border-red-500/50' : confirmPassword ? 'border-emerald-500/50' : 'border-black/5 dark:border-white/5'}`}
                                                placeholder="••••••••"
                                                required
                                                autoComplete="new-password"
                                            />
                                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 hover:text-slate-600 dark:hover:text-white transition-colors">
                                                {showConfirm ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold animate-shake flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                                        {error}
                                    </div>
                                )}

                                <div className="flex flex-col md:flex-row items-center gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || newPassword !== confirmPassword || newPassword.length < 6 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)}
                                        className="flex-1 w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-bold rounded-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1 active:scale-[0.98] transition-all duration-500 disabled:opacity-40 disabled:hover:translate-y-0 disabled:shadow-none"
                                    >
                                        {isSubmitting ? 'Securing Account...' : 'Apply Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => logout()}
                                        className="py-3 px-6 text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] hover:text-slate-600 dark:hover:text-white transition-colors"
                                    >
                                        Exit to Login
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Compact Footer */}
                <div className="flex items-center justify-center gap-2 opacity-20 grayscale hover:grayscale-0 transition-colors py-2">
                    <Logo className="w-4 h-4" />
                    <span className="text-[9px] font-bold text-slate-900 dark:text-white tracking-widest uppercase">Powered by Lifewood PH</span>
                </div>
            </div>
        </div>
    );
};

export default ForceChangePasswordPage;
