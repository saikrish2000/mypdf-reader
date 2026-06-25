import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Theme } from '@/hooks/useTheme';
import { getHeroConfig } from './heroThemeConfig';
import SplineLoader from './SplineLoader';
import DemoWorkspace from '@/components/landing/sections/DemoWorkspace';
import { useMinLg } from '@/hooks/use-mobile';
import { demoContent } from '@/lib/landing/content';

export const ROBOT_SCENE_URL = 'https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode';

const OVERLAY_CARD_WIDTH = 'w-[min(100%,28rem)]';
/** Title bar h-7 + body h-[104px] */
const OVERLAY_CARD_HEIGHT = 'h-[132px]';

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

interface HeroLivePreviewProps {
  theme: Theme;
  className?: string;
}

export default function HeroLivePreview({ theme, className }: HeroLivePreviewProps) {
  const config = getHeroConfig(theme);
  const prefersReducedMotion = usePrefersReducedMotion();
  const minLg = useMinLg();
  const showSpline = config.showSpline && !prefersReducedMotion && minLg;

  return (
    <div
      className={cn(
        'relative h-full min-h-[200px] overflow-hidden rounded-2xl border border-border glow-accent',
        className,
      )}
    >
      {showSpline ? (
        <>
          <SplineLoader scene={ROBOT_SCENE_URL} className="absolute inset-0 z-0 h-full w-full" />
          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-accent/15 via-muted/40 to-background" />
      )}

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center p-3 sm:p-4">
        <div
          className={cn(
            OVERLAY_CARD_WIDTH,
            'overflow-hidden rounded-lg border border-border/80 bg-card/95 shadow-elevated backdrop-blur-md',
          )}
        >
          <div className={OVERLAY_CARD_HEIGHT}>
            <DemoWorkspace variant="heroPanel" embedded />
          </div>
        </div>
        <p className="mt-2 max-w-sm text-center text-[10px] leading-tight text-muted-foreground sm:text-xs">
          {demoContent.demoHint}
        </p>
      </div>
    </div>
  );
}
