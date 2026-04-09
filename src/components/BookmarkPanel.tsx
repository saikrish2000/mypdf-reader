import React, { useState } from 'react';
import { Bookmark, BookmarkPlus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Bookmark as BookmarkType } from '@/hooks/usePDFStorage';

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
      "bg-card border-l border-border shadow-lg",
      "w-72 animate-fade-in"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-foreground">Bookmarks</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Add bookmark */}
      <div className="p-3 border-b border-border">
        {isCurrentPageBookmarked ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 px-3 bg-secondary rounded-lg">
            <Bookmark className="w-3.5 h-3.5 text-accent fill-accent" />
            <span>Page {currentPage} is bookmarked</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={`Page ${currentPage}`}
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                "flex-1 px-3 py-2 text-sm rounded-lg",
                "bg-secondary text-foreground placeholder:text-muted-foreground",
                "border border-transparent focus:border-accent focus:outline-none",
                "transition-colors"
              )}
            />
            <button
              onClick={handleAdd}
              className="p-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
              title="Add bookmark"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Bookmark list */}
      <div className="flex-1 overflow-y-auto">
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Bookmark className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No bookmarks yet</p>
            <p className="text-xs mt-1">Bookmark pages to jump back later</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {bookmarks.map(bm => (
              <div
                key={bm.page}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                  "hover:bg-secondary",
                  bm.page === currentPage && "bg-accent/10 border border-accent/20"
                )}
                onClick={() => onGoToBookmark(bm.page)}
              >
                <Bookmark className={cn(
                  "w-4 h-4 shrink-0",
                  bm.page === currentPage ? "text-accent fill-accent" : "text-muted-foreground"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {bm.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Page {bm.page}
                  </p>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onRemoveBookmark(bm.page);
                  }}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                  title="Remove bookmark"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarkPanel;
