import React from 'react';
import { Play, Pause, Square, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  visible: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  currentPage: number;
  totalPages: number;
  rate: number;
  onPlayPause: () => void;
  onStop: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
}

const PlaybackControls: React.FC<Props> = ({
  visible,
  isPlaying,
  isPaused,
  currentPage,
  totalPages,
  rate,
  onPlayPause,
  onStop,
  onSkipBack,
  onSkipForward,
}) => {
  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40',
        'flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full',
        'bg-toolbar text-toolbar-foreground shadow-2xl border border-border/20',
        'animate-fade-in max-w-[95vw]'
      )}
    >
      <div className="hidden sm:flex items-center gap-2 px-2 text-xs text-toolbar-muted">
        <Volume2 className="w-3.5 h-3.5 text-accent" />
        <span>P{currentPage}/{totalPages}</span>
        <span className="opacity-60">· {rate}x</span>
      </div>

      <button
        onClick={onSkipBack}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-full hover:bg-toolbar-foreground/10 transition-colors"
        title="Back 10 seconds"
        aria-label="Skip back 10 seconds"
      >
        <SkipBack className="w-4 h-4" />
      </button>

      <button
        onClick={onPlayPause}
        className={cn(
          'flex items-center justify-center min-w-[48px] min-h-[48px] w-12 h-12 rounded-full transition-colors',
          isPlaying && !isPaused
            ? 'bg-accent text-accent-foreground hover:opacity-90'
            : 'bg-accent/20 text-accent hover:bg-accent/30'
        )}
        title={isPlaying && !isPaused ? 'Pause' : 'Resume'}
        aria-label={isPlaying && !isPaused ? 'Pause reading' : 'Resume reading'}
      >
        {isPlaying && !isPaused ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
      </button>

      <button
        onClick={onSkipForward}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-full hover:bg-toolbar-foreground/10 transition-colors"
        title="Forward 10 seconds"
        aria-label="Skip forward 10 seconds"
      >
        <SkipForward className="w-4 h-4" />
      </button>

      <button
        onClick={onStop}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] w-11 h-11 rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors"
        title="Stop"
        aria-label="Stop reading"
      >
        <Square className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PlaybackControls;
