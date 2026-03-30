export const isPresent = (status?: string): boolean =>
  status === 'present';

export const isLate = (status?: string): boolean =>
  status === 'late';

/**
 * Derives lateness from time_in. The API always returns "Present" regardless
 * of clock-in time, so late must be computed from the timestamp.
 * Cutoff: 9:05 AM PHT (UTC+8). time_in is ISO-8601 with any offset.
 */
export const isLateFromTimeIn = (time_in: string | null, cutoffHour = 9, cutoffMinute = 5): boolean => {
  if (!time_in) return false;
  const d = new Date(time_in);
  const phtHour = (d.getUTCHours() + 8) % 24;
  const phtMinute = d.getUTCMinutes();
  return phtHour > cutoffHour || (phtHour === cutoffHour && phtMinute > cutoffMinute);
};

export const isTimedOut = (status?: string): boolean =>
  status === 'timed_out';

export const isAbsent = (status?: string): boolean =>
  status === 'absent';

/** present and late are task-visible; absent and timed_out are not */
export const isActiveToday = (status?: string): boolean =>
  status === 'present' || status === 'late';

export const attendanceStatusColor = (status?: string): string => {
  switch (status) {
    case 'present':   return 'bg-lime-400';
    case 'late':      return 'bg-amber-400';
    case 'timed_out': return 'bg-blue-400';
    case 'absent':    return 'bg-red-400';
    default:          return 'bg-slate-400';
  }
};
