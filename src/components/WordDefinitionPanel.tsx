import React from 'react';
import { X, BookOpen, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export interface WordDefinition {
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  meanings?: { definition: string; example?: string; domain?: string }[];
  etymology?: string;
  synonyms?: string[];
  antonyms?: string[];
  contextualNote?: string;
  raw?: string; // fallback if JSON parse failed
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  word: string | null;
  definition: WordDefinition | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const WordDefinitionPanel: React.FC<Props> = ({
  isOpen, onClose, word, definition, isLoading, error, onRetry,
}) => {
  return (
    <aside
      className={cn(
        'fixed top-0 right-0 z-40 h-full w-full sm:w-[400px] bg-card border-l border-border shadow-2xl',
        'transition-transform duration-300 ease-in-out flex flex-col',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      )}
      aria-hidden={!isOpen}
    >
      <header className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-md bg-accent/10 shrink-0">
            <BookOpen className="w-4 h-4 text-accent" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {word ? `"${word}"` : 'Word Definition'}
            </h3>
            <p className="text-xs text-muted-foreground">AI-powered dictionary</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!isLoading && (
            <button
              onClick={onRetry}
              className="p-2 rounded-md hover:bg-secondary active:scale-95 transition-all"
              title="Look up again"
              aria-label="Retry"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-secondary active:scale-95 transition-all"
            title="Close"
            aria-label="Close definition panel"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4" aria-busy="true">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              <p className="text-xs">Looking up definition…</p>
            </div>
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <div className="space-y-2 pt-2">
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-10/12" />
            </div>
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">Could not fetch definition</p>
                <p className="text-xs text-destructive/80 leading-relaxed">{error}</p>
              </div>
            </div>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try again
            </button>
          </div>
        )}

        {/* Raw fallback */}
        {!isLoading && !error && definition?.raw && (
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{definition.raw}</p>
        )}

        {/* Structured definition */}
        {!isLoading && !error && definition && !definition.raw && (
          <div className="space-y-5">
            {/* Word + phonetic + part of speech */}
            <div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl font-bold text-foreground">{definition.word}</span>
                {definition.phonetic && (
                  <span className="text-sm text-muted-foreground font-mono">{definition.phonetic}</span>
                )}
              </div>
              {definition.partOfSpeech && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                  {definition.partOfSpeech}
                </span>
              )}
            </div>

            {/* Meanings */}
            {definition.meanings && definition.meanings.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Meanings
                </h4>
                <ol className="space-y-3">
                  {definition.meanings.map((m, i) => (
                    <li key={i} className="space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-accent mt-0.5 shrink-0">{i + 1}.</span>
                        <div className="space-y-1">
                          {m.domain && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium uppercase tracking-wide">
                              {m.domain}
                            </span>
                          )}
                          <p className="text-sm text-foreground leading-relaxed">{m.definition}</p>
                          {m.example && (
                            <p className="text-xs text-muted-foreground italic border-l-2 border-accent/30 pl-2">
                              "{m.example}"
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Contextual note */}
            {definition.contextualNote && (
              <div className="rounded-lg bg-accent/5 border border-accent/20 p-3 space-y-1">
                <h4 className="text-xs font-semibold text-accent uppercase tracking-wider">In this context</h4>
                <p className="text-sm text-foreground leading-relaxed">{definition.contextualNote}</p>
              </div>
            )}

            {/* Etymology */}
            {definition.etymology && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Etymology</h4>
                <p className="text-sm text-foreground leading-relaxed">{definition.etymology}</p>
              </div>
            )}

            {/* Synonyms */}
            {definition.synonyms && definition.synonyms.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Synonyms</h4>
                <div className="flex flex-wrap gap-1.5">
                  {definition.synonyms.map((s) => (
                    <span key={s} className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Antonyms */}
            {definition.antonyms && definition.antonyms.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Antonyms</h4>
                <div className="flex flex-wrap gap-1.5">
                  {definition.antonyms.map((a) => (
                    <span key={a} className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && !definition && (
          <p className="text-sm text-muted-foreground text-center mt-8 px-4 leading-relaxed">
            Select a single word in the PDF and tap <strong>Define</strong> to look it up.
          </p>
        )}
      </div>
    </aside>
  );
};

export default WordDefinitionPanel;
