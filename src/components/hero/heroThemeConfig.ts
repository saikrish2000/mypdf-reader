import type { Theme } from '@/hooks/useTheme';
import { heroContent } from '@/lib/landing/content';

export const HERO_THEME_CONFIG = {
  light: {
    showSpline: true,
    showAppPreview: true,
    headline: heroContent.headline,
    headlineAccent: heroContent.headlineAccent,
    subhead: heroContent.subhead,
    badgeLabel: heroContent.badge,
    useBlur: true,
  },
  dark: {
    showSpline: true,
    showAppPreview: true,
    headline: heroContent.headline,
    headlineAccent: heroContent.headlineAccent,
    subhead: heroContent.subhead,
    badgeLabel: heroContent.badge,
    useBlur: true,
  },
  contrast: {
    showSpline: true,
    showAppPreview: true,
    headline: 'Maximum clarity for focused study',
    headlineAccent: '',
    subhead: heroContent.subhead,
    badgeLabel: 'Accessible study mode',
    useBlur: false,
  },
} as const;

export type HeroThemeConfig = (typeof HERO_THEME_CONFIG)[keyof typeof HERO_THEME_CONFIG];

export function getHeroConfig(theme: Theme): HeroThemeConfig {
  return HERO_THEME_CONFIG[theme];
}
