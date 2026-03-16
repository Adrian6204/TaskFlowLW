import React, { createContext, useContext } from 'react';
import { usePresence, PresenceMap, PresenceStatus } from '../hooks/usePresence';

interface PresenceContextType {
  presenceMap: PresenceMap;
  myStatus: PresenceStatus;
  /** Helper: get another user's status — 'offline' if not in map */
  getStatus: (userId: string) => PresenceStatus;
}

const PresenceContext = createContext<PresenceContextType>({
  presenceMap: {},
  myStatus: 'offline',
  getStatus: () => 'offline',
});

export const PresenceProvider: React.FC<{
  userId: string | undefined;
  children: React.ReactNode;
}> = ({ userId, children }) => {
  const { presenceMap, myStatus } = usePresence(userId);

  const getStatus = (uid: string): PresenceStatus =>
    presenceMap[uid] ?? 'offline';

  return (
    <PresenceContext.Provider value={{ presenceMap, myStatus, getStatus }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresenceContext = (): PresenceContextType =>
  useContext(PresenceContext);

/** Utility: returns Tailwind bg color class for a given status */
export const statusColor = (status: PresenceStatus): string => {
  switch (status) {
    case 'online': return 'bg-lime-400';
    case 'idle':   return 'bg-amber-400';
    case 'offline': return 'bg-slate-400';
  }
};

/** Utility: human-readable label */
export const statusLabel = (status: PresenceStatus): string => {
  switch (status) {
    case 'online':  return 'Online';
    case 'idle':    return 'Idle';
    case 'offline': return 'Offline';
  }
};
