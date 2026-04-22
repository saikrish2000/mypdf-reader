import React from 'react';
import { Moon, Sun, BookOpen, Contrast, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { THEMES, type Theme } from '@/hooks/useTheme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void; // legacy: cycles themes
  onSelect?: (theme: Theme) => void;
  className?: string;
  variant?: 'default' | 'toolbar';
}

const THEME_ICONS: Record<Theme, React.ComponentType<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  sepia: BookOpen,
  contrast: Contrast,
};

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle, onSelect, className, variant = 'default' }) => {
  const ActiveIcon = THEME_ICONS[theme];

  // If no onSelect is provided, fall back to single-button cycle behavior
  if (!onSelect) {
    return (
      <button
        onClick={onToggle}
        className={cn(
          'relative p-2 rounded-lg transition-all duration-300',
          variant === 'toolbar'
            ? 'hover:bg-toolbar-foreground/10 text-toolbar-foreground'
            : 'hover:bg-secondary text-foreground',
          className
        )}
        title={`Theme: ${theme} (click to cycle)`}
        aria-label="Cycle theme"
      >
        <ActiveIcon className="w-5 h-5" />
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'p-2 rounded-lg transition-all duration-300',
            variant === 'toolbar'
              ? 'hover:bg-toolbar-foreground/10 text-toolbar-foreground'
              : 'hover:bg-secondary text-foreground',
            className
          )}
          title="Reading theme"
          aria-label="Choose reading theme"
        >
          <ActiveIcon className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Reading theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map(({ value, label, description }) => {
          const Icon = THEME_ICONS[value];
          const active = theme === value;
          return (
            <DropdownMenuItem
              key={value}
              onClick={() => onSelect(value)}
              className="flex items-start gap-3 cursor-pointer py-2"
            >
              <Icon className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium flex items-center gap-2">
                  {label}
                  {active && <Check className="w-3.5 h-3.5 text-accent" />}
                </div>
                <div className="text-xs text-muted-foreground truncate">{description}</div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
