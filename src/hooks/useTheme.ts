import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'sepia' | 'contrast';

export const THEMES: { value: Theme; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Warm paper background' },
  { value: 'dark', label: 'Dark', description: 'Easy on the eyes at night' },
  { value: 'sepia', label: 'Sepia', description: 'Classic book tones' },
  { value: 'contrast', label: 'High Contrast', description: 'Maximum readability' },
];

const THEME_CLASSES: Record<Theme, string | null> = {
  light: null,
  dark: 'dark',
  sepia: 'sepia',
  contrast: 'contrast',
};

const isTheme = (v: unknown): v is Theme =>
  v === 'light' || v === 'dark' || v === 'sepia' || v === 'contrast';

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('pdf-reader-theme');
    if (isTheme(saved)) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes, then apply current
    Object.values(THEME_CLASSES).forEach(c => c && root.classList.remove(c));
    const cls = THEME_CLASSES[theme];
    if (cls) root.classList.add(cls);
    localStorage.setItem('pdf-reader-theme', theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  // Cycle through themes (kept for backwards compat with onToggleTheme callers)
  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const order: Theme[] = ['light', 'dark', 'sepia', 'contrast'];
      const idx = order.indexOf(prev);
      return order[(idx + 1) % order.length];
    });
  }, []);

  return { theme, toggleTheme, setTheme };
};
