import { useEffect, useState } from 'react';
import { Sparkles, MessageCircle, BookOpen, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Theme } from '@/hooks/useTheme';
import { getHeroConfig } from './heroThemeConfig';
import SplineLoader from './SplineLoader';
import HeroAppPreview from './HeroAppPreview';

const SPLINE_SCENE_URL = 'https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode';

const FALLBACK_ICONS = [Sparkles, MessageCircle, BookOpen, Volume2] as const;

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const onChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return prefersReducedMotion;
}

interface HeroSceneProps {
  theme: Theme;
  className?: string;
  variant?: 'card' | 'full';
}

function StaticFallback() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <div className="flex flex-wrap justify-center gap-2">
        {FALLBACK_ICONS.map((Icon) => (
          <div
            key={Icon.name}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted/50"
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </div>
      <p className="type-caption text-muted-foreground">Your study assistant</p>
    </div>
  );
}

export default function HeroScene({ theme, className, variant = 'card' }: HeroSceneProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const config = getHeroConfig(theme);
  const showAppPreview = config.showAppPreview && !prefersReducedMotion;
  const showSpline = config.showSpline && !prefersReducedMotion && !showAppPreview;
  const isFull = variant === 'full';

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted/20',
        !isFull && 'rounded-lg border border-border',
        className,
      )}
    >
      {showAppPreview ? (
        <HeroAppPreview />
      ) : showSpline ? (
        <>
          <SplineLoader
            scene={SPLINE_SCENE_URL}
            className="absolute inset-0 z-0 w-full h-full"
            style={'splineFilter' in config && config.splineFilter ? { filter: config.splineFilter } : undefined}
          />
          <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-t from-background/70 via-transparent to-transparent" />
          {isFull && (
            <div className="absolute bottom-0 left-0 right-0 z-10 p-6 sm:p-8 pointer-events-none">
              <p className="text-sm font-medium text-foreground">Your study assistant</p>
              <p className="type-caption mt-0.5">Drag to explore</p>
            </div>
          )}
        </>
      ) : (
        <StaticFallback />
      )}
    </div>
  );
}
