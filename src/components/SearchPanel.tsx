import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/hooks/useFullTextSearch';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => SearchResult[];
  indexReady: boolean;
  indexProgress: number;
  onJumpToPage: (page: number) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  isOpen,
  onClose,
  onSearch,
  indexReady,
  indexProgress,
  onJumpToPage,
}) => {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(() => (debounced.trim() ? onSearch(debounced) : []), [debounced, onSearch, indexReady]);

  if (!isOpen) return null;

  const highlightSnippet = (snippet: string, q: string) => {
    if (!q) return snippet;
    const lower = snippet.toLowerCase();
    const needle = q.toLowerCase();
    const idx = lower.indexOf(needle);
    if (idx === -1) return snippet;
    return (
      <>
        {snippet.slice(0, idx)}
        <mark className="bg-accent/40 text-foreground rounded px-0.5">
          {snippet.slice(idx, idx + q.length)}
        </mark>
        {snippet.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div
      className={cn(
        'fixed top-0 right-0 z-40 h-full w-full sm:w-[400px] bg-card border-l border-border shadow-2xl',
        'flex flex-col animate-fade-in',
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">Search</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-foreground/10 transition-colors"
          aria-label="Close search"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search in document…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(
              'w-full pl-9 pr-9 py-2 text-sm rounded-lg',
              'bg-muted text-foreground border border-border',
              'focus:outline-none focus:border-accent transition-colors',
            )}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-foreground/10"
              aria-label="Clear"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {!indexReady && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Indexing pages… {Math.round(indexProgress * 100)}%
          </div>
        )}
        {indexReady && debounced && (
          <p className="mt-2 text-xs text-muted-foreground">
            {results.length} match{results.length === 1 ? '' : 'es'}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {!debounced && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Type to search across all pages.
          </div>
        )}
        {debounced && results.length === 0 && indexReady && (
          <div className="p-6 text-center text-sm text-muted-foreground">No matches found.</div>
        )}
        <ul className="divide-y divide-border">
          {results.map((r) => (
            <li key={`${r.page}-${r.resultIndex}`}>
              <button
                onClick={() => onJumpToPage(r.page)}
                className="w-full text-left px-4 py-3 hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-accent">Page {r.page}</span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3">
                  {highlightSnippet(r.snippet, debounced)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SearchPanel;
