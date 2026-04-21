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
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-40',
        'flex items-center gap-1 px-3 py-2 rounded-full',
        'bg-toolbar text-toolbar-foreground shadow-2xl border border-border/20',
        'animate-fade-in'
      )}
    >
      <div className="flex items-center gap-2 px-2 text-xs text-toolbar-muted">
        <Volume2 className="w-3.5 h-3.5 text-accent" />
        <span>P{currentPage}/{totalPages}</span>
        <span className="opacity-60">· {rate}x</span>
      </div>

      <div className="w-px h-5 bg-toolbar-foreground/20 mx-1" />

      <button
        onClick={onSkipBack}
        className="p-2 rounded-full hover:bg-toolbar-foreground/10 transition-colors"
        title="Back 10 seconds"
      >
        <SkipBack className="w-4 h-4" />
      </button>

      <button
        onClick={onPlayPause}
        className={cn(
          'p-2.5 rounded-full transition-colors',
          isPlaying && !isPaused
            ? 'bg-accent text-accent-foreground hover:opacity-90'
            : 'bg-accent/20 text-accent hover:bg-accent/30'
        )}
        title={isPlaying && !isPaused ? 'Pause' : 'Resume'}
      >
        {isPlaying && !isPaused ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </button>

      <button
        onClick={onSkipForward}
        className="p-2 rounded-full hover:bg-toolbar-foreground/10 transition-colors"
        title="Forward 10 seconds"
      >
        <SkipForward className="w-4 h-4" />
      </button>

      <button
        onClick={onStop}
        className="p-2 rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors"
        title="Stop"
      >
        <Square className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PlaybackControls;
