import React, { useEffect, useRef, useState, useCallback } from 'react';
import { pdfjsLib } from '@/lib/pdfjs';
import { ZoomIn, ZoomOut, Loader2, AlertCircle } from 'lucide-react';
import PDFToolbar from './PDFToolbar';
import ThumbnailSidebar from './ThumbnailSidebar';
import BookmarkPanel from './BookmarkPanel';
import type { ChatMessage } from './ChatPanel';
import PlaybackControls from './PlaybackControls';
import VirtualPdfList from './VirtualPdfList';
import PageFlipBookViewer from '@/components/reader/PageFlipBookViewer';
import { useAuth } from '@/hooks/useAuth';
import { usePDFStorage, type ReadingMode } from '@/hooks/usePDFStorage';
import { generateCoverFromPdfDoc, needsCoverUpdate } from '@/lib/pdfCover';
import { useSpeech } from '@/hooks/useSpeech';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAnnotations, useDocumentId, type AnnotationRect } from '@/hooks/useAnnotations';
import { useFullTextSearch } from '@/hooks/useFullTextSearch';
import SearchPanel from './SearchPanel';
import { useReadingStats } from '@/hooks/useReadingStats';
import { useSyncedBookmarks } from '@/hooks/useSyncedBookmarks';
import { cachePDF } from '@/lib/pdfCache';
import { hashFile } from '@/lib/documentHash';
import { getNextFlipPage, getPrevFlipPage } from '@/lib/flipNavigation';
import { useSpreadLayout } from '@/hooks/use-spread-layout';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Theme } from '@/hooks/useTheme';
import type { SummarizePageResponse, DictionaryEntry } from '@/lib/types/external';
import WordDefinitionPanel, { type WordDefinition } from './WordDefinitionPanel';
import ReaderBackground from '@/components/ReaderBackground';
import { PanelErrorBoundary } from '@/components/PanelErrorBoundary';
import { Button } from '@/components/ui/button';
import AISidePanel, { type AITab } from '@/components/reader/AISidePanel';
import ReaderCommandPalette from '@/components/reader/ReaderCommandPalette';
import KeyboardShortcutsDialog from '@/components/reader/KeyboardShortcutsDialog';
import OutlinePanel from '@/components/reader/OutlinePanel';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { extractPageText as extractPageTextUtil } from '@/lib/pdfText';
import { getTextForScope } from '@/lib/documentTextCache';
import type { ChatScope } from '@/lib/types/external';
import { useStudyDeck } from '@/hooks/useStudyDeck';

interface PDFViewerProps {
  file: File;
  readingMode: ReadingMode;
  onReadingModeChange: (mode: ReadingMode) => void;
  onClose: () => void;
  onGoHome?: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onSelectTheme?: (theme: Theme) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  readingMode,
  onReadingModeChange,
  onClose,
  onGoHome,
  theme,
  onToggleTheme,
  onSelectTheme,
}) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [scrollToken, setScrollToken] = useState(0);
  const [continuousRead, setContinuousRead] = useState(false);
  const continuousRef = useRef(false);
  const totalPagesRef = useRef(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [flipAnimating, setFlipAnimating] = useState(false);
  const flipCancelRef = useRef<(() => void) | null>(null);
  const isMobileViewport = useIsMobile();
  const isSpreadLayout = useSpreadLayout();
  const flipSinglePageView = !isSpreadLayout;
  const [contentHash, setContentHash] = useState<string | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [coverPage, setCoverPage] = useState(1);
  const lastReadPageRef = useRef(1);
  const { addFlashcard } = useStudyDeck(file.name, contentHash);

  const { user } = useAuth();
  const { saveProgress, loadProgress, saveBookMetadata, saveReadingMode } = usePDFStorage();
  const documentId = useDocumentId(file, totalPages);
  const {
    bookmarks,
    isBookmarked: isBookmarkedFn,
    addBookmark: addBookmarkCloud,
    removeBookmark: removeBookmarkCloud,
    syncState,
  } = useSyncedBookmarks(file.name, documentId, contentHash);
  const { annotations, create, update, remove } = useAnnotations(documentId);
  const { search: ftSearch, indexState } = useFullTextSearch(pdfDoc);
  const { recordPageVisit } = useReadingStats(file.name);

  // Record each page the user lands on
  useEffect(() => {
    if (totalPages > 0) recordPageVisit(currentPage);
  }, [currentPage, totalPages, recordPageVisit]);
  const {
    voices, settings: speechSettings, setSettings: setSpeechSettings,
    speak, stop: stopSpeak, pause: pauseSpeak, resume: resumeSpeak,
    skipForward, skipBackward, isSpeaking, isPaused, unsupported: speechUnsupported,
  } = useSpeech();

  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiTab, setAiTab] = useState<AITab>('chat');
  const [chatScope, setChatScope] = useState<ChatScope>('page');
  const [chatRangeEnd, setChatRangeEnd] = useState(1);
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [isLg, setIsLg] = useState(false);

  const summaryOpen = aiPanelOpen && aiTab === 'summary';
  const chatOpen = aiPanelOpen && aiTab === 'chat';

  const openAI = useCallback((tab: AITab = 'chat') => {
    setAiTab(tab);
    setAiPanelOpen(true);
  }, []);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryPage, setSummaryPage] = useState<number>(1);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatStreaming, setChatStreaming] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const fn = () => setIsLg(mq.matches);
    fn();
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatAbortRef = useRef<AbortController | null>(null);
  const chatPageRef = useRef<number>(1);
  const chatStreamingRef = useRef(false);
  const chatMessagesRef = useRef<ChatMessage[]>(chatMessages);

  useEffect(() => { chatMessagesRef.current = chatMessages; }, [chatMessages]);

  const [definitionOpen, setDefinitionOpen] = useState(false);
  const [definitionWord, setDefinitionWord] = useState<string | null>(null);
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);
  const [definitionError, setDefinitionError] = useState<string | null>(null);
  const lastDefinitionWordRef = useRef<string | null>(null);
  const lastDefinitionContextRef = useRef<string>('');
  const definitionAbortRef = useRef<AbortController | null>(null);

  useEffect(() => { continuousRef.current = continuousRead; }, [continuousRead]);
  useEffect(() => { totalPagesRef.current = totalPages; }, [totalPages]);

  useEffect(() => {
    if (readingMode !== 'flip') setFlipAnimating(false);
  }, [readingMode]);

  const currentPageBookmarked = isBookmarkedFn(currentPage);

  useEffect(() => {
    let cancelled = false;
    const loadPDF = async () => {
      setLoadError(null);
      setPdfDoc(null);
      setTotalPages(0);
      try {
        const hash = await hashFile(file);
        if (cancelled) return;
        setContentHash(hash);

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        if (cancelled) return;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        cachePDF(file.name, file, hash);

        const saved = loadProgress(file.name, hash);
        const resolvedCover = saved?.coverPage ?? 1;
        setCoverPage(resolvedCover);
        if (saved && saved.currentPage <= pdf.numPages) {
          const startPage = saved.currentPage < resolvedCover ? resolvedCover : saved.currentPage;
          setCurrentPage(startPage);
          setScrollToken(t => t + 1);
        }

        if (needsCoverUpdate(saved)) {
          generateCoverFromPdfDoc(pdf)
            .then((cover) => {
              if (!cancelled) {
                saveBookMetadata(file.name, hash, {
                  coverThumbnail: cover.thumbnail,
                  spineColor: cover.spineColor,
                  coverPage: cover.coverPage,
                  coverMetaVersion: cover.coverMetaVersion,
                });
                setCoverPage(cover.coverPage);
              }
            })
            .catch(() => { /* cover optional */ });
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Error loading PDF:', error);
        const message = error instanceof Error ? error.message : 'Failed to load PDF.';
        setLoadError(message);
        toast.error('Failed to load PDF. The file may be corrupted or inaccessible.');
      }
    };
    loadPDF();
    return () => { cancelled = true; };
  }, [file, loadProgress, saveBookMetadata, loadAttempt]);

  const handleReadingModeChange = useCallback((mode: ReadingMode) => {
    if (mode === 'flip') {
      setScale(1);
    }
    if (contentHash) {
      saveReadingMode(file.name, contentHash, mode);
    }
    onReadingModeChange(mode);
  }, [contentHash, file.name, saveReadingMode, onReadingModeChange]);

  const handleFlipRenderFailed = useCallback(() => {
    toast.error('Flip mode failed to render pages — switched to scroll mode.');
    handleReadingModeChange('scroll');
  }, [handleReadingModeChange]);

  useEffect(() => {
    if (totalPages === 0 || !contentHash) return;
    saveProgress(file.name, currentPage, totalPages, contentHash);
  }, [currentPage, totalPages, file.name, contentHash, saveProgress]);

  useEffect(() => {
    return () => {
      if (pdfDoc) {
        pdfDoc.destroy();
      }
    };
  }, [pdfDoc]);

  const handlePageChange = useCallback((page: number) => {
    if (readingMode === 'flip' && flipAnimating) return;
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setScrollToken(t => t + 1);
    }
  }, [totalPages, readingMode, flipAnimating]);

  const handleFlipPrev = useCallback(() => {
    handlePageChange(getPrevFlipPage(currentPage, totalPages, flipSinglePageView, coverPage));
  }, [handlePageChange, currentPage, totalPages, flipSinglePageView, coverPage]);

  const handleFlipNext = useCallback(() => {
    handlePageChange(getNextFlipPage(currentPage, totalPages, flipSinglePageView, coverPage));
  }, [handlePageChange, currentPage, totalPages, flipSinglePageView, coverPage]);

  const handleFlipAnimatingChange = useCallback((animating: boolean) => {
    setFlipAnimating((prev) => (prev === animating ? prev : animating));
  }, []);

  const flipNavigationLocked = readingMode === 'flip' && flipAnimating;

  const cancelFlipAnimation = useCallback(() => {
    flipCancelRef.current?.();
    setFlipAnimating(false);
  }, []);

  const handleViewerClose = useCallback(() => {
    cancelFlipAnimation();
    onClose();
  }, [cancelFlipAnimation, onClose]);

  const handleViewerGoHome = useCallback(() => {
    cancelFlipAnimation();
    onGoHome?.();
  }, [cancelFlipAnimation, onGoHome]);

  const handleAddBookmark = useCallback((label: string) => {
    addBookmarkCloud(currentPage, label);
  }, [addBookmarkCloud, currentPage]);

  const handleRemoveBookmark = useCallback((page: number) => {
    removeBookmarkCloud(page);
  }, [removeBookmarkCloud]);

  const extractPageText = useCallback(async (pageNum: number): Promise<string> => {
    if (!pdfDoc) return '';
    return extractPageTextUtil(pdfDoc, pageNum);
  }, [pdfDoc]);

  const readPageRef = useRef(false);
  const readTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset readPageRef when speech stops (handles stop()/cancel() where onEnd doesn't fire)
  useEffect(() => {
    if (!isSpeaking) {
      readPageRef.current = false;
      if (readTimeoutRef.current) {
        clearTimeout(readTimeoutRef.current);
        readTimeoutRef.current = null;
      }
    }
  }, [isSpeaking]);

  const readPage = useCallback(async (pageNum: number) => {
    if (readPageRef.current) return;
    readPageRef.current = true;
    try {
      const text = await extractPageText(pageNum);
      if (!text) {
        readPageRef.current = false;
        if (continuousRef.current && pageNum < totalPagesRef.current) {
          handlePageChange(pageNum + 1);
          readTimeoutRef.current = setTimeout(() => readPage(pageNum + 1), 200);
        } else { toast.info('No readable text on this page'); }
        return;
      }
      speak(text, () => {
        readPageRef.current = false;
        if (continuousRef.current && pageNum < totalPagesRef.current) {
          const next = pageNum + 1;
          handlePageChange(next);
          readTimeoutRef.current = setTimeout(() => readPage(next), 400);
        }
      });
    } catch { readPageRef.current = false; toast.error('Could not read this page'); }
  }, [extractPageText, speak, handlePageChange]);

  const handleToggleRead = useCallback(() => {
    if (isSpeaking) {
      if (isPaused) { resumeSpeak(); } else { pauseSpeak(); }
      return;
    }
    if (!pdfDoc) return;
    readPage(currentPage);
  }, [isSpeaking, isPaused, pdfDoc, currentPage, readPage, pauseSpeak, resumeSpeak]);

  const generateSummary = useCallback(async (pageNum: number) => {
    openAI('summary');
    setSummaryPage(pageNum);
    setSummaryLoading(true);
    setSummaryError(null);
    setSummary(null);
    if (!user) {
      setSummaryError('Sign in to use AI summary.');
      setSummaryLoading(false);
      return;
    }
    if (!supabase) {
      setSummaryError('AI summary is unavailable — Supabase is not configured.');
      setSummaryLoading(false);
      return;
    }
    try {
      const text = await extractPageText(pageNum);
      if (!text) { setSummaryError('No readable text on this page to summarize.'); return; }
      const { data, error } = await supabase.functions.invoke('summarize-page', { body: { text, pageNumber: pageNum } });
      if (error) throw error;
      const result = data as SummarizePageResponse;
      if (result?.error) { setSummaryError(result.error); return; }
      setSummary(result?.summary ?? '');
    } catch (e: unknown) { setSummaryError(e instanceof Error ? e.message : 'Failed to generate summary'); }
    finally { setSummaryLoading(false); }
  }, [extractPageText, user, openAI]);

  const handleSummarize = useCallback(() => {
    openAI('summary');
    generateSummary(currentPage);
  }, [generateSummary, currentPage, openAI]);

  const cancelChatStream = useCallback(() => { chatAbortRef.current?.abort(); chatAbortRef.current = null; }, []);

  const streamChat = useCallback(async (history: ChatMessage[], pageNum: number) => {
    if (chatStreamingRef.current || !pdfDoc) return;
    chatStreamingRef.current = true;
    setChatStreaming(true); setChatError(null); cancelChatStream();
    const controller = new AbortController(); chatAbortRef.current = controller;
    try {
      const hash = contentHash ?? file.name;
      const text = await getTextForScope(
        pdfDoc,
        hash,
        chatScope,
        pageNum,
        chatScope === 'range' ? chatRangeEnd : undefined,
      );
      const useDocChat = chatScope !== 'page';
      if (!supabase) {
        setChatError('AI chat is unavailable — Supabase is not configured.');
        setChatStreaming(false);
        return;
      }
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${useDocChat ? 'chat-document' : 'chat-page'}`;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setChatError('Sign in to use AI chat.');
        setChatStreaming(false);
        return;
      }
      const body = useDocChat
        ? {
            text,
            scope: chatScope,
            pageNumber: pageNum,
            pageStart: pageNum,
            pageEnd: chatScope === 'range' ? chatRangeEnd : undefined,
            messages: history,
          }
        : { pageText: text, pageNumber: pageNum, messages: history };
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!resp.ok || !resp.body) {
        let msg = 'Failed to start chat';
        try { const j = await resp.json(); msg = j?.error || msg; } catch {
          // ignore parse errors
        }
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
          } catch { /* skip malformed lines */ continue; }
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') setChatError(e.message);
    } finally { setChatStreaming(false); chatStreamingRef.current = false; chatAbortRef.current = null; }
  }, [pdfDoc, contentHash, file.name, chatScope, chatRangeEnd, cancelChatStream]);

  const handleChatSend = useCallback((text: string) => {
    const next = [...chatMessagesRef.current, { role: 'user' as const, content: text }];
    setChatMessages(next);
    chatMessagesRef.current = next;
    streamChat(next, chatPageRef.current);
  }, [streamChat]);

  const handleChatRetry = useCallback(() => {
    const cleaned = [...chatMessagesRef.current];
    if (cleaned[cleaned.length - 1]?.role === 'assistant' && !cleaned[cleaned.length - 1].content) cleaned.pop();
    if (cleaned.length === 0) return;
    setChatMessages(cleaned);
    chatMessagesRef.current = cleaned;
    streamChat(cleaned, chatPageRef.current);
  }, [streamChat]);

  const chatOpenRef = useRef(aiPanelOpen && aiTab === 'chat');
  chatOpenRef.current = aiPanelOpen && aiTab === 'chat';
  const chatScopeRef = useRef(chatScope);
  chatScopeRef.current = chatScope;

  useEffect(() => {
    if (chatPageRef.current !== currentPage && chatScopeRef.current === 'page') {
      if (chatOpenRef.current && chatMessages.length > 0) {
        toast.info('Chat cleared — it is specific to each page.');
      }
      chatPageRef.current = currentPage;
      cancelChatStream();
      setChatMessages([]); setChatError(null); setChatStreaming(false);
    } else if (chatPageRef.current !== currentPage) {
      chatPageRef.current = currentPage;
    }
  }, [currentPage, cancelChatStream, chatMessages.length]);

  useEffect(() => {
    setChatRangeEnd((e) => Math.max(e, currentPage));
  }, [currentPage, totalPages]);

  const handleChatClear = useCallback(() => { cancelChatStream(); setChatMessages([]); setChatError(null); }, [cancelChatStream]);

  const chatScopeLabel =
    chatScope === 'document'
      ? 'Whole document'
      : chatScope === 'range'
        ? `Pages ${currentPage}–${chatRangeEnd}`
        : `Page ${currentPage} • answers from current page only`;
  useEffect(() => {
    if (isSpeaking && !continuousRef.current && currentPage !== lastReadPageRef.current) stopSpeak();
    lastReadPageRef.current = currentPage;
  }, [currentPage, isSpeaking, stopSpeak]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+F → open search (works even inside inputs)
      if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        if (searchOpen) setSearchOpen(false);
        else if (definitionOpen) setDefinitionOpen(false);
        else if (outlineOpen) setOutlineOpen(false);
        else if (aiPanelOpen) setAiPanelOpen(false);
        else handleViewerClose();
        return;
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShortcutsOpen(true);
        return;
      }
      if (readingMode === 'flip' && flipAnimating) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (readingMode === 'flip') handleFlipPrev();
        else handlePageChange(currentPage - 1);
      }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        if (readingMode === 'flip') handleFlipNext();
        else handlePageChange(currentPage + 1);
      }
      else if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!currentPageBookmarked) handleAddBookmark(`Page ${currentPage}`);
        else handleRemoveBookmark(currentPage);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, handlePageChange, handleFlipPrev, handleFlipNext, handleViewerClose, currentPageBookmarked, handleAddBookmark, handleRemoveBookmark, searchOpen, definitionOpen, outlineOpen, aiPanelOpen, readingMode, flipAnimating]);

  const handleAddToStudyDeck = useCallback((quote: string, page: number) => {
    if (!user) {
      toast.info('Sign in to add to your study deck.', {
        action: { label: 'Sign in', onClick: () => { window.location.href = '/auth'; } },
      });
      return;
    }
    addFlashcard({ front: quote, back: `Page ${page} — review this passage` });
    toast.success('Added to study deck');
    openAI('study');
  }, [user, addFlashcard, openAI]);

  const canAnnotate = !!user && !!documentId;
  const handleCreateHighlight = useCallback((page: number, color: string, rects: AnnotationRect[], quote: string) => {
    if (!user) { toast.info('Sign in to save highlights and notes.'); return; }
    if (!documentId) return;
    create({ page_number: page, type: 'highlight', color, rects, quote, note_text: null });
  }, [user, documentId, create]);

  const handleCreateNote = useCallback((page: number, rects: AnnotationRect[], quote: string) => {
    if (!user) { toast.info('Sign in to save highlights and notes.'); return; }
    if (!documentId) return;
    create({ page_number: page, type: 'note', color: 'yellow', rects, quote, note_text: '' });
  }, [user, documentId, create]);

  // Score how well a meaning matches the surrounding context
  const scoreMeaning = useCallback((meaning: { definition: string; example?: string; domain?: string }, context: string): number => {
    if (!context) return 0;
    const ctxLower = context.toLowerCase();
    let score = 0;
    // domain / part of speech match
    if (meaning.domain && ctxLower.includes(meaning.domain.toLowerCase())) score += 3;
    // words in the definition that appear in context (deduplicated)
    const defWords = [...new Set(meaning.definition.toLowerCase().split(/\s+/).filter(w => w.length > 3))];
    for (const w of defWords) {
      if (ctxLower.includes(w)) score += 1;
    }
    // example match
    if (meaning.example && ctxLower.includes(meaning.example.toLowerCase().slice(0, 20))) score += 2;
    return score;
  }, []);

  const fetchDefinition = useCallback(async (selectedText: string, context: string) => {
    const words = selectedText.match(/[\p{L}]+(?:['-][\p{L}]+)*/gu);
    const word = words?.[0] || selectedText.trim();
    setDefinitionOpen(true);
    setDefinitionWord(word);
    setDefinitionLoading(true);
    setDefinitionError(null);
    setDefinition(null);
    lastDefinitionWordRef.current = word;
    lastDefinitionContextRef.current = context;
    // Cancel any in-flight definition request
    definitionAbortRef.current?.abort();
    const controller = new AbortController();
    definitionAbortRef.current = controller;
    try {
      const resp = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { signal: controller.signal });
      if (!resp.ok) {
        if (resp.status === 404) throw new Error(`No definition found for "${word}"`);
        throw new Error(`Dictionary lookup failed (${resp.status})`);
      }
      const data: DictionaryEntry[] = await resp.json();
      const entry = data[0];
      if (!entry) throw new Error(`No definition found for "${word}"`);

      const entryMeanings = entry.meanings ?? [];
      const meanings = entryMeanings.flatMap((m) =>
        (m.definitions || []).map((d) => ({
          definition: d.definition,
          example: d.example || undefined,
          domain: m.partOfSpeech,
        }))
      ) || [];

      // Sort meanings by contextual relevance
      const sorted = [...meanings].sort((a, b) => scoreMeaning(b, context) - scoreMeaning(a, context));
      const best = sorted[0];
      const article = best?.domain ? (/^[aeiou]/i.test(best.domain) ? 'an' : 'a') : 'a';
      const contextualNote = context && best && scoreMeaning(best, context) > 0
        ? `Based on the surrounding text, "${word}" is used here as ${article} ${best.domain || 'sense'}${best.definition ? ': ' + best.definition.split('.')[0] : ''}.`
        : undefined;

      const allSynonyms = [...new Set<string>(entryMeanings.flatMap((m) => m.synonyms || []) || [])];
      const allAntonyms = [...new Set<string>(entryMeanings.flatMap((m) => m.antonyms || []) || [])];

      setDefinition({
        word: word,
        canonical: entry.word !== word ? entry.word : undefined,
        phonetic: entry.phonetic || entry.phonetics?.[0]?.text || undefined,
        partOfSpeech: sorted[0]?.domain || entry.meanings?.[0]?.partOfSpeech || undefined,
        meanings: sorted,
        synonyms: allSynonyms.length > 0 ? allSynonyms : undefined,
        antonyms: allAntonyms.length > 0 ? allAntonyms : undefined,
        contextualNote,
      });
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setDefinitionError(e instanceof Error ? e.message : 'Failed to fetch definition');
    } finally {
      if (definitionAbortRef.current === controller) {
        definitionAbortRef.current = null;
      }
      setDefinitionLoading(false);
    }
  }, [scoreMeaning]);

  const handleDefineWord = useCallback((word: string, context: string) => {
    fetchDefinition(word, context);
  }, [fetchDefinition]);

  // ponytail: tear down speech/streams on route exit so navigate can commit
  useEffect(() => {
    return () => {
      cancelFlipAnimation();
      setFlipAnimating(false);
      stopSpeak();
      cancelChatStream();
      definitionAbortRef.current?.abort();
      definitionAbortRef.current = null;
    };
  }, [stopSpeak, cancelChatStream, cancelFlipAnimation]);

  const studyAnnotations = annotations.map((a) => ({
    quote: a.quote,
    page_number: a.page_number,
  }));

  const pdfContent = pdfDoc ? (
    readingMode === 'scroll' ? (
      <VirtualPdfList
        pdfDoc={pdfDoc} totalPages={totalPages} scale={scale}
        currentPage={currentPage}
        onVisiblePageChange={setCurrentPage}
        scrollToToken={scrollToken}
        annotations={annotations}
        canAnnotate={canAnnotate}
        onCreateHighlight={handleCreateHighlight}
        onCreateNote={handleCreateNote}
        onDeleteAnnotation={remove}
        onUpdateAnnotation={update}
        onDefineWord={handleDefineWord}
        onAddToStudyDeck={user ? handleAddToStudyDeck : undefined}
      />
    ) : (
      <PageFlipBookViewer
        pdfDoc={pdfDoc}
        totalPages={totalPages}
        currentPage={currentPage}
        coverPage={coverPage}
        singlePageView={flipSinglePageView}
        onPageChange={handlePageChange}
        onAnimatingChange={handleFlipAnimatingChange}
        onRenderFailed={handleFlipRenderFailed}
        flipCancelRef={flipCancelRef}
      />
    )
  ) : loadError ? (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertCircle className="w-10 h-10 text-destructive" aria-hidden />
      <div>
        <p className="text-sm font-medium text-foreground">Could not open this PDF</p>
        <p className="type-caption mt-1 max-w-sm">{loadError}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="default" onClick={() => setLoadAttempt(a => a + 1)}>
          Try again
        </Button>
        <Button variant="outline" onClick={handleViewerClose}>
          Back to library
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex-1 flex items-center justify-center text-muted-foreground gap-2">
      <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
      Loading…
    </div>
  );

  const aiSidePanel = (
    <AISidePanel
      isOpen={aiPanelOpen}
      onClose={() => setAiPanelOpen(false)}
      activeTab={aiTab}
      onTabChange={setAiTab}
      embedded={isLg && aiPanelOpen}
      aiEnabled={!!user}
      pageNumber={currentPage}
      chatMessages={chatMessages}
      chatStreaming={chatStreaming}
      chatError={chatError}
      onChatSend={handleChatSend}
      onChatRetry={handleChatRetry}
      onChatClear={handleChatClear}
      chatScopeLabel={chatScopeLabel}
      onChatScopeChange={setChatScope}
      chatScope={chatScope}
      chatRangeEnd={chatRangeEnd}
      onChatRangeEndChange={setChatRangeEnd}
      summaryPage={summaryPage}
      summary={summary}
      summaryLoading={summaryLoading}
      summaryError={summaryError}
      onRegenerateSummary={() => generateSummary(summaryPage)}
      fileName={file.name}
      contentHash={contentHash}
      annotations={studyAnnotations}
      extractPageText={extractPageText}
      totalPages={totalPages}
    />
  );

  return (
    <div className="flex flex-col h-screen bg-muted animate-fade-in safe-area-bottom relative overflow-hidden">
      {/* Animated background effects */}
      <ReaderBackground />

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
        onToggleChat={() => {
          if (aiPanelOpen && aiTab === 'chat') setAiPanelOpen(false);
          else openAI('chat');
        }} chatOpen={chatOpen}
        onToggleSearch={() => setSearchOpen(p => !p)} searchOpen={searchOpen}
        onToggleOutline={() => setOutlineOpen(p => !p)} outlineOpen={outlineOpen}
        onClose={handleViewerClose}
        onGoHome={onGoHome ? handleViewerGoHome : undefined}
        speechUnsupported={speechUnsupported}
        readingMode={readingMode}
        onReadingModeChange={handleReadingModeChange}
        navigationLocked={flipNavigationLocked}
        onPrevPage={readingMode === 'flip' ? handleFlipPrev : undefined}
        onNextPage={readingMode === 'flip' ? handleFlipNext : undefined}
        aiEnabled={!!user}
      />

      <ThumbnailSidebar
        pdfDoc={pdfDoc} currentPage={currentPage} totalPages={totalPages}
        onPageSelect={handlePageChange} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(p => !p)}
        navigationLocked={flipNavigationLocked}
      />

      <BookmarkPanel
        bookmarks={bookmarks} currentPage={currentPage} isCurrentPageBookmarked={currentPageBookmarked}
        onAddBookmark={handleAddBookmark} onRemoveBookmark={handleRemoveBookmark}
        onGoToBookmark={handlePageChange} isOpen={bookmarksOpen} onClose={() => setBookmarksOpen(false)}
        syncState={syncState}
        navigationLocked={flipNavigationLocked}
      />

      <PanelErrorBoundary name="Word Definition">
        <WordDefinitionPanel
          isOpen={definitionOpen}
          onClose={() => setDefinitionOpen(false)}
          word={definitionWord}
          definition={definition}
          isLoading={definitionLoading}
          error={definitionError}
          onRetry={() => lastDefinitionWordRef.current && fetchDefinition(lastDefinitionWordRef.current, lastDefinitionContextRef.current)}
        />
      </PanelErrorBoundary>

      <PanelErrorBoundary name="Search">
        <SearchPanel
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSearch={ftSearch}
          indexReady={indexState.ready}
          indexProgress={indexState.progress}
          onJumpToPage={(p) => { handlePageChange(p); if (isMobileViewport) setSearchOpen(false); }}
          navigationLocked={flipNavigationLocked}
        />
      </PanelErrorBoundary>

      <PlaybackControls
        visible={isSpeaking} isPlaying={isSpeaking} isPaused={isPaused}
        currentPage={currentPage} totalPages={totalPages} rate={speechSettings.rate}
        onPlayPause={() => (isPaused ? resumeSpeak() : pauseSpeak())}
        onStop={stopSpeak} onSkipBack={skipBackward} onSkipForward={skipForward}
      />

      {/* Mobile backdrop for open side panels */}
      {isMobileViewport && (sidebarOpen || bookmarksOpen) && (
        <button
          aria-label="Close panels"
          onClick={() => { setSidebarOpen(false); setBookmarksOpen(false); }}
          className="fixed inset-0 z-30 bg-black/40 sm:hidden animate-fade-in"
        />
      )}

      {/* Floating zoom controls on mobile/tablet (scroll mode only) */}
      {pdfDoc && readingMode === 'scroll' && (
        <div className={cn("fixed right-4 z-30 flex flex-col gap-2 lg:hidden", isSpeaking ? "bottom-24" : "bottom-4")}>
          <button
            onClick={() => setScale(s => Math.min(3, s + 0.25))}
            disabled={scale >= 3}
            className="p-3 rounded-full bg-toolbar text-toolbar-foreground shadow-lg disabled:opacity-40"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <div className="text-[10px] text-center text-toolbar-foreground/80 bg-toolbar/80 rounded-full px-2 py-0.5 shadow">
            {Math.round(scale * 100)}%
          </div>
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
            disabled={scale <= 0.5}
            className="p-3 rounded-full bg-toolbar text-toolbar-foreground shadow-lg disabled:opacity-40"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className={cn(
        "flex-1 flex min-h-0 transition-all duration-300",
        sidebarOpen && "sm:pl-52",
        bookmarksOpen && "sm:pr-72",
      )}>
        {isLg && aiPanelOpen ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={65} minSize={35}>
              <div className="flex flex-col h-full min-h-0">{pdfContent}</div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={35} minSize={20}>
              <PanelErrorBoundary name="AI">{aiSidePanel}</PanelErrorBoundary>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">{pdfContent}</div>
        )}
      </div>

      {!isLg && (
        <PanelErrorBoundary name="AI">{aiSidePanel}</PanelErrorBoundary>
      )}

      <OutlinePanel
        pdfDoc={pdfDoc}
        isOpen={outlineOpen}
        onClose={() => setOutlineOpen(false)}
        onGoToPage={handlePageChange}
      />

      <ReaderCommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenOutline={() => setOutlineOpen(true)}
        onOpenAI={openAI}
        onToggleReadAloud={handleToggleRead}
        onToggleBookmark={() => {
          if (!currentPageBookmarked) handleAddBookmark(`Page ${currentPage}`);
          else handleRemoveBookmark(currentPage);
        }}
        isBookmarked={currentPageBookmarked}
        onGoHome={onGoHome ? handleViewerGoHome : undefined}
        isSignedIn={!!user}
      />

      <KeyboardShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
};

export default PDFViewer;
