import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import PDFToolbar from './PDFToolbar';
import ThumbnailSidebar from './ThumbnailSidebar';
import BookmarkPanel from './BookmarkPanel';
import SummaryPanel from './SummaryPanel';
import ChatPanel, { type ChatMessage } from './ChatPanel';
import PlaybackControls from './PlaybackControls';
import { usePDFStorage } from '@/hooks/usePDFStorage';
import { useSpeech } from '@/hooks/useSpeech';
import { cachePDF } from '@/lib/pdfCache';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Theme } from '@/hooks/useTheme';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: File;
  onClose: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onSelectTheme?: (theme: Theme) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file, onClose, theme, onToggleTheme, onSelectTheme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(0.8);
  const [continuousRead, setContinuousRead] = useState(false);
  const continuousRef = useRef(false);
  const totalPagesRef = useRef(0);
  const isRenderingRef = useRef(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right' | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [bookmarkVersion, setBookmarkVersion] = useState(0);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);

  const { saveProgress, loadProgress, getBookmarks, addBookmark, removeBookmark, isBookmarked } = usePDFStorage();
  const {
    voices,
    settings: speechSettings,
    setSettings: setSpeechSettings,
    speak,
    stop: stopSpeak,
    pause: pauseSpeak,
    resume: resumeSpeak,
    skipForward,
    skipBackward,
    isSpeaking,
    isPaused,
  } = useSpeech();

  // AI summary state
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryPage, setSummaryPage] = useState<number>(1);

  // AI chat state (current page)
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatStreaming, setChatStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatAbortRef = useRef<AbortController | null>(null);
  const chatPageRef = useRef<number>(1);

  useEffect(() => { continuousRef.current = continuousRead; }, [continuousRead]);
  useEffect(() => { totalPagesRef.current = totalPages; }, [totalPages]);

  const bookmarks = getBookmarks(file.name);
  const currentPageBookmarked = isBookmarked(file.name, currentPage);

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        // Cache the file so recents can re-open it
        cachePDF(file.name, file);

        const saved = loadProgress(file.name);
        if (saved && saved.currentPage <= pdf.numPages) {
          setCurrentPage(saved.currentPage);
        }
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };
    loadPDF();
  }, [file, loadProgress]);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current || isRenderingRef.current) return;
    if (renderTaskRef.current) renderTaskRef.current.cancel();
    isRenderingRef.current = true;
    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      renderTaskRef.current = page.render({ canvasContext: context, viewport });
      await renderTaskRef.current.promise;
      saveProgress(file.name, pageNum, totalPages);
    } catch (error) {
      if ((error as Error).name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', error);
      }
    } finally {
      isRenderingRef.current = false;
    }
  }, [pdfDoc, scale, file.name, totalPages, saveProgress]);

  useEffect(() => {
    if (pdfDoc) renderPage(currentPage);
  }, [currentPage, scale, pdfDoc, renderPage]);

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setFlipDirection(page > currentPage ? 'left' : 'right');
      setTimeout(() => {
        setCurrentPage(page);
        setTimeout(() => setFlipDirection(null), 350);
      }, 50);
    }
  }, [totalPages, currentPage]);

  const handleAddBookmark = useCallback((label: string) => {
    addBookmark(file.name, currentPage, label);
    setBookmarkVersion(v => v + 1);
  }, [addBookmark, file.name, currentPage]);

  const handleRemoveBookmark = useCallback((page: number) => {
    removeBookmark(file.name, page);
    setBookmarkVersion(v => v + 1);
  }, [removeBookmark, file.name]);

  // Extract plain text from a given page
  const extractPageText = useCallback(async (pageNum: number): Promise<string> => {
    if (!pdfDoc) return '';
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    return textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, [pdfDoc]);

  // Read a specific page; if continuous mode is on, advance and recurse on end
  const readPage = useCallback(async (pageNum: number) => {
    try {
      const text = await extractPageText(pageNum);
      if (!text) {
        if (continuousRef.current && pageNum < totalPagesRef.current) {
          // Skip empty page
          setCurrentPage(pageNum + 1);
          setTimeout(() => readPage(pageNum + 1), 200);
        } else {
          toast.info('No readable text on this page');
        }
        return;
      }
      speak(text, () => {
        if (continuousRef.current && pageNum < totalPagesRef.current) {
          const next = pageNum + 1;
          setCurrentPage(next);
          // Small delay to let the page transition settle, then continue
          setTimeout(() => readPage(next), 400);
        }
      });
    } catch (e) {
      console.error('Read aloud failed', e);
      toast.error('Could not read this page');
    }
  }, [extractPageText, speak]);

  const handleToggleRead = useCallback(() => {
    // Toolbar speaker now toggles play/pause when active, starts when idle
    if (isSpeaking) {
      if (isPaused) resumeSpeak();
      else pauseSpeak();
      return;
    }
    if (!pdfDoc) return;
    readPage(currentPage);
  }, [isSpeaking, isPaused, pdfDoc, currentPage, readPage, pauseSpeak, resumeSpeak]);

  // AI summary handler
  const generateSummary = useCallback(async (pageNum: number) => {
    setSummaryOpen(true);
    setSummaryPage(pageNum);
    setSummaryLoading(true);
    setSummaryError(null);
    setSummary(null);
    try {
      const text = await extractPageText(pageNum);
      if (!text) {
        setSummaryError('No readable text on this page to summarize.');
        return;
      }
      const { data, error } = await supabase.functions.invoke('summarize-page', {
        body: { text, pageNumber: pageNum },
      });
      if (error) throw error;
      if ((data as any)?.error) {
        const errorMsg = (data as any).error;
        if (errorMsg.includes('LOVABLE_API_KEY')) {
          setSummaryError('AI summarization requires configuration. Please contact support or configure the API key in your Supabase project.');
        } else {
          setSummaryError(errorMsg);
        }
        return;
      }
      setSummary((data as any)?.summary ?? '');
    } catch (e: any) {
      console.error('Summarize failed', e);
      setSummaryError(e?.message || 'Failed to generate summary');
    } finally {
      setSummaryLoading(false);
    }
  }, [extractPageText]);

  const handleSummarize = useCallback(() => {
    generateSummary(currentPage);
  }, [generateSummary, currentPage]);

  // ---- Chat (current page) streaming ----
  const cancelChatStream = useCallback(() => {
    chatAbortRef.current?.abort();
    chatAbortRef.current = null;
  }, []);

  const streamChat = useCallback(async (history: ChatMessage[], pageNum: number) => {
    setChatStreaming(true);
    setChatError(null);
    cancelChatStream();
    const controller = new AbortController();
    chatAbortRef.current = controller;

    try {
      const pageText = await extractPageText(pageNum);
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-page`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ pageText, pageNumber: pageNum, messages: history }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        let msg = 'Failed to start chat';
        try {
          const j = await resp.json();
          msg = j?.error || msg;
        } catch {}
        if (resp.status === 429) msg = msg || 'AI is busy. Please try again in a few seconds.';
        if (resp.status === 402) msg = 'AI credits exhausted. Add funds in Settings → Workspace → Usage.';
        setChatError(msg);
        setChatStreaming(false);
        return;
      }

      // Insert empty assistant message we'll progressively fill
      setChatMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;
      let assistantSoFar = '';

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setChatMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last && last.role === 'assistant') {
                  next[next.length - 1] = { ...last, content: assistantSoFar };
                }
                return next;
              });
            }
          } catch {
            // partial JSON; put back and wait
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.error('Chat stream error', e);
        setChatError(e?.message || 'Chat failed');
      }
    } finally {
      setChatStreaming(false);
      chatAbortRef.current = null;
    }
  }, [extractPageText, cancelChatStream]);

  const handleChatSend = useCallback((text: string) => {
    const userMsg: ChatMessage = { role: 'user', content: text };
    const next = [...chatMessages, userMsg];
    setChatMessages(next);
    streamChat(next, chatPageRef.current);
  }, [chatMessages, streamChat]);

  const handleChatRetry = useCallback(() => {
    // Re-run from current history (drop trailing empty assistant if any)
    const cleaned = [...chatMessages];
    if (cleaned[cleaned.length - 1]?.role === 'assistant' && !cleaned[cleaned.length - 1].content) {
      cleaned.pop();
    }
    if (cleaned.length === 0) return;
    setChatMessages(cleaned);
    streamChat(cleaned, chatPageRef.current);
  }, [chatMessages, streamChat]);

  const handleChatClear = useCallback(() => {
    cancelChatStream();
    setChatMessages([]);
    setChatError(null);
  }, [cancelChatStream]);

  // Reset chat when current page changes (chat is scoped to current page)
  useEffect(() => {
    if (chatPageRef.current !== currentPage) {
      chatPageRef.current = currentPage;
      cancelChatStream();
      setChatMessages([]);
      setChatError(null);
      setChatStreaming(false);
    }
  }, [currentPage, cancelChatStream]);

  // Stop speech if user manually navigates away (but NOT during continuous auto-advance)
  const lastReadPageRef = useRef(currentPage);
  useEffect(() => {
    if (isSpeaking && !continuousRef.current && currentPage !== lastReadPageRef.current) {
      stopSpeak();
    }
    lastReadPageRef.current = currentPage;
  }, [currentPage, isSpeaking, stopSpeak]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePageChange(currentPage - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        handlePageChange(currentPage + 1);
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!currentPageBookmarked) {
          handleAddBookmark(`Page ${currentPage}`);
        } else {
          handleRemoveBookmark(currentPage);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, handlePageChange, onClose, currentPageBookmarked, handleAddBookmark, handleRemoveBookmark]);

  return (
    <div className="flex flex-col h-screen bg-muted animate-fade-in">
      <PDFToolbar
        currentPage={currentPage}
        totalPages={totalPages}
        fileName={file.name}
        scale={scale}
        onPageChange={handlePageChange}
        onScaleChange={setScale}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onSelectTheme={onSelectTheme}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        sidebarOpen={sidebarOpen}
        onToggleBookmarks={() => setBookmarksOpen(prev => !prev)}
        bookmarksOpen={bookmarksOpen}
        isCurrentPageBookmarked={currentPageBookmarked}
        isReading={isSpeaking}
        onToggleRead={handleToggleRead}
        voices={voices}
        speechSettings={speechSettings}
        onSpeechSettingsChange={setSpeechSettings}
        continuousRead={continuousRead}
        onContinuousChange={setContinuousRead}
        onSummarize={handleSummarize}
        summaryOpen={summaryOpen}
        onToggleChat={() => setChatOpen(prev => !prev)}
        chatOpen={chatOpen}
      />

      <ThumbnailSidebar
        pdfDoc={pdfDoc}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageSelect={handlePageChange}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(prev => !prev)}
      />

      <BookmarkPanel
        bookmarks={bookmarks}
        currentPage={currentPage}
        isCurrentPageBookmarked={currentPageBookmarked}
        onAddBookmark={handleAddBookmark}
        onRemoveBookmark={handleRemoveBookmark}
        onGoToBookmark={handlePageChange}
        isOpen={bookmarksOpen}
        onClose={() => setBookmarksOpen(false)}
      />

      <SummaryPanel
        isOpen={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        pageNumber={summaryPage}
        summary={summary}
        isLoading={summaryLoading}
        error={summaryError}
        onRegenerate={() => generateSummary(summaryPage)}
      />

      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        pageNumber={currentPage}
        messages={chatMessages}
        isStreaming={chatStreaming}
        error={chatError}
        onSend={handleChatSend}
        onRetry={handleChatRetry}
        onClear={handleChatClear}
      />

      <PlaybackControls
        visible={isSpeaking}
        isPlaying={isSpeaking}
        isPaused={isPaused}
        currentPage={currentPage}
        totalPages={totalPages}
        rate={speechSettings.rate}
        onPlayPause={() => (isPaused ? resumeSpeak() : pauseSpeak())}
        onStop={stopSpeak}
        onSkipBack={skipBackward}
        onSkipForward={skipForward}
      />

      <div
        ref={containerRef}
        className={cn(
          "flex-1 overflow-auto p-4 sm:p-8 flex justify-center transition-all duration-300",
          sidebarOpen && "sm:pl-52",
          bookmarksOpen && "sm:pr-72"
        )}
      >
        <div className="inline-block animate-scale-in" style={{ perspective: '1200px' }}>
          <div className={cn(
            "pdf-paper rounded-lg overflow-hidden transition-all duration-300",
            false && "opacity-80",
            flipDirection === 'left' && "animate-flip-left",
            flipDirection === 'right' && "animate-flip-right",
          )}>
            <canvas ref={canvasRef} className="block max-w-full h-auto" />
          </div>
        </div>
      </div>

      {/* Mobile navigation overlay */}
      <div className="fixed bottom-4 left-4 right-4 sm:hidden">
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={cn(
              "flex-1 py-4 rounded-xl font-medium transition-all",
              "bg-toolbar text-toolbar-foreground",
              "disabled:opacity-40"
            )}
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={cn(
              "flex-1 py-4 rounded-xl font-medium transition-all",
              "bg-accent text-accent-foreground",
              "disabled:opacity-40"
            )}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
