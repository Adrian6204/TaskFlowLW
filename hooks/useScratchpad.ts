import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import * as dataService from '../services/supabaseService';

export const useScratchpad = () => {
    const { user } = useAuth();
    const [note, setNote] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const lastSyncedNote = useRef<string>('');
    const syncTimeout = useRef<NodeJS.Timeout | null>(null);

    // Initial load from cloud or localStorage
    useEffect(() => {
        const loadInitialNote = async () => {
            if (!user?.employeeId) {
                // Fallback to localStorage if no user
                const saved = localStorage.getItem('scratchpad_note') || '';
                setNote(saved);
                lastSyncedNote.current = saved;
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const cloudContent = await dataService.getScratchpad(user.employeeId);
                setNote(cloudContent);
                lastSyncedNote.current = cloudContent;
                // Also cache in localStorage
                localStorage.setItem('scratchpad_note', cloudContent);
            } catch (err) {
                console.error('Failed to load scratchpad from cloud', err);
                const saved = localStorage.getItem('scratchpad_note') || '';
                setNote(saved);
                lastSyncedNote.current = saved;
            } finally {
                setLoading(false);
            }
        };

        loadInitialNote();
    }, [user?.employeeId]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (syncTimeout.current) clearTimeout(syncTimeout.current);
        };
    }, []);

    const updateNote = (newNote: string) => {
        setNote(newNote);
        localStorage.setItem('scratchpad_note', newNote);

        if (!user?.employeeId || loading) return;

        // Clear existing timeout
        if (syncTimeout.current) clearTimeout(syncTimeout.current);

        // Debounce sync to cloud
        syncTimeout.current = setTimeout(async () => {
            if (newNote === lastSyncedNote.current) return;

            try {
                await dataService.syncScratchpad(user.employeeId, newNote);
                lastSyncedNote.current = newNote;
            } catch (err) {
                console.error('Failed to sync scratchpad to cloud', err);
            }
        }, 1000);
    };

    return { note, updateNote, loading };
};
