import { useState, useEffect, useCallback } from 'react';

export type LandingPage = 'home' | 'dashboard' | 'overview';
export type WeekStartDay = 'sunday' | 'monday';
export type TimeFormat = '12h' | '24h';
export type TaskVisibility = 'always' | 'never' | 'recent';

export interface Preferences {
    landingPage: LandingPage;
    weekStartDay: WeekStartDay;
    timeFormat: TimeFormat;
    showCompletedTasks: TaskVisibility;
    performanceMode: boolean;
    autoCompleteRecurring: boolean;
    ignoreAbsentStatus: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
    landingPage: 'home',
    weekStartDay: 'sunday',
    timeFormat: '12h',
    showCompletedTasks: 'recent',
    performanceMode: false,
    autoCompleteRecurring: false,
    ignoreAbsentStatus: false,
};

export const usePreferences = (): [Preferences, (key: keyof Preferences, value: any) => void] => {
    const [preferences, setPreferences] = useState<Preferences>(() => {
        if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
        try {
            const stored = localStorage.getItem('userPreferences');
            return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
        } catch {
            return DEFAULT_PREFERENCES;
        }
    });

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'userPreferences' && e.newValue) {
                setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(e.newValue) });
            }
        };

        const handleCustomChange = (e: CustomEvent<Preferences>) => {
            setPreferences(e.detail);
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('preferences-changed', handleCustomChange as EventListener);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('preferences-changed', handleCustomChange as EventListener);
        };
    }, []);

    const updatePreference = useCallback((key: keyof Preferences, value: any) => {
        setPreferences((prev) => {
            const newPreferences = { ...prev, [key]: value };
            localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
            window.dispatchEvent(new CustomEvent('preferences-changed', { detail: newPreferences }));
            return newPreferences;
        });
    }, []);

    return [preferences, updatePreference];
};
