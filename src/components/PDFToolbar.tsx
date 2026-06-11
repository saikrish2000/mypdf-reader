import React from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, PanelLeft, X, Bookmark, Sparkles, MessageCircle, Search } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import ReadAloudControls from './ReadAloudControls';
import type { SpeechSettings } from '@/hooks/useSpeech';
import type { Theme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface PDFToolbarProps {
  currentPage: number;
  totalPages: number;
  fileName: string;
  scale: number;
  onPageChange: (page: number) => void;
  onScaleChange: (scale: number) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onSelectTheme?: (theme: Theme) => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  onToggleBookmarks: () => void;
  bookmarksOpen: boolean;
  isCurrentPageBookmarked: boolean;
  isReading: boolean;
  onToggleRead: () => void;
  voices: SpeechSynthesisVoice[];
  speechSettings: SpeechSettings;
  onSpeechSettingsChange: (next: Partial<SpeechSettings>) => void;
  continuousRead: boolean;
  onContinuousChange: (value: boolean) => void;
  onSummarize: () => void;
  summaryOpen: boolean;
  onToggleChat: () => void;
  chatOpen: boolean;
  onToggleSearch: () => void;
  searchOpen: boolean;
  onClose: () => void;
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
  onSelectTheme,
  onToggleSidebar,
  sidebarOpen,
  onToggleBookmarks,
  bookmarksOpen,
  isCurrentPageBookmarked,
  isReading,
  onToggleRead,
  voices,
  speechSettings,
  onSpeechSettingsChange,
  continuousRead,
  onContinuousChange,
  onSummarize,
  summaryOpen,
  onToggleChat,
  chatOpen,
  onClose,
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

      <div className="flex items-center justify-between gap-2 px-2 py-2 sm:px-6 sm:py-3">
        {/* Left: sidebar toggle + file info */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <button
            onClick={onToggleSidebar}
            className={cn(
              "flex shrink-0 p-2 rounded-lg transition-colors min-h-[40px] min-w-[40px] items-center justify-center",
              "hover:bg-toolbar-foreground/10",
              sidebarOpen && "bg-toolbar-foreground/10"
            )}
            title={sidebarOpen ? 'Hide thumbnails' : 'Show thumbnails'}
          >
            <PanelLeft className="w-4 h-4 text-toolbar-foreground" />
          </button>
          <div className="min-w-0 hidden xs:block sm:block">
            <h2 className="text-xs sm:text-sm font-medium text-toolbar-foreground truncate">
              {fileName}
            </h2>
            <p className="text-[10px] sm:text-xs text-toolbar-muted">
              {Math.round(progress)}% complete
            </p>
          </div>
        </div>

        {/* Center: navigation controls */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Zoom controls */}
          <div className="hidden md:flex items-center gap-1 mr-2">
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
              "p-2 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center",
              "hover:bg-toolbar-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed"
            )}
            title="Previous page"
          >
            <ChevronLeft className="w-5 h-5 text-toolbar-foreground" />
          </button>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={handlePageInput}
              onKeyDown={handleKeyDown}
              className={cn(
                "w-12 sm:w-14 px-1.5 sm:px-2 py-1.5 text-center text-sm rounded-lg",
                "bg-toolbar-foreground/10 text-toolbar-foreground",
                "border border-transparent focus:border-accent focus:outline-none",
                "transition-colors"
              )}
            />
            <span className="text-xs sm:text-sm text-toolbar-muted whitespace-nowrap">
              / {totalPages}
            </span>
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={cn(
              "p-2 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center",
              "hover:bg-toolbar-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed"
            )}
            title="Next page"
          >
            <ChevronRight className="w-5 h-5 text-toolbar-foreground" />
          </button>
        </div>

        {/* Right: bookmarks + theme toggle + close */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <div className="hidden sm:flex items-center gap-0.5">
            <ReadAloudControls
              isReading={isReading}
              onToggleRead={onToggleRead}
              voices={voices}
              settings={speechSettings}
              onSettingsChange={onSpeechSettingsChange}
              continuous={continuousRead}
              onContinuousChange={onContinuousChange}
            />
          </div>
          <button
            onClick={onSummarize}
            className={cn(
              'p-2 rounded-lg transition-colors hover:bg-toolbar-foreground/10 min-h-[40px] min-w-[40px] flex items-center justify-center',
              summaryOpen && 'bg-toolbar-foreground/10'
            )}
            title="Summarize this page with AI"
          >
            <Sparkles className={cn(
              'w-4 h-4 text-toolbar-foreground',
              summaryOpen && 'text-accent'
            )} />
          </button>
          <button
            onClick={onToggleChat}
            className={cn(
              'p-2 rounded-lg transition-colors hover:bg-toolbar-foreground/10 min-h-[40px] min-w-[40px] flex items-center justify-center',
              chatOpen && 'bg-toolbar-foreground/10'
            )}
            title="Ask questions about this page"
          >
            <MessageCircle className={cn(
              'w-4 h-4 text-toolbar-foreground',
              chatOpen && 'text-accent'
            )} />
          </button>
          <button
            onClick={onToggleBookmarks}
            className={cn(
              "p-2 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center",
              "hover:bg-toolbar-foreground/10",
              bookmarksOpen && "bg-toolbar-foreground/10"
            )}
            title="Bookmarks"
          >
            <Bookmark className={cn(
              "w-4 h-4 text-toolbar-foreground",
              isCurrentPageBookmarked && "fill-accent text-accent"
            )} />
          </button>
          <div className="hidden sm:block">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} onSelect={onSelectTheme} variant="toolbar" />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-toolbar-foreground/10 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
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
