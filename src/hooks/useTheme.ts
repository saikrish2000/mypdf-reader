import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'contrast';

export const THEMES: { value: Theme; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Warm paper background' },
  { value: 'dark', label: 'Dark', description: 'Easy on the eyes at night' },
  { value: 'contrast', label: 'High Contrast', description: 'Maximum readability' },
];

const THEME_CLASSES: Record<Theme, string | null> = {
  light: null,
  dark: 'dark',
  contrast: 'contrast',
};

const isTheme = (v: unknown): v is Theme =>
  v === 'light' || v === 'dark' || v === 'contrast';

function getSavedTheme(): Theme {
  try {
    const saved = localStorage.getItem('pdf-reader-theme');
    if (saved === 'sepia') return 'light';
    if (isTheme(saved)) return saved;
  } catch {
    // ignore localStorage errors
  }
  return 'dark';
}

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(getSavedTheme);

  useEffect(() => {
    const root = document.documentElement;
    Object.values(THEME_CLASSES).forEach(c => c && root.classList.remove(c));
    root.classList.remove('sepia');
    const cls = THEME_CLASSES[theme];
    if (cls) root.classList.add(cls);
    try { localStorage.setItem('pdf-reader-theme', theme); } catch {
      // ignore localStorage errors
    }
  }, [theme]);

  // Apply theme synchronously before paint to prevent FOUC
  useEffect(() => {
    const root = document.documentElement;
    try {
      const saved = localStorage.getItem('pdf-reader-theme');
      const resolved = saved === 'sepia' ? 'light' : saved;
      if (resolved && resolved !== theme && isTheme(resolved)) {
        Object.values(THEME_CLASSES).forEach(c => c && root.classList.remove(c));
        root.classList.remove('sepia');
        const cls = THEME_CLASSES[resolved];
        if (cls) root.classList.add(cls);
      }
    } catch {
      // ignore localStorage read errors
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const order: Theme[] = ['light', 'dark', 'contrast'];
      const idx = order.indexOf(prev);
      return order[(idx + 1) % order.length];
    });
  }, []);

  return { theme, toggleTheme, setTheme };
};
