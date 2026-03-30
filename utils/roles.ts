import { Position } from '../types';

export const isLeadership = (position?: string | Position): boolean => {
    if (!position) return false;

    const leadershipRoles = [
        Position.FOUNDER_AND_CEO,
        Position.MANAGING_DIRECTOR,
        Position.ADMIN,
        Position.HR_ASSISTANT,
        Position.AI_EXECUTIVE,
    ];

    return leadershipRoles.includes(position as Position);
};
