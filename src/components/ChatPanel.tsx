import React, { useEffect, useRef, useState } from 'react';
import { X, MessageCircle, Send, Loader2, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pageNumber: number;
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onRetry: () => void;
  onClear: () => void;
}

const ChatPanel: React.FC<Props> = ({
  isOpen,
  onClose,
  pageNumber,
  messages,
  isStreaming,
  error,
  onSend,
  onRetry,
  onClear,
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    onSend(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const isRateLimit = !!error && /busy|rate limit|try again/i.test(error);

  return (
    <aside
      className={cn(
        'fixed top-0 right-0 z-40 h-full w-full sm:w-[420px] bg-card border-l border-border shadow-2xl',
        'transition-transform duration-300 ease-in-out flex flex-col',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
      aria-hidden={!isOpen}
    >
      <header className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-md bg-accent/10 shrink-0">
            <MessageCircle className="w-4 h-4 text-accent" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Ask this page</h3>
            <p className="text-xs text-muted-foreground">Page {pageNumber} • answers from current page only</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {messages.length > 0 && (
            <button
              onClick={onClear}
              disabled={isStreaming}
              className="p-2 rounded-md hover:bg-secondary active:scale-95 transition-all disabled:opacity-50"
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-secondary active:scale-95 transition-all"
            title="Close"
            aria-label="Close chat panel"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isStreaming && !error && (
          <div className="text-sm text-muted-foreground text-center mt-8 px-4 leading-relaxed space-y-3">
            <p>Ask anything about page {pageNumber}.</p>
            <div className="text-xs space-y-1.5 pt-2">
              <p className="text-muted-foreground/80">Try:</p>
              <button
                onClick={() => onSend('Summarize this page in 3 bullet points')}
                className="block w-full text-left px-3 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
              >
                Summarize this page in 3 bullet points
              </button>
              <button
                onClick={() => onSend('What are the key terms defined here?')}
                className="block w-full text-left px-3 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
              >
                What are the key terms defined here?
              </button>
              <button
                onClick={() => onSend('Explain this page in simple language')}
                className="block w-full text-left px-3 py-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
              >
                Explain this page in simple language
              </button>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              'flex',
              m.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm',
                m.role === 'user'
                  ? 'bg-accent text-accent-foreground rounded-br-sm'
                  : 'bg-secondary text-foreground rounded-bl-sm'
              )}
            >
              {m.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5">
                  <ReactMarkdown>{m.content || '…'}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              )}
            </div>
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-2xl rounded-bl-sm px-3.5 py-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-destructive">
                  {isRateLimit ? 'AI is busy' : 'Something went wrong'}
                </p>
                <p className="text-xs text-destructive/80 leading-relaxed">{error}</p>
              </div>
            </div>
            <button
              onClick={onRetry}
              disabled={isStreaming}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3 h-3', isStreaming && 'animate-spin')} />
              Try again
            </button>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-border shrink-0 bg-card"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about page ${pageNumber}…`}
            rows={1}
            disabled={isStreaming}
            className={cn(
              'flex-1 resize-none rounded-xl px-3 py-2 text-sm',
              'bg-secondary text-foreground placeholder:text-muted-foreground',
              'border border-transparent focus:border-accent focus:outline-none',
              'transition-colors max-h-32 disabled:opacity-60'
            )}
            style={{ minHeight: '40px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className={cn(
              'p-2.5 rounded-xl transition-all shrink-0',
              'bg-accent text-accent-foreground hover:bg-accent/90',
              'active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100'
            )}
            aria-label="Send"
            title="Send (Enter)"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </aside>
  );
};

export default ChatPanel;
