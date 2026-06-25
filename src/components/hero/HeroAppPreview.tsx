import { cn } from '@/lib/utils';

interface HeroAppPreviewProps {
  compact?: boolean;
}

function HeroAppPreview({ compact }: HeroAppPreviewProps) {
  return (
    <div className={cn('relative w-full bg-card', compact ? 'p-3' : 'p-4 sm:p-5')}>
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />
      <div className="flex items-center justify-between border-b border-border pb-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="h-2 w-2 rounded-full bg-green-400" />
        </div>
        <span className="font-mono text-[10px]">mypdf.reader</span>
      </div>
      <div className={cn('mt-3 grid gap-2', compact ? 'grid-cols-[1fr_100px]' : 'grid-cols-[1fr_140px]')}>
        <div className="space-y-1.5">
          <div className="h-2 w-3/4 rounded bg-muted" />
          <div className="h-2 w-full rounded bg-muted/70" />
          <div className={cn('rounded-md border border-border bg-paper shadow-document', compact ? 'h-16' : 'h-24')} />
          <div className="h-2 w-2/3 rounded bg-muted/60" />
        </div>
        <div className="rounded-md border border-border bg-muted/30 p-1.5 space-y-1.5">
          <p className="text-[9px] font-semibold text-accent uppercase tracking-wide">AI</p>
          <div className="h-1.5 w-full rounded bg-accent/20" />
          <div className="h-1.5 w-4/5 rounded bg-accent/15" />
          <div className="mt-2 h-4 rounded bg-accent/10 border border-accent/20" />
        </div>
      </div>
    </div>
  );
}

export default HeroAppPreview;
