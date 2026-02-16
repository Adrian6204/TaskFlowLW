import { Position } from '../types';

export const isLeadership = (position?: string | Position): boolean => {
    if (!position) return false;

    const leadershipRoles = [
        Position.FOUNDER,
        Position.CEO,
        Position.MANAGING_DIRECTOR,
        Position.ADMIN,
        Position.HR_ASSISTANT
    ];

    return leadershipRoles.includes(position as Position);
};
