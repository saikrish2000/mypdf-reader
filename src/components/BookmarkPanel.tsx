import React, { useState } from 'react';
import { BookmarkPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Bookmark as BookmarkType } from '@/hooks/usePDFStorage';

// Ribbon colors that cycle for visual variety
const RIBBON_COLORS = [
  'from-red-600 to-red-700',
  'from-amber-600 to-amber-700',
  'from-emerald-600 to-emerald-700',
  'from-blue-600 to-blue-700',
  'from-violet-600 to-violet-700',
  'from-rose-600 to-rose-700',
];

interface BookmarkPanelProps {
  bookmarks: BookmarkType[];
  currentPage: number;
  isCurrentPageBookmarked: boolean;
  onAddBookmark: (label: string) => void;
  onRemoveBookmark: (page: number) => void;
  onGoToBookmark: (page: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const BookmarkPanel: React.FC<BookmarkPanelProps> = ({
  bookmarks,
  currentPage,
  isCurrentPageBookmarked,
  onAddBookmark,
  onRemoveBookmark,
  onGoToBookmark,
  isOpen,
  onClose,
}) => {
  const [newLabel, setNewLabel] = useState('');

  const handleAdd = () => {
    const label = newLabel.trim() || `Page ${currentPage}`;
    onAddBookmark(label);
    setNewLabel('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      "fixed right-0 top-0 bottom-0 z-20 flex flex-col",
      "w-[280px] animate-fade-in",
      "bookmark-panel"
    )}>
      {/* Leather-textured header */}
      <div className="bookmark-panel-header px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Book ribbon icon */}
            <div className="w-5 h-7 rounded-sm bg-gradient-to-b from-red-600 to-red-700 shadow-sm relative">
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-red-800/40"
                style={{ clipPath: 'polygon(0 0, 50% 100%, 100% 0)' }} />
            </div>
            <span className="text-sm font-serif font-semibold tracking-wide text-foreground">
              Bookmarks
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-foreground/10 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Decorative spine edge */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Add bookmark area */}
      <div className="px-4 py-3 bookmark-panel-add">
        {isCurrentPageBookmarked ? (
          <div className="flex items-center gap-2.5 py-2 px-3 rounded-md bg-accent/10 border border-accent/20">
            <div className="w-3 h-5 rounded-sm bg-gradient-to-b from-accent to-accent/80 shadow-sm relative shrink-0">
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-accent/40"
                style={{ clipPath: 'polygon(0 0, 50% 100%, 100% 0)' }} />
            </div>
            <span className="text-xs font-medium text-accent">
              Page {currentPage} marked
            </span>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`Mark page ${currentPage}…`}
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                "flex-1 px-3 py-2 text-sm rounded-md font-serif",
                "bg-secondary/80 text-foreground placeholder:text-muted-foreground/60",
                "border border-border focus:border-accent focus:outline-none",
                "transition-colors"
              )}
            />
            <button
              onClick={handleAdd}
              className={cn(
                "p-2 rounded-md transition-all",
                "bg-gradient-to-b from-red-600 to-red-700 text-white",
                "hover:from-red-500 hover:to-red-600",
                "shadow-sm hover:shadow-md active:scale-95"
              )}
              title="Place bookmark"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Bookmark ribbons list */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/60">
            {/* Empty state: hanging ribbons */}
            <div className="flex gap-3 mb-4">
              {[0, 1, 2].map(i => (
                <div key={i} className={cn(
                  "w-4 rounded-sm opacity-20",
                  i === 0 ? "h-10 bg-red-500" : i === 1 ? "h-8 bg-amber-500" : "h-12 bg-blue-500"
                )}>
                  <div className="absolute bottom-0 left-0 right-0 h-2"
                    style={{ clipPath: 'polygon(0 0, 50% 100%, 100% 0)' }} />
                </div>
              ))}
            </div>
            <p className="text-sm font-serif italic">No bookmarks placed</p>
            <p className="text-xs mt-1 font-serif">Mark pages to return later</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {bookmarks.map((bm, index) => {
              const colorClass = RIBBON_COLORS[index % RIBBON_COLORS.length];
              const isActive = bm.page === currentPage;
              
              return (
                <div
                  key={bm.page}
                  className={cn(
                    "group relative flex items-stretch cursor-pointer",
                    "rounded-md overflow-hidden transition-all duration-200",
                    "hover:translate-x-1 hover:shadow-md",
                    isActive && "translate-x-1 shadow-md"
                  )}
                  onClick={() => onGoToBookmark(bm.page)}
                >
                  {/* Ribbon tab */}
                  <div className={cn(
                    "w-8 shrink-0 bg-gradient-to-b flex items-center justify-center relative",
                    colorClass
                  )}>
                    <span className="text-white/90 text-[10px] font-bold">
                      {bm.page}
                    </span>
                    {/* Ribbon fold effect */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20" />
                  </div>

                  {/* Content area — book page feel */}
                  <div className={cn(
                    "flex-1 py-2.5 px-3 min-w-0 transition-colors",
                    isActive
                      ? "bg-accent/10"
                      : "bg-card hover:bg-secondary/60"
                  )}>
                    <p className={cn(
                      "text-sm font-serif truncate",
                      isActive ? "text-accent font-semibold" : "text-foreground"
                    )}>
                      {bm.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-serif italic">
                      Page {bm.page}
                    </p>
                  </div>

                  {/* Remove — appears on hover like peeling off */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onRemoveBookmark(bm.page);
                    }}
                    className={cn(
                      "absolute right-1 top-1/2 -translate-y-1/2",
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      "bg-destructive/90 text-destructive-foreground",
                      "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100",
                      "transition-all duration-200 shadow-sm"
                    )}
                    title="Remove bookmark"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom — book spine detail */}
      <div className="px-4 py-2.5 border-t border-border">
        <p className="text-[10px] text-muted-foreground/50 text-center font-serif italic">
          {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} · Ctrl+B to toggle
        </p>
      </div>
    </div>
  );
};

export default BookmarkPanel;
