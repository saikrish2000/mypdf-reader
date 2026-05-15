import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import PDFToolbar from './PDFToolbar';
import ThumbnailSidebar from './ThumbnailSidebar';
import BookmarkPanel from './BookmarkPanel';
import SummaryPanel from './SummaryPanel';
import ChatPanel, { type ChatMessage } from './ChatPanel';
import PlaybackControls from './PlaybackControls';
import VirtualPdfList from './VirtualPdfList';
import { usePDFStorage } from '@/hooks/usePDFStorage';
import { useSpeech } from '@/hooks/useSpeech';
import { useAnnotations, useDocumentId, type AnnotationRect } from '@/hooks/useAnnotations';
import { cachePDF } from '@/lib/pdfCache';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Theme } from '@/hooks/useTheme';
import WordDefinitionPanel from './WordDefinitionPanel';
import type { WordDefinition } from './WordDefinitionPanel';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

interface PDFViewerProps {
  file: File;
  onClose: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onSelectTheme?: (theme: Theme) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file, onClose, theme, onToggleTheme, onSelectTheme }) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [scrollToken, setScrollToken] = useState(0);
  const [continuousRead, setContinuousRead] = useState(false);
  const continuousRef = useRef(false);
  const totalPagesRef = useRef(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [bookmarkVersion, setBookmarkVersion] = useState(0);

  const { saveProgress, loadProgress, getBookmarks, addBookmark, removeBookmark, isBookmarked } = usePDFStorage();
  const documentId = useDocumentId(file, totalPages);
  const { annotations, create, update, remove } = useAnnotations(documentId);
  const {
    voices, settings: speechSettings, setSettings: setSpeechSettings,
    speak, stop: stopSpeak, pause: pauseSpeak, resume: resumeSpeak,
    skipForward, skipBackward, isSpeaking, isPaused,
  } = useSpeech();

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryPage, setSummaryPage] = useState<number>(1);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatStreaming, setChatStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatAbortRef = useRef<AbortController | null>(null);
  const chatPageRef = useRef<number>(1);

  const [definitionOpen, setDefinitionOpen] = useState(false);
  const [definitionWord, setDefinitionWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);
  const [definitionError, setDefinitionError] = useState<string | null>(null);
  const lastDefinitionWordRef = useRef<string | null>(null);

  useEffect(() => { continuousRef.current = continuousRead; }, [continuousRead]);
  useEffect(() => { totalPagesRef.current = totalPages; }, [totalPages]);

  const bookmarks = getBookmarks(file.name);
  const currentPageBookmarked = isBookmarked(file.name, currentPage);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        cachePDF(file.name, file);
        const saved = loadProgress(file.name);
        if (saved && saved.currentPage <= pdf.numPages) {
          setCurrentPage(saved.currentPage);
          setScrollToken(t => t + 1);
        }
      } catch (error) { console.error('Error loading PDF:', error); }
    };
    loadPDF();
  }, [file, loadProgress]);

  useEffect(() => { saveProgress(file.name, currentPage, totalPages); }, [currentPage, totalPages, file.name, saveProgress]);

  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setScrollToken(t => t + 1);
    }
  }, [totalPages]);

  const handleAddBookmark = useCallback((label: string) => {
    addBookmark(file.name, currentPage, label);
    setBookmarkVersion(v => v + 1);
  }, [addBookmark, file.name, currentPage]);

  const handleRemoveBookmark = useCallback((page: number) => {
    removeBookmark(file.name, page);
    setBookmarkVersion(v => v + 1);
  }, [removeBookmark, file.name]);

  const extractPageText = useCallback(async (pageNum: number): Promise<string> => {
    if (!pdfDoc) return '';
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    return textContent.items.map((item: any) => ('str' in item ? item.str : '')).join(' ').replace(/\s+/g, ' ').trim();
  }, [pdfDoc]);

  const readPage = useCallback(async (pageNum: number) => {
    try {
      const text = await extractPageText(pageNum);
      if (!text) {
        if (continuousRef.current && pageNum < totalPagesRef.current) {
          handlePageChange(pageNum + 1);
          setTimeout(() => readPage(pageNum + 1), 200);
        } else { toast.info('No readable text on this page'); }
        return;
      }
      speak(text, () => {
        if (continuousRef.current && pageNum < totalPagesRef.current) {
          const next = pageNum + 1;
          handlePageChange(next);
          setTimeout(() => readPage(next), 400);
        }
      });
    } catch (e) { toast.error('Could not read this page'); }
  }, [extractPageText, speak, handlePageChange]);

  const handleToggleRead = useCallback(() => {
    if (isSpeaking) { isPaused ? resumeSpeak() : pauseSpeak(); return; }
    if (!pdfDoc) return;
    readPage(currentPage);
  }, [isSpeaking, isPaused, pdfDoc, currentPage, readPage, pauseSpeak, resumeSpeak]);

  const generateSummary = useCallback(async (pageNum: number) => {
    setSummaryOpen(true); setSummaryPage(pageNum); setSummaryLoading(true); setSummaryError(null); setSummary(null);
    try {
      const text = await extractPageText(pageNum);
      if (!text) { setSummaryError('No readable text on this page to summarize.'); return; }
      const { data, error } = await supabase.functions.invoke('summarize-page', { body: { text, pageNumber: pageNum } });
      if (error) throw error;
      if ((data as any)?.error) { setSummaryError((data as any).error); return; }
      setSummary((data as any)?.summary ?? '');
    } catch (e: any) { setSummaryError(e?.message || 'Failed to generate summary'); }
    finally { setSummaryLoading(false); }
  }, [extractPageText]);

  const handleSummarize = useCallback(() => generateSummary(currentPage), [generateSummary, currentPage]);

  const cancelChatStream = useCallback(() => { chatAbortRef.current?.abort(); chatAbortRef.current = null; }, []);

  const streamChat = useCallback(async (history: ChatMessage[], pageNum: number) => {
    setChatStreaming(true); setChatError(null); cancelChatStream();
    const controller = new AbortController(); chatAbortRef.current = controller;
    try {
      const pageText = await extractPageText(pageNum);
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-page`;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pageText, pageNumber: pageNum, messages: history }),
        signal: controller.signal,
      });
      if (!resp.ok || !resp.body) {
        let msg = 'Failed to start chat';
        try { const j = await resp.json(); msg = j?.error || msg; } catch {}
        if (resp.status === 429) msg = msg || 'AI is busy.';
        if (resp.status === 402) msg = 'AI credits exhausted.';
        setChatError(msg); setChatStreaming(false); return;
      }
      setChatMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = ''; let done = false; let assistantSoFar = '';
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl); buffer = buffer.slice(nl + 1);
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
                const next = [...prev]; const last = next[next.length - 1];
                if (last && last.role === 'assistant') next[next.length - 1] = { ...last, content: assistantSoFar };
                return next;
              });
            }
          } catch { buffer = line + '\n' + buffer; break; }
        }
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') setChatError(e?.message || 'Chat failed');
    } finally { setChatStreaming(false); chatAbortRef.current = null; }
  }, [extractPageText, cancelChatStream]);

  const handleChatSend = useCallback((text: string) => {
    const next = [...chatMessages, { role: 'user' as const, content: text }];
    setChatMessages(next);
    streamChat(next, chatPageRef.current);
  }, [chatMessages, streamChat]);

  const handleChatRetry = useCallback(() => {
    const cleaned = [...chatMessages];
    if (cleaned[cleaned.length - 1]?.role === 'assistant' && !cleaned[cleaned.length - 1].content) cleaned.pop();
    if (cleaned.length === 0) return;
    setChatMessages(cleaned);
    streamChat(cleaned, chatPageRef.current);
  }, [chatMessages, streamChat]);

  const handleChatClear = useCallback(() => { cancelChatStream(); setChatMessages([]); setChatError(null); }, [cancelChatStream]);

  useEffect(() => {
    if (chatPageRef.current !== currentPage) {
      chatPageRef.current = currentPage;
      cancelChatStream();
      setChatMessages([]); setChatError(null); setChatStreaming(false);
    }
  }, [currentPage, cancelChatStream]);

  const lastReadPageRef = useRef(currentPage);
  useEffect(() => {
    if (isSpeaking && !continuousRef.current && currentPage !== lastReadPageRef.current) stopSpeak();
    lastReadPageRef.current = currentPage;
  }, [currentPage, isSpeaking, stopSpeak]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); handlePageChange(currentPage - 1); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); handlePageChange(currentPage + 1); }
      else if (e.key === 'Escape') onClose();
      else if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!currentPageBookmarked) handleAddBookmark(`Page ${currentPage}`);
        else handleRemoveBookmark(currentPage);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, handlePageChange, onClose, currentPageBookmarked, handleAddBookmark, handleRemoveBookmark]);

  // Annotation handlers
  const handleCreateHighlight = useCallback((page: number, color: string, rects: AnnotationRect[], quote: string) => {
    if (!documentId) return;
    create({ page_number: page, type: 'highlight', color, rects, quote, note_text: null });
  }, [documentId, create]);

  const handleCreateNote = useCallback((page: number, rects: AnnotationRect[], quote: string) => {
    if (!documentId) return;
    create({ page_number: page, type: 'note', color: 'yellow', rects, quote, note_text: '' });
  }, [documentId, create]);

  const fetchDefinition = useCallback(async (word: string, context: string) => {
    setDefinitionOpen(true);
    setDefinitionWord(word);
    setDefinitionLoading(true);
    setDefinitionError(null);
    setDefinition(null);
    lastDefinitionWordRef.current = word;
    try {
      const { data, error } = await supabase.functions.invoke('define-word', {
        body: { word, context },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setDefinition((data as any)?.definition ?? null);
    } catch (e: any) {
      setDefinitionError(e?.message || 'Failed to fetch definition');
    } finally {
      setDefinitionLoading(false);
    }
  }, []);

  const handleDefineWord = useCallback((word: string, context: string) => {
    fetchDefinition(word, context);
  }, [fetchDefinition]);

  return (
    <div className="flex flex-col h-screen bg-muted animate-fade-in">
      <PDFToolbar
        currentPage={currentPage} totalPages={totalPages} fileName={file.name} scale={scale}
        onPageChange={handlePageChange} onScaleChange={setScale}
        theme={theme} onToggleTheme={onToggleTheme} onSelectTheme={onSelectTheme}
        onToggleSidebar={() => setSidebarOpen(p => !p)} sidebarOpen={sidebarOpen}
        onToggleBookmarks={() => setBookmarksOpen(p => !p)} bookmarksOpen={bookmarksOpen}
        isCurrentPageBookmarked={currentPageBookmarked}
        isReading={isSpeaking} onToggleRead={handleToggleRead}
        voices={voices} speechSettings={speechSettings} onSpeechSettingsChange={setSpeechSettings}
        continuousRead={continuousRead} onContinuousChange={setContinuousRead}
        onSummarize={handleSummarize} summaryOpen={summaryOpen}
        onToggleChat={() => setChatOpen(p => !p)} chatOpen={chatOpen}
        onClose={onClose}
      />

      <ThumbnailSidebar
        pdfDoc={pdfDoc} currentPage={currentPage} totalPages={totalPages}
        onPageSelect={handlePageChange} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(p => !p)}
      />

      <BookmarkPanel
        bookmarks={bookmarks} currentPage={currentPage} isCurrentPageBookmarked={currentPageBookmarked}
        onAddBookmark={handleAddBookmark} onRemoveBookmark={handleRemoveBookmark}
        onGoToBookmark={handlePageChange} isOpen={bookmarksOpen} onClose={() => setBookmarksOpen(false)}
      />

      <SummaryPanel
        isOpen={summaryOpen} onClose={() => setSummaryOpen(false)} pageNumber={summaryPage}
        summary={summary} isLoading={summaryLoading} error={summaryError}
        onRegenerate={() => generateSummary(summaryPage)}
      />

      <WordDefinitionPanel
        isOpen={definitionOpen}
        onClose={() => setDefinitionOpen(false)}
        word={definitionWord}
        definition={definition}
        isLoading={definitionLoading}
        error={definitionError}
        onRetry={() => lastDefinitionWordRef.current && fetchDefinition(lastDefinitionWordRef.current, '')}
      />

      <ChatPanel
        isOpen={chatOpen} onClose={() => setChatOpen(false)} pageNumber={currentPage}
        messages={chatMessages} isStreaming={chatStreaming} error={chatError}
        onSend={handleChatSend} onRetry={handleChatRetry} onClear={handleChatClear}
      />

      <PlaybackControls
        visible={isSpeaking} isPlaying={isSpeaking} isPaused={isPaused}
        currentPage={currentPage} totalPages={totalPages} rate={speechSettings.rate}
        onPlayPause={() => (isPaused ? resumeSpeak() : pauseSpeak())}
        onStop={stopSpeak} onSkipBack={skipBackward} onSkipForward={skipForward}
      />

      <div className={cn(
        "flex-1 flex flex-col min-h-0 transition-all duration-300",
        sidebarOpen && "sm:pl-52",
        bookmarksOpen && "sm:pr-72",
      )}>
        {pdfDoc ? (
          <VirtualPdfList
            pdfDoc={pdfDoc} totalPages={totalPages} scale={scale}
            currentPage={currentPage}
            onVisiblePageChange={setCurrentPage}
            scrollToToken={scrollToken}
            annotations={annotations}
            canAnnotate={true}
            onCreateHighlight={handleCreateHighlight}
            onCreateNote={handleCreateNote}
            onDeleteAnnotation={remove}
            onUpdateAnnotation={update}
            onDefineWord={handleDefineWord}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading…</div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
