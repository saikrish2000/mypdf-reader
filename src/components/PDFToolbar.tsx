import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, PanelLeft, X, Bookmark, Sparkles, MessageCircle, Search, BookOpen, ScrollText, Home, ListTree } from 'lucide-react';
import type { ReadingMode } from '@/hooks/usePDFStorage';
import ThemeToggle from './ThemeToggle';
import ReadAloudControls from './ReadAloudControls';
import type { SpeechSettings } from '@/hooks/useSpeech';
import type { Theme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function promptSignIn(feature: string) {
  toast.info(`Sign in to use ${feature}.`, {
    action: { label: 'Sign in', onClick: () => { window.location.href = '/auth'; } },
  });
}

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
  onToggleOutline?: () => void;
  outlineOpen?: boolean;
  onClose: () => void;
  onGoHome?: () => void;
  speechUnsupported?: boolean;
  readingMode: ReadingMode;
  onReadingModeChange: (mode: ReadingMode) => void;
  navigationLocked?: boolean;
  aiEnabled?: boolean;
  onPrevPage?: () => void;
  onNextPage?: () => void;
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
  onToggleSearch,
  searchOpen,
  onToggleOutline,
  outlineOpen = false,
  onClose,
  onGoHome,
  speechUnsupported = false,
  readingMode,
  onReadingModeChange,
  navigationLocked = false,
  aiEnabled = true,
  onPrevPage,
  onNextPage,
}) => {
  const [pageInputValue, setPageInputValue] = useState(String(currentPage));

  useEffect(() => {
    setPageInputValue(String(currentPage));
  }, [currentPage]);

  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInputValue(e.target.value);
  };

  const commitPageInput = () => {
    if (navigationLocked) return;
    const raw = pageInputValue.replace(/[^0-9-]/g, '');
    const value = parseInt(raw, 10);
    if (isNaN(value) || value < 1 || value > totalPages) {
      if (value < 1 || value > totalPages) {
        toast.error(`Page must be between 1 and ${totalPages}`);
      }
      setPageInputValue(String(currentPage));
      return;
    }
    onPageChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitPageInput();
      e.currentTarget.blur();
    }
  };

  const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  return (
    <div className="pdf-toolbar sticky top-0 z-50">
      {/* Progress bar */}
      <div className="h-1 bg-toolbar-muted/30">
        <div
          className="h-full bg-accent transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-2 py-2 sm:px-4 lg:px-6 gap-1 overflow-x-auto"
        style={{ minHeight: 'var(--toolbar-height, 60px)' }}
      >
        {/* Left: sidebar toggle + file info */}
        <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 mr-1 sm:mr-4">
          {onGoHome && (
            <button
              type="button"
              onClick={onGoHome}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-colors shrink-0 hover:bg-toolbar-foreground/10"
              title="Back to home"
              aria-label="Back to home"
            >
              <Home className="w-4 h-4 text-toolbar-foreground" />
            </button>
          )}
          <button
            onClick={onToggleSidebar}
            className={cn(
              "flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-colors shrink-0",
              "hover:bg-toolbar-foreground/10",
              sidebarOpen && "bg-toolbar-foreground/10"
            )}
            title={sidebarOpen ? 'Hide thumbnails' : 'Show thumbnails'}
            aria-label={sidebarOpen ? 'Hide thumbnails' : 'Show thumbnails'}
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
          <div className="hidden lg:flex items-center gap-1 mr-2">
            <button
              onClick={() => onScaleChange(Math.max(0.5, scale - 0.25))}
              disabled={scale <= 0.5}
              className={cn(
                "flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-colors",
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
                "flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-colors",
                "hover:bg-toolbar-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed"
              )}
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4 text-toolbar-foreground" />
            </button>
          </div>

          {/* Page navigation */}
          <button
            onClick={() => {
              if (navigationLocked) return;
              if (onPrevPage) onPrevPage();
              else onPageChange(currentPage - 1);
            }}
            disabled={currentPage <= 1 || navigationLocked}
            className={cn(
              "flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-colors",
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
              value={pageInputValue}
              onChange={handlePageInput}
              onKeyDown={handleKeyDown}
              onBlur={commitPageInput}
              disabled={navigationLocked}
              className={cn(
                "w-12 sm:w-14 px-1.5 sm:px-2 py-1.5 text-center text-sm rounded-lg",
                "bg-toolbar-foreground/10 text-toolbar-foreground",
                "border border-transparent focus:border-accent focus:outline-none",
                "transition-colors",
                navigationLocked && "opacity-40 cursor-not-allowed",
              )}
            />
            <span className="text-xs sm:text-sm text-toolbar-muted whitespace-nowrap">
              / {totalPages}
            </span>
          </div>

          <button
            onClick={() => {
              if (navigationLocked) return;
              if (onNextPage) onNextPage();
              else onPageChange(currentPage + 1);
            }}
            disabled={currentPage >= totalPages || navigationLocked}
            className={cn(
              "flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-colors",
              "hover:bg-toolbar-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed"
            )}
            title="Next page"
          >
            <ChevronRight className="w-5 h-5 text-toolbar-foreground" />
          </button>
        </div>

        {/* Right: bookmarks + theme toggle + close */}
        <div className="flex items-center gap-0 sm:gap-1 ml-1 sm:ml-4 flex-shrink-0">
          <button
            onClick={() => onReadingModeChange(readingMode === 'scroll' ? 'flip' : 'scroll')}
            className={cn(
              'flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-colors hover:bg-toolbar-foreground/10',
            )}
            title={readingMode === 'scroll' ? 'Switch to flip book view' : 'Switch to scroll view'}
            aria-label={readingMode === 'scroll' ? 'Switch to flip book view' : 'Switch to scroll view'}
          >
            {readingMode === 'scroll' ? (
              <BookOpen className="w-4 h-4 text-toolbar-foreground" />
            ) : (
              <ScrollText className="w-4 h-4 text-toolbar-foreground" />
            )}
          </button>
          <ReadAloudControls
            isReading={isReading}
            onToggleRead={onToggleRead}
            voices={voices}
            settings={speechSettings}
            onSettingsChange={onSpeechSettingsChange}
            continuous={continuousRead}
            onContinuousChange={onContinuousChange}
            unsupported={speechUnsupported}
          />
          <button
            onClick={() => aiEnabled ? onSummarize() : promptSignIn('AI summary')}
            className={cn(
              'flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-colors hover:bg-toolbar-foreground/10',
              summaryOpen && 'bg-toolbar-foreground/10',
              !aiEnabled && 'opacity-40',
            )}
            title={aiEnabled ? 'Summarize this page with AI' : 'Sign in to use AI summary'}
          >
            <Sparkles className={cn(
              'w-4 h-4 text-toolbar-foreground',
              summaryOpen && 'text-accent'
            )} />
          </button>
          <button
            onClick={() => aiEnabled ? onToggleChat() : promptSignIn('AI chat')}
            className={cn(
              'flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-colors hover:bg-toolbar-foreground/10',
              chatOpen && 'bg-toolbar-foreground/10',
              !aiEnabled && 'opacity-40',
            )}
            title={aiEnabled ? 'Ask questions about this page' : 'Sign in to use AI chat'}
          >
            <MessageCircle className={cn(
              'w-4 h-4 text-toolbar-foreground',
              chatOpen && 'text-accent'
            )} />
          </button>
          <button
            onClick={onToggleSearch}
            className={cn(
              'flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-colors hover:bg-toolbar-foreground/10',
              searchOpen && 'bg-toolbar-foreground/10'
            )}
            title="Search document"
            aria-label="Search document"
          >
            <Search className={cn(
              'w-4 h-4 text-toolbar-foreground',
              searchOpen && 'text-accent'
            )} />
          </button>
          {onToggleOutline && (
            <button
              onClick={onToggleOutline}
              className={cn(
                'flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-colors hover:bg-toolbar-foreground/10',
                outlineOpen && 'bg-toolbar-foreground/10',
              )}
              title="Document outline"
              aria-label="Document outline"
            >
              <ListTree className={cn(
                'w-4 h-4 text-toolbar-foreground',
                outlineOpen && 'text-accent',
              )} />
            </button>
          )}
          <button
            onClick={onToggleBookmarks}
            className={cn(
              "flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-colors",
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
          <ThemeToggle theme={theme} onToggle={onToggleTheme} onSelect={onSelectTheme} variant="toolbar" />
          <button
            onClick={onClose}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg hover:bg-toolbar-foreground/10 transition-colors"
            title="Close and return to library"
          >
            <X className="w-4 h-4 text-toolbar-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFToolbar;
