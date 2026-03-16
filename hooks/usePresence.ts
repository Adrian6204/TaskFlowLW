import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

export type PresenceStatus = 'online' | 'idle' | 'offline';

export interface PresenceState {
  userId: string;
  status: PresenceStatus;
}

// Map of userId → status for all connected users
export type PresenceMap = Record<string, PresenceStatus>;

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const PRESENCE_CHANNEL = 'taskflow:presence';

export function usePresence(userId: string | undefined) {
  const [presenceMap, setPresenceMap] = useState<PresenceMap>({});
  const [myStatus, setMyStatus] = useState<PresenceStatus>('online');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myStatusRef = useRef<PresenceStatus>('online');

  const updateMyStatus = useCallback(
    async (status: PresenceStatus) => {
      if (!channelRef.current || myStatusRef.current === status) return;
      myStatusRef.current = status;
      setMyStatus(status);
      await channelRef.current.track({ userId, status });
    },
    [userId]
  );

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    // If we were idle, come back online
    if (myStatusRef.current === 'idle') {
      updateMyStatus('online');
    }
    idleTimerRef.current = setTimeout(() => {
      updateMyStatus('idle');
    }, IDLE_TIMEOUT_MS);
  }, [updateMyStatus]);

  useEffect(() => {
    if (!userId) return;

    // Build the presence map from the current sync state
    const syncPresenceMap = (state: Record<string, unknown[]>) => {
      const map: PresenceMap = {};
      for (const presences of Object.values(state)) {
        for (const p of presences as unknown as PresenceState[]) {
          if (p.userId) {
            map[p.userId] = p.status ?? 'online';
          }
        }
      }
      setPresenceMap(map);
    };

    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: userId } },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        syncPresenceMap(channel.presenceState());
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        setPresenceMap((prev) => {
          const updated = { ...prev };
          for (const p of (newPresences as unknown as PresenceState[])) {
            if (p.userId) updated[p.userId] = p.status ?? 'online';
          }
          return updated;
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        setPresenceMap((prev) => {
          const updated = { ...prev };
          for (const p of (leftPresences as unknown as PresenceState[])) {
            if (p.userId) delete updated[p.userId];
          }
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId, status: 'online' });
          myStatusRef.current = 'online';
          setMyStatus('online');
        }
      });

    // Activity listeners for idle detection
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach((evt) =>
      window.addEventListener(evt, resetIdleTimer, { passive: true })
    );
    resetIdleTimer();

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [userId, resetIdleTimer]);

  return { presenceMap, myStatus };
}
