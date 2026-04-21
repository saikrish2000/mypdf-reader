import React from 'react';
import { X, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
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
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-accent/10">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Summary</h3>
            <p className="text-xs text-muted-foreground">Page {pageNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="p-2 rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
            title="Regenerate"
          >
            <RefreshCw className={cn('w-4 h-4 text-muted-foreground', isLoading && 'animate-spin')} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-secondary transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
            <p className="text-sm">Reading and summarizing this page…</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {!isLoading && !error && summary && (
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        )}

        {!isLoading && !error && !summary && (
          <div className="text-sm text-muted-foreground text-center mt-8">
            Click the sparkle icon in the toolbar to generate a summary of the current page.
          </div>
        )}
      </div>
    </aside>
  );
};

export default SummaryPanel;
