import React, { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookCoverProps {
  title: string;
  spineColor?: string;
  thumbnail?: string;
  progress?: number;
  className?: string;
}

function hashHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h) % 360;
}

const BookCover: React.FC<BookCoverProps> = ({
  title,
  spineColor,
  thumbnail,
  progress = 0,
  className,
}) => {
  const hue = useMemo(() => hashHue(title), [title]);
  const spine = spineColor ?? `hsl(${hue} 42% 32%)`;
  const initial = title.charAt(0).toUpperCase();

  return (
    <div className={cn('relative flex h-full w-full', className)}>
      <div
        className="relative w-2.5 sm:w-3 shrink-0 rounded-l-[2px] shadow-[inset_-2px_0_4px_rgba(0,0,0,0.35)]"
        style={{ background: spine }}
      >
        <div className="absolute inset-y-2 left-0.5 w-px bg-white/15" />
      </div>

      <div
        className={cn(
          'relative flex-1 overflow-hidden rounded-r-[3px] border border-black/15 shadow-[2px_4px_12px_rgba(0,0,0,0.2)]',
          !thumbnail && 'bg-muted',
        )}
        style={thumbnail ? { background: spine } : undefined}
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 opacity-40 mb-1" strokeWidth={1.5} />
            <span className="text-sm sm:text-base font-serif font-semibold opacity-60">{initial}</span>
          </div>
        )}

        <div className="absolute right-0 top-1 bottom-1 w-[2px] bg-gradient-to-r from-white/30 to-white/5 pointer-events-none" />

        {progress > 0 && (
          <div
            className="absolute top-0 right-0 w-2.5 h-7 bg-accent shadow-sm pointer-events-none"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)',
              opacity: 0.5 + (progress / 100) * 0.5,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default BookCover;
