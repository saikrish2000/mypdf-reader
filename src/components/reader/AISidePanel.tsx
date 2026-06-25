import { cn } from '@/lib/utils';
import { MessageCircle, Sparkles, GraduationCap, X } from 'lucide-react';
import ChatPanel, { type ChatMessage } from '@/components/ChatPanel';
import SummaryPanel from '@/components/SummaryPanel';
import StudyPanel from '@/components/reader/StudyPanel';
import SignInPrompt from '@/components/reader/SignInPrompt';

export type AITab = 'chat' | 'summary' | 'study';

interface AISidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: AITab;
  onTabChange: (tab: AITab) => void;
  embedded?: boolean;
  aiEnabled: boolean;
  pageNumber: number;
  // Chat
  chatMessages: ChatMessage[];
  chatStreaming: boolean;
  chatError: string | null;
  onChatSend: (text: string) => void;
  onChatRetry: () => void;
  onChatClear: () => void;
  chatScopeLabel?: string;
  onChatScopeChange?: (scope: 'page' | 'range' | 'document') => void;
  chatScope?: 'page' | 'range' | 'document';
  chatRangeEnd?: number;
  onChatRangeEndChange?: (page: number) => void;
  // Summary
  summaryPage: number;
  summary: string | null;
  summaryLoading: boolean;
  summaryError: string | null;
  onRegenerateSummary: () => void;
  // Study
  fileName: string;
  contentHash?: string;
  annotations: { quote: string; page_number: number }[];
  extractPageText: (page: number) => Promise<string>;
  totalPages: number;
}

const TABS: { id: AITab; label: string; icon: typeof MessageCircle }[] = [
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'summary', label: 'Summary', icon: Sparkles },
  { id: 'study', label: 'Study', icon: GraduationCap },
];

export default function AISidePanel({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  embedded = false,
  aiEnabled,
  pageNumber,
  chatMessages,
  chatStreaming,
  chatError,
  onChatSend,
  onChatRetry,
  onChatClear,
  chatScopeLabel,
  onChatScopeChange,
  chatScope = 'page',
  chatRangeEnd,
  onChatRangeEndChange,
  summaryPage,
  summary,
  summaryLoading,
  summaryError,
  onRegenerateSummary,
  fileName,
  contentHash,
  annotations,
  extractPageText,
  totalPages,
}: AISidePanelProps) {
  if (!isOpen && !embedded) return null;

  const shell = (
    <div className={cn('flex flex-col h-full min-h-0 bg-card', embedded ? '' : 'shadow-2xl')}>
      <header className="flex items-center justify-between border-b border-border shrink-0 px-2 pt-2">
        <div
          role="tablist"
          aria-label="AI workspace"
          className="flex gap-1 flex-1"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => onTabChange(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors',
                activeTab === id
                  ? 'bg-violet-500/15 text-violet-300'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
        {!embedded && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md hover:bg-secondary shrink-0"
            aria-label="Close AI panel"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </header>

      <div className="flex-1 min-h-0 overflow-hidden" role="tabpanel">
        {!aiEnabled ? (
          <SignInPrompt />
        ) : activeTab === 'chat' ? (
          <div className="flex flex-col h-full">
            {onChatScopeChange && (
              <div className="flex gap-1 p-2 border-b border-border shrink-0">
                {(['page', 'range', 'document'] as const).map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => onChatScopeChange(scope)}
                    className={cn(
                      'px-2 py-1 text-[10px] font-medium rounded-md capitalize',
                      chatScope === scope
                        ? 'bg-accent/15 text-accent'
                        : 'text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    {scope === 'page' ? 'This page' : scope === 'range' ? 'Page range' : 'Whole doc'}
                  </button>
                ))}
              </div>
            )}
            {chatScope === 'range' && onChatRangeEndChange && (
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0 text-xs">
                <span className="text-muted-foreground shrink-0">Pages {pageNumber}–</span>
                <input
                  type="number"
                  min={pageNumber}
                  max={totalPages}
                  value={chatRangeEnd ?? pageNumber}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!isNaN(n)) {
                      onChatRangeEndChange(Math.min(totalPages, Math.max(pageNumber, n)));
                    }
                  }}
                  className="w-16 rounded-md border border-border bg-background px-2 py-1 text-foreground"
                  aria-label="End page for chat range"
                />
                <span className="text-muted-foreground">of {totalPages}</span>
              </div>
            )}
            <ChatPanel
              embedded
              isOpen
              onClose={onClose}
              pageNumber={pageNumber}
              messages={chatMessages}
              isStreaming={chatStreaming}
              error={chatError}
              onSend={onChatSend}
              onRetry={onChatRetry}
              onClear={onChatClear}
              scopeLabel={chatScopeLabel}
            />
          </div>
        ) : activeTab === 'summary' ? (
          <SummaryPanel
            embedded
            isOpen
            onClose={onClose}
            pageNumber={summaryPage}
            summary={summary}
            isLoading={summaryLoading}
            error={summaryError}
            onRegenerate={onRegenerateSummary}
          />
        ) : (
          <StudyPanel
            fileName={fileName}
            contentHash={contentHash}
            currentPage={pageNumber}
            totalPages={totalPages}
            annotations={annotations}
            extractPageText={extractPageText}
          />
        )}
      </div>
    </div>
  );

  if (embedded) {
    return shell;
  }

  return (
    <aside
      className={cn(
        'fixed top-0 right-0 z-40 h-full w-full sm:w-[420px] border-l border-border',
        'transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : 'translate-x-full',
      )}
      aria-hidden={!isOpen}
    >
      {shell}
    </aside>
  );
}
