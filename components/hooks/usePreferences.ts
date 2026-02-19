import { useState, useEffect } from 'react';

export type LandingPage = 'home' | 'dashboard' | 'overview';
export type WeekStartDay = 'sunday' | 'monday';
export type TimeFormat = '12h' | '24h';
export type TaskVisibility = 'always' | 'never' | 'recent';

export interface Preferences {
    landingPage: LandingPage;
    weekStartDay: WeekStartDay;
    timeFormat: TimeFormat;
    showCompletedTasks: TaskVisibility;
}

const DEFAULT_PREFERENCES: Preferences = {
    landingPage: 'home',
    weekStartDay: 'sunday',
    timeFormat: '12h',
    showCompletedTasks: 'recent',
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

    const updatePreference = (key: keyof Preferences, value: any) => {
        setPreferences((prev) => {
            const newPreferences = { ...prev, [key]: value };
            localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
            return newPreferences;
        });
    };

    return [preferences, updatePreference];
};
