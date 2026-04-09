import React from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, PanelLeft, X, Bookmark } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { cn } from '@/lib/utils';

interface PDFToolbarProps {
  currentPage: number;
  totalPages: number;
  fileName: string;
  scale: number;
  onPageChange: (page: number) => void;
  onScaleChange: (scale: number) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  onToggleBookmarks: () => void;
  bookmarksOpen: boolean;
  isCurrentPageBookmarked: boolean;
}

const PDFToolbar: React.FC<PDFToolbarProps> = ({
  currentPage,
  totalPages,
  fileName,
  scale,
  onPageChange,
  onScaleChange,
  theme,
  onToggleTheme,
  onToggleSidebar,
  sidebarOpen,
  onToggleBookmarks,
  bookmarksOpen,
  isCurrentPageBookmarked,
}) => {
  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= totalPages) {
      onPageChange(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  return (
    <div className="pdf-toolbar sticky top-0 z-30">
      {/* Progress bar */}
      <div className="h-1 bg-toolbar-muted/30">
        <div
          className="h-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: sidebar toggle + file info */}
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-4">
          <button
            onClick={onToggleSidebar}
            className={cn(
              "hidden sm:flex p-2 rounded-lg transition-colors",
              "hover:bg-toolbar-foreground/10",
              sidebarOpen && "bg-toolbar-foreground/10"
            )}
            title={sidebarOpen ? 'Hide thumbnails' : 'Show thumbnails'}
          >
            <PanelLeft className="w-4 h-4 text-toolbar-foreground" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm font-medium text-toolbar-foreground truncate">
              {fileName}
            </h2>
            <p className="text-xs text-toolbar-muted">
              {Math.round(progress)}% complete
            </p>
          </div>
        </div>

        {/* Center: navigation controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 mr-2">
            <button
              onClick={() => onScaleChange(Math.max(0.5, scale - 0.25))}
              disabled={scale <= 0.5}
              className={cn(
                "p-2 rounded-lg transition-colors",
                "hover:bg-toolbar-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed"
              )}
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4 text-toolbar-foreground" />
            </button>
            <span className="text-xs text-toolbar-muted w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => onScaleChange(Math.min(3, scale + 0.25))}
              disabled={scale >= 3}
              className={cn(
                "p-2 rounded-lg transition-colors",
                "hover:bg-toolbar-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed"
              )}
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4 text-toolbar-foreground" />
            </button>
          </div>

          {/* Page navigation */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={cn(
              "p-2 rounded-lg transition-colors",
              "hover:bg-toolbar-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed"
            )}
            title="Previous page"
          >
            <ChevronLeft className="w-5 h-5 text-toolbar-foreground" />
          </button>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={handlePageInput}
              onKeyDown={handleKeyDown}
              className={cn(
                "w-14 px-2 py-1.5 text-center text-sm rounded-lg",
                "bg-toolbar-foreground/10 text-toolbar-foreground",
                "border border-transparent focus:border-accent focus:outline-none",
                "transition-colors"
              )}
            />
            <span className="text-sm text-toolbar-muted">
              of {totalPages}
            </span>
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={cn(
              "p-2 rounded-lg transition-colors",
              "hover:bg-toolbar-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed"
            )}
            title="Next page"
          >
            <ChevronRight className="w-5 h-5 text-toolbar-foreground" />
          </button>
        </div>

        {/* Right: theme toggle + close */}
        <div className="flex items-center gap-1 ml-4">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} variant="toolbar" />
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-lg hover:bg-toolbar-foreground/10 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-toolbar-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFToolbar;
