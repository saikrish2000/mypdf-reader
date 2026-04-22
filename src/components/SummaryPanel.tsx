import React from 'react';
import { X, Sparkles, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pageNumber: number;
  summary: string | null;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
}

const SummaryPanel: React.FC<Props> = ({
  isOpen,
  onClose,
  pageNumber,
  summary,
  isLoading,
  error,
  onRegenerate,
}) => {
  const isRateLimit = !!error && /busy|rate limit|try again/i.test(error);

  return (
    <aside
      className={cn(
        'fixed top-0 right-0 z-40 h-full w-full sm:w-96 bg-card border-l border-border shadow-2xl',
        'transition-transform duration-300 ease-in-out flex flex-col',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
      aria-hidden={!isOpen}
    >
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-md bg-accent/10 shrink-0">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">AI Summary</h3>
            <p className="text-xs text-muted-foreground">Page {pageNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="p-2 rounded-md hover:bg-secondary active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Regenerate"
            aria-label="Regenerate summary"
          >
            <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isLoading && 'animate-spin')} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-secondary active:scale-95 transition-all"
            title="Close"
            aria-label="Close summary panel"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="space-y-4" aria-busy="true" aria-live="polite">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              <p className="text-xs">Reading and summarizing this page…</p>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="space-y-2 pt-3">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-10/12" />
              <Skeleton className="h-3 w-9/12" />
            </div>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  {isRateLimit ? 'AI is busy right now' : 'Could not generate summary'}
                </p>
                <p className="text-xs text-destructive/80 leading-relaxed">{error}</p>
              </div>
            </div>
            <button
              onClick={onRegenerate}
              disabled={isLoading}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium',
                'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                'active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && summary && (
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        )}

        {!isLoading && !error && !summary && (
          <div className="text-sm text-muted-foreground text-center mt-8 px-4 leading-relaxed">
            Click the sparkle icon in the toolbar to generate an AI summary of the current page.
          </div>
        )}
      </div>
    </aside>
  );
};

export default SummaryPanel;
