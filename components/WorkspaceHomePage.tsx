import React, { useState, useEffect } from 'react';
import { User, Space } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { UserIcon } from './icons/UserIcon';

interface WorkspaceHomePageProps {
    spaces: Space[];
    user: User;
    onSelectSpace: (spaceId: string) => void;
    onCreateSpace: () => void;
    onJoinSpace: () => void;
    memberships: { space_id: string; user_id: string; role: string }[];
}

const cardAccents = [
    { from: 'from-violet-500', to: 'to-purple-600', shadow: 'shadow-violet-500/20', glow: 'group-hover:shadow-violet-500/30' },
    { from: 'from-sky-500', to: 'to-blue-600', shadow: 'shadow-sky-500/20', glow: 'group-hover:shadow-sky-500/30' },
    { from: 'from-emerald-500', to: 'to-teal-600', shadow: 'shadow-emerald-500/20', glow: 'group-hover:shadow-emerald-500/30' },
    { from: 'from-rose-500', to: 'to-pink-600', shadow: 'shadow-rose-500/20', glow: 'group-hover:shadow-rose-500/30' },
    { from: 'from-amber-500', to: 'to-orange-600', shadow: 'shadow-amber-500/20', glow: 'group-hover:shadow-amber-500/30' },
    { from: 'from-indigo-500', to: 'to-blue-700', shadow: 'shadow-indigo-500/20', glow: 'group-hover:shadow-indigo-500/30' },
    { from: 'from-lime-500', to: 'to-green-600', shadow: 'shadow-lime-500/20', glow: 'group-hover:shadow-lime-500/30' },
    { from: 'from-fuchsia-500', to: 'to-pink-700', shadow: 'shadow-fuchsia-500/20', glow: 'group-hover:shadow-fuchsia-500/30' },
];

const WorkspaceHomePage: React.FC<WorkspaceHomePageProps> = ({
    spaces, user, onSelectSpace, onCreateSpace, onJoinSpace, memberships,
}) => {
    const isSuperAdmin = user.role === 'super_admin' || user.isAdmin;
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Live clock
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const formatDateTime = (date: Date) => {
        const datePart = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const timePart = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        return `${datePart}  ·  ${timePart}`;
    };

    const getUserRoleInSpace = (spaceId: string) => {
        if (isSuperAdmin) return 'Super Admin';
        const m = memberships.find(m => m.space_id === spaceId && m.user_id === user.employeeId);
        return m?.role === 'admin' ? 'Admin' : 'Member';
    };

    const roleBadge = (role: string) => {
        if (role === 'Super Admin') return 'bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/25 dark:border-violet-400/25';
        if (role === 'Admin') return 'bg-amber-500/15  text-amber-600  dark:text-amber-300  border border-amber-500/25  dark:border-amber-400/25';
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/25 dark:border-emerald-400/25';
    };

    const copyCode = (e: React.MouseEvent, code: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const fullName = user.fullName || user.username;

    return (
        <div className="min-h-full px-6 py-10 max-w-7xl mx-auto">

            {/* ── Hero Header ────────────────────────────────────────────── */}
            <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                <div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mb-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-white/30">
                            {greeting}
                        </p>
                        <span className="w-px h-3 bg-slate-300 dark:bg-white/15 hidden sm:block" />
                        <p className="font-mono tabular-nums text-[11px] font-bold text-slate-400 dark:text-white/25">
                            {formatDateTime(now)}
                        </p>
                    </div>
                    <h1 className="text-6xl font-black leading-none tracking-tight mb-3">
                        <span className="bg-gradient-to-r from-lime-500 via-emerald-400 to-teal-500 bg-clip-text text-transparent [text-shadow:none] drop-shadow-[0_2px_20px_rgba(132,204,22,0.25)]">
                            {fullName}
                        </span>
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-white/40">
                        {spaces.length === 0
                            ? "You haven't joined any workspaces yet."
                            : `You have access to ${spaces.length} workspace${spaces.length !== 1 ? 's' : ''}.`}
                    </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 flex-shrink-0">
                    {isSuperAdmin && (
                        <button
                            onClick={onCreateSpace}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-lime-500 to-emerald-500 text-black text-sm font-black shadow-lg shadow-lime-500/25 hover:shadow-lime-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Create Workspace
                        </button>
                    )}
                    <button
                        onClick={onJoinSpace}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-surface border border-subtle text-primary text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/12 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shadow-sm"
                    >
                        <UserIcon className="w-4 h-4" />
                        Join with Code
                    </button>
                </div>
            </div>

            {/* ── Workspace Cards ────────────────────────────────────────── */}
            {spaces.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {spaces.map((space, idx) => {
                        const role = getUserRoleInSpace(space.id);
                        const accent = cardAccents[idx % cardAccents.length];
                        const isOwner = space.ownerId === user.employeeId || isSuperAdmin;

                        return (
                            <button
                                key={space.id}
                                onClick={() => onSelectSpace(space.id)}
                                className={`group relative text-left rounded-[28px] p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${accent.shadow} ${accent.glow} active:scale-[0.98] overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500`}
                            >
                                {/* Card background */}
                                <div className="absolute inset-0 bg-white/90 dark:bg-white/[0.06] backdrop-blur-sm rounded-[28px] border border-slate-200/80 dark:border-white/8 group-hover:border-slate-300 dark:group-hover:border-white/15 transition-colors duration-300" />

                                {/* Gradient top bar */}
                                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent.from} ${accent.to}`} />

                                {/* Subtle corner glow */}
                                <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${accent.from} ${accent.to} opacity-10 group-hover:opacity-20 transition-opacity duration-300 blur-xl`} />

                                <div className="relative p-6">
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${accent.from} ${accent.to} flex items-center justify-center mb-4 shadow-lg`}>
                                        <span className="text-white text-xl font-black">
                                            {space.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Name */}
                                    <h3 className="text-slate-900 dark:text-white font-black text-base leading-tight mb-1 truncate pr-6">
                                        {space.name}
                                    </h3>

                                    {/* Description */}
                                    {space.description && (
                                        <p className="text-slate-400 dark:text-white/40 text-xs font-medium line-clamp-2 leading-relaxed mb-3">
                                            {space.description}
                                        </p>
                                    )}

                                    {/* Footer row */}
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-white/6">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${roleBadge(role)}`}>
                                            {role}
                                        </span>
                                        <span className="text-slate-400 dark:text-white/30 text-xs font-bold flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {space.members.length}
                                        </span>
                                    </div>

                                    {/* Join Code */}
                                    {isOwner && space.joinCode && (
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-slate-400 dark:text-white/25 text-[10px] font-bold uppercase tracking-widest">Join Code</span>
                                            <button
                                                onClick={e => copyCode(e, space.joinCode!)}
                                                className="font-mono text-[11px] font-black px-3 py-1.5 rounded-xl bg-surface-2 border border-subtle text-primary hover:border-slate-300 dark:hover:border-white/20 transition-all duration-150 flex items-center gap-1.5 shadow-sm"
                                            >
                                                {copiedCode === space.joinCode ? (
                                                    <><svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> Copied!</>
                                                ) : (
                                                    <>{space.joinCode} <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Arrow hint */}
                                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                                        <svg className="w-3.5 h-3.5 text-slate-500 dark:text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                /* ── Empty State ─── */
                <div className="flex flex-col items-center justify-center py-28 text-center">
                    <div className="w-24 h-24 rounded-3xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/8 shadow-xl flex items-center justify-center mb-6">
                        <svg className="w-12 h-12 text-slate-300 dark:text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className="text-slate-900 dark:text-white font-black text-2xl mb-2">No Workspaces Yet</h3>
                    <p className="text-slate-400 dark:text-white/40 text-sm font-medium max-w-xs mb-8 leading-relaxed">
                        {isSuperAdmin
                            ? 'Create your first workspace to get your team started.'
                            : 'Ask your team lead for a join code to get started.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {isSuperAdmin && (
                            <button
                                onClick={onCreateSpace}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-lime-500 to-emerald-500 text-black text-sm font-black shadow-lg shadow-lime-500/25 hover:shadow-lime-500/40 hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Create Workspace
                            </button>
                        )}
                        <button
                            onClick={onJoinSpace}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-surface border border-subtle text-primary text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/12 hover:-translate-y-0.5 transition-all duration-200 shadow-sm"
                        >
                            <UserIcon className="w-4 h-4" />
                            Join with Code
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkspaceHomePage;
