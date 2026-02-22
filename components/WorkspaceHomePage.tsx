import React, { useState } from 'react';
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

const WorkspaceHomePage: React.FC<WorkspaceHomePageProps> = ({
    spaces,
    user,
    onSelectSpace,
    onCreateSpace,
    onJoinSpace,
    memberships,
}) => {
    const isSuperAdmin = user.role === 'super_admin' || user.isAdmin;

    const getUserRoleInSpace = (spaceId: string): string => {
        if (isSuperAdmin) return 'Super Admin';
        const membership = memberships.find(m => m.space_id === spaceId && m.user_id === user.employeeId);
        if (!membership) return 'Member';
        return membership.role === 'admin' ? 'Admin' : 'Member';
    };

    const getRoleBadgeStyle = (role: string) => {
        if (role === 'Super Admin') return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
        if (role === 'Admin') return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    };

    // Decorative colors for workspace cards
    const cardAccents = [
        'from-violet-500 to-purple-600',
        'from-sky-500 to-blue-600',
        'from-emerald-500 to-teal-600',
        'from-rose-500 to-pink-600',
        'from-amber-500 to-orange-600',
        'from-indigo-500 to-blue-700',
        'from-lime-500 to-green-600',
        'from-fuchsia-500 to-pink-700',
    ];

    const now = new Date();
    const hour = now.getHours();
    const greeting =
        hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="min-h-full px-2 py-6">
            {/* Header */}
            <div className="mb-10">
                <p className="text-sm font-semibold text-white/40 uppercase tracking-widest mb-1">
                    {greeting},
                </p>
                <h1 className="text-4xl font-black text-white mb-1">
                    {user.fullName || user.username}
                </h1>
                <p className="text-white/40 text-sm font-medium">
                    {spaces.length === 0
                        ? 'You haven\'t joined any workspaces yet.'
                        : `You are a member of ${spaces.length} workspace${spaces.length === 1 ? '' : 's'}.`}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mb-10">
                {isSuperAdmin && (
                    <button
                        onClick={onCreateSpace}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-lime-500 to-emerald-500 text-black text-sm font-black shadow-lg shadow-lime-500/20 hover:shadow-lime-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Create Workspace
                    </button>
                )}
                <button
                    onClick={onJoinSpace}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-sm text-white text-sm font-bold border border-white/10 hover:bg-white/15 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                >
                    <UserIcon className="w-4 h-4" />
                    Join with Code
                </button>
            </div>

            {/* Workspace Cards Grid */}
            {spaces.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {spaces.map((space, idx) => {
                        const role = getUserRoleInSpace(space.id);
                        const accent = cardAccents[idx % cardAccents.length];
                        const memberCount = space.members.length;
                        const isOwner = space.ownerId === user.employeeId || isSuperAdmin;

                        return (
                            <button
                                key={space.id}
                                onClick={() => onSelectSpace(space.id)}
                                className="group relative text-left bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 rounded-[28px] p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/30 active:scale-[0.99] overflow-hidden"
                            >
                                {/* Gradient top bar */}
                                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent} rounded-t-[28px]`} />

                                {/* Icon / Initial */}
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center mb-4 shadow-lg`}>
                                    <span className="text-white text-xl font-black">
                                        {space.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>

                                {/* Name */}
                                <h3 className="text-white font-black text-lg leading-tight mb-1 truncate group-hover:text-white transition-colors">
                                    {space.name}
                                </h3>

                                {/* Description */}
                                {space.description && (
                                    <p className="text-white/40 text-xs font-medium mb-3 line-clamp-2 leading-relaxed">
                                        {space.description}
                                    </p>
                                )}

                                {/* Meta */}
                                <div className="flex items-center justify-between mt-3">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${getRoleBadgeStyle(role)}`}>
                                        {role}
                                    </span>
                                    <span className="text-white/30 text-xs font-bold">
                                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
                                    </span>
                                </div>

                                {/* Join Code (visible to owner/super_admin) */}
                                {isOwner && space.joinCode && (
                                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Join Code</span>
                                        <span
                                            className="text-white/60 font-mono text-xs font-bold bg-white/5 px-2 py-0.5 rounded-lg cursor-text select-all"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {space.joinCode}
                                        </span>
                                    </div>
                                )}

                                {/* Arrow hint */}
                                <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/8 flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className="text-white font-black text-2xl mb-2">No Workspaces Yet</h3>
                    <p className="text-white/40 text-sm font-medium max-w-xs mb-8">
                        {isSuperAdmin
                            ? 'Create your first workspace or join one using a code.'
                            : 'Ask your team lead for a workspace join code to get started.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {isSuperAdmin && (
                            <button
                                onClick={onCreateSpace}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-lime-500 to-emerald-500 text-black text-sm font-black shadow-lg shadow-lime-500/20 hover:shadow-lime-500/40 hover:scale-[1.02] transition-all duration-300"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Create Workspace
                            </button>
                        )}
                        <button
                            onClick={onJoinSpace}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 text-white text-sm font-bold border border-white/10 hover:bg-white/15 hover:scale-[1.02] transition-all duration-300"
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
