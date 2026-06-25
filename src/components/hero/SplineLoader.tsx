import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { PanelErrorBoundary } from '@/components/PanelErrorBoundary';

const Spline = lazy(() => import('@splinetool/react-spline'));

interface SplineLoaderProps {
  scene: string;
  className?: string;
  style?: React.CSSProperties;
}

function SplineFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-card/80 p-6 text-center">
      <p className="text-sm font-medium text-foreground">3D preview unavailable</p>
      <p className="text-xs text-muted-foreground">You can still upload and read PDFs normally.</p>
    </div>
  );
}

function SplineLoader({ scene, className, style }: SplineLoaderProps) {
  return (
    <PanelErrorBoundary name="3D Hero" fallback={<SplineFallback />}>
      <Suspense
        fallback={
          <div className={`flex h-full w-full items-center justify-center bg-background ${className ?? ''}`}>
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        }
      >
        <Spline scene={scene} className={className} style={style} />
      </Suspense>
    </PanelErrorBoundary>
  );
}

export default SplineLoader;
