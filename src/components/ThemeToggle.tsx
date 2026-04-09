import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
  className?: string;
  variant?: 'default' | 'toolbar';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle, className, variant = 'default' }) => {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative p-2 rounded-lg transition-all duration-300",
        variant === 'toolbar'
          ? "hover:bg-toolbar-foreground/10 text-toolbar-foreground"
          : "hover:bg-secondary text-foreground",
        className
      )}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Sun className={cn(
        "w-5 h-5 transition-all duration-300 absolute inset-0 m-auto",
        isDark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
      )} />
      <Moon className={cn(
        "w-5 h-5 transition-all duration-300",
        isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
      )} />
    </button>
  );
};

export default ThemeToggle;
