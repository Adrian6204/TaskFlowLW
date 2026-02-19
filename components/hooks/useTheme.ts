
import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';
export type ColorScheme = 'indigo' | 'emerald' | 'rose' | 'amber' | 'violet' | 'sky';

const COLOR_PALETTES: Record<ColorScheme, Record<number, string>> = {
  indigo: {
    50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
    400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
    800: '#3730a3', 900: '#312e81', 950: '#1e1b4b'
  },
  emerald: {
    50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
    400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
    800: '#065f46', 900: '#064e3b', 950: '#022c22'
  },
  rose: {
    50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af',
    400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c',
    800: '#9f1239', 900: '#881337', 950: '#4c0519'
  },
  amber: {
    50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
    400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
    800: '#92400e', 900: '#78350f', 950: '#451a03'
  },
  violet: {
    50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
    400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9',
    800: '#5b21b6', 900: '#4c1d95', 950: '#2e1065'
  },
  sky: {
    50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc',
    400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1',
    800: '#075985', 900: '#0c4a6e', 950: '#082f49'
  }
};

export const useTheme = (): [Theme, () => void, ColorScheme, (scheme: ColorScheme) => void] => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    const storedTheme = localStorage.getItem('theme');
    return (storedTheme === 'dark' || storedTheme === 'light') ? storedTheme : 'light';
  });

  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    if (typeof window === 'undefined') return 'indigo';
    const storedScheme = localStorage.getItem('colorScheme');
    return (storedScheme && COLOR_PALETTES[storedScheme as ColorScheme]) ? (storedScheme as ColorScheme) : 'indigo';
  });



  const applyColorScheme = useCallback((scheme: ColorScheme) => {
    const palette = COLOR_PALETTES[scheme];
    const root = document.documentElement;
    Object.entries(palette).forEach(([shade, value]) => {
      root.style.setProperty(`--primary-${shade}`, value);
    });
  }, []);

  // Initial application of color scheme
  useEffect(() => {
    applyColorScheme(colorScheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      return newTheme;
    });
  }, []);

  const changeColorScheme = useCallback((newScheme: ColorScheme) => {
    setColorScheme(newScheme);
    localStorage.setItem('colorScheme', newScheme);
    applyColorScheme(newScheme);
  }, [applyColorScheme]);

  return [theme, toggleTheme, colorScheme, changeColorScheme];
};
