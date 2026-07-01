import React, { useEffect, useRef, useState, useCallback } from 'react';
import { pdfjsLib } from '@/lib/pdfjs';
import 'pdfjs-dist/web/pdf_viewer.css';
import type { Annotation, AnnotationRect } from '@/hooks/useAnnotations';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Trash2, BookOpen, Copy, Sparkles, GraduationCap } from 'lucide-react';
import type { PdfTextItem } from '@/lib/types/external';

export const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: 'rgba(250, 204, 21, 0.40)',
  green: 'rgba(74, 222, 128, 0.40)',
  pink: 'rgba(244, 114, 182, 0.40)',
  blue: 'rgba(96, 165, 250, 0.40)',
};

interface PageRendererProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  annotations: Annotation[];
  canAnnotate: boolean;
  onCreateHighlight: (pageNumber: number, color: string, rects: AnnotationRect[], quote: string) => void;
  onCreateNote: (pageNumber: number, rects: AnnotationRect[], quote: string) => void;
  onDeleteAnnotation: (id: string) => void;
  onUpdateAnnotation: (id: string, patch: Partial<Annotation>) => void;
  onDefineWord: (word: string, context: string) => void;
  onAddToStudyDeck?: (quote: string, pageNumber: number) => void;
}

const PageRenderer: React.FC<PageRendererProps> = ({
  pdfDoc, pageNumber, scale, annotations, canAnnotate,
  onCreateHighlight, onCreateNote, onDeleteAnnotation, onUpdateAnnotation, onDefineWord, onAddToStudyDeck,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const renderCycleRef = useRef(0);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [toolbar, setToolbar] = useState<{ x: number; y: number; rects: AnnotationRect[]; quote: string } | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string | null>(null);
  const selectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();

  // Render canvas + text layer
  useEffect(() => {
    let cancelled = false;
    const cycle = ++renderCycleRef.current;

    (async () => {
      let page: pdfjsLib.PDFPageProxy | null = null;
      let viewport: pdfjsLib.PageViewport | null = null;

      try {
        page = await pdfDoc.getPage(pageNumber);
        viewport = page.getViewport({ scale });
        if (cancelled || renderCycleRef.current !== cycle) return;

        const cssWidth = Math.ceil(viewport.width);
        const cssHeight = Math.ceil(viewport.height);
        setSize({ w: cssWidth, h: cssHeight });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.ceil(viewport.width * outputScale);
        canvas.height = Math.ceil(viewport.height * outputScale);
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, cssWidth, cssHeight);

        if (renderTaskRef.current) renderTaskRef.current.cancel();
        renderTaskRef.current = page.render({
          canvasContext: ctx,
          viewport,
          background: 'rgb(255,255,255)',
        });
        await renderTaskRef.current.promise;
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== 'RenderingCancelledException') console.error(e);
        return;
      }

      // Text layer
      const layer = textLayerRef.current;
      if (layer && page && viewport && !cancelled && renderCycleRef.current === cycle) {
        layer.innerHTML = '';
        layer.style.width = `${Math.ceil(viewport.width)}px`;
        layer.style.height = `${Math.ceil(viewport.height)}px`;
        try {
          const textContent = await page.getTextContent();
          const textLayerDiv = layer;
          textLayerDiv.innerHTML = '';
          const textItems = (textContent.items as unknown as PdfTextItem[]).filter(
            (item): item is PdfTextItem & { str: string } => 'str' in item && Boolean(item.str),
          );
          const textStyles = textContent.styles || {};
          const tx = pdfjsLib.Util.transform(viewport.transform, [1, 0, 0, -1, 0, 0]);
          for (const item of textItems) {
            const tx2 = pdfjsLib.Util.transform(tx, item.transform);
            const style = textStyles[item.fontName] || {};
            const span = document.createElement('span');
            span.textContent = item.str;
            const fontSize = Math.sqrt(tx2[0] * tx2[0] + tx2[1] * tx2[1]);
            span.style.fontSize = `${fontSize}px`;
            span.style.fontFamily = style.fontFamily || 'sans-serif';
            span.style.left = `${tx2[4]}px`;
            span.style.top = `${tx2[5]}px`;
            span.style.whiteSpace = 'pre';
            span.style.position = 'absolute';
            textLayerDiv.appendChild(span);
          }
        } catch (e) {
          console.warn('Text layer render error for page', pageNumber, e);
        }
      }
    })();
    return () => { cancelled = true; renderTaskRef.current?.cancel(); };
  }, [pdfDoc, pageNumber, scale]);

  // Shared: build toolbar from current selection
  const buildToolbar = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !wrapperRef.current) { setToolbar(null); return; }
    const range = sel.getRangeAt(0);
    if (!wrapperRef.current.contains(range.commonAncestorContainer)) { setToolbar(null); return; }

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const clientRects = Array.from(range.getClientRects()).filter(r => r.width > 1 && r.height > 1);
    if (clientRects.length === 0) { setToolbar(null); return; }

    const rects: AnnotationRect[] = clientRects.map(r => ({
      x: (r.left - wrapperRect.left) / scale,
      y: (r.top - wrapperRect.top) / scale,
      w: r.width / scale,
      h: r.height / scale,
    }));

    const last = clientRects[clientRects.length - 1];
    setToolbar({
      x: last.left - wrapperRect.left + last.width / 2,
      y: last.top - wrapperRect.top + last.height + 6,
      rects,
      quote: sel.toString().trim(),
    });
  }, [scale]);

  const handleMouseUp = useCallback(() => {
    if ('ontouchstart' in window) return;
    buildToolbar();
  }, [buildToolbar]);

  // selectionchange listener for mobile touch selection
  useEffect(() => {
    const onSelectionChange = () => {
      if ('ontouchstart' in window) {
        if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
        selectionTimerRef.current = setTimeout(buildToolbar, 300);
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current);
    };
  }, [buildToolbar]);

  const dismissSelection = () => {
    window.getSelection()?.removeAllRanges();
    setToolbar(null);
  };

  // Copy the full text from text nodes, not browser selection (which can be wrong)
  const getSelectionText = useCallback((): string => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !wrapperRef.current) return '';
    const range = sel.getRangeAt(0);
    if (!wrapperRef.current.contains(range.commonAncestorContainer)) return '';
    // same-node case: slice directly from text node
    if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
      const text = range.startContainer.textContent || '';
      return text.slice(range.startOffset, range.endOffset).trim();
    }
    // multi-node: walk all text nodes in the range
    const parts: string[] = [];
    const iter = document.createNodeIterator(range.commonAncestorContainer, NodeFilter.SHOW_TEXT);
    let node: Text | null;
    while ((node = iter.nextNode() as Text | null)) {
      if (!range.intersectsNode(node)) continue;
      const text = node.textContent || '';
      let start = 0, end = text.length;
      if (node === range.startContainer) start = range.startOffset;
      if (node === range.endContainer) end = range.endOffset;
      parts.push(text.slice(start, end));
    }
    return parts.join('').trim();
  }, []);

  const handleCopy = useCallback(async () => {
    const text = getSelectionText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    dismissSelection();
  }, [getSelectionText]);

  // Extract the full word at the selection point from all text nodes in the range,
  // not just the browser-selected substring (which can be wrong in PDF text layers).
  // Handles words split across multiple text spans (common in PDF text layers).
  const getFullWordAtSelection = useCallback((): string => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return '';
    const range = sel.getRangeAt(0);

    // Walk all text nodes in the selection range to reconstruct the full word
    const parts: string[] = [];
    const iter = document.createNodeIterator(range.commonAncestorContainer, NodeFilter.SHOW_TEXT);
    let node: Text | null;
    while ((node = iter.nextNode() as Text | null)) {
      if (!range.intersectsNode(node)) continue;
      const text = node.textContent || '';
      let start = 0, end = text.length;
      if (node === range.startContainer) start = range.startOffset;
      if (node === range.endContainer) end = range.endOffset;
      const fragment = text.slice(start, end);
      if (!fragment) continue;
      // Expand to word boundaries within each text node
      let ws = 0;
      while (ws < fragment.length && /\S/.test(fragment[ws])) ws++;
      let we = fragment.length - 1;
      while (we >= 0 && /\S/.test(fragment[we])) we--;
      parts.push(fragment.slice(ws, we + 1));
    }
    return parts.join('').trim() || sel.toString().trim();
  }, []);

  // Extract surrounding context (~200 chars) from the text layer around the selected word
  const getContextAroundSelection = useCallback((): string => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return '';
    const fullText = textLayerRef.current?.textContent || '';
    if (!fullText) return '';
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    const text = node.textContent || '';
    const offset = range.startOffset;
    // find word boundaries in this text node
    let wordStart = offset;
    while (wordStart > 0 && /\S/.test(text[wordStart - 1])) wordStart--;
    let wordEnd = offset;
    while (wordEnd < text.length && /\S/.test(text[wordEnd])) wordEnd++;
    const word = text.slice(wordStart, wordEnd).trim().toLowerCase();
    if (!word) return '';
    // find the occurrence of this word in the full text (use last index to get closest to selection)
    const wordIdx = fullText.toLowerCase().lastIndexOf(word, fullText.length);
    if (wordIdx === -1) {
      return (fullText.slice(0, 200) + (fullText.length > 200 ? '...' : ''));
    }
    const before = fullText.slice(Math.max(0, wordIdx - 150), wordIdx).trim();
    const after = fullText.slice(wordIdx + word.length, wordIdx + word.length + 50).trim();
    return (before ? before + ' ' : '') + fullText.slice(wordIdx, wordIdx + word.length) + (after ? ' ' + after : '');
  }, []);

  if (!size) {
    const placeholderW = Math.max(120, Math.round(612 * scale));
    const placeholderH = Math.max(160, Math.round(792 * scale));
    return (
      <div
        ref={wrapperRef}
        className="relative pdf-paper rounded-lg overflow-hidden mx-auto bg-paper/80"
        style={{ width: placeholderW, height: placeholderH }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full bg-white" />
        <div ref={textLayerRef} className="textLayer absolute inset-0" />
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="relative pdf-paper rounded-lg overflow-hidden mx-auto"
      style={{ width: size.w, height: size.h }}
      onMouseUp={handleMouseUp}
    >
      <canvas ref={canvasRef} className="block bg-white touch-action-manipulation" />

      {/* Highlight layer (under text for selectability) */}
      <div className="absolute inset-0 pointer-events-none">
        {annotations.filter(a => a.type === 'highlight').flatMap(a =>
          (a.rects || []).map((r, i) => (
            <div
              key={`${a.id}-${i}`}
              className="absolute rounded-sm pointer-events-auto cursor-pointer transition-opacity hover:opacity-80"
              style={{
                left: r.x * scale,
                top: r.y * scale,
                width: r.w * scale,
                height: r.h * scale,
                background: HIGHLIGHT_COLORS[a.color] ?? HIGHLIGHT_COLORS.yellow,
                mixBlendMode: 'multiply',
              }}
              title={a.quote}
              onContextMenu={(e) => { e.preventDefault(); if (window.confirm('Delete this highlight?')) onDeleteAnnotation(a.id); }}
            />
          ))
        )}
      </div>

      {/* Text layer */}
      <div
        ref={textLayerRef}
        className="textLayer absolute inset-0 select-text"
        style={{
          opacity: 0.25,
          color: 'transparent',
          lineHeight: 1,
          zIndex: 2,
          userSelect: 'text',
        }}
      />

      {/* Sticky note pins */}
      {annotations.filter(a => a.type === 'note').map(a => {
        const first = a.rects?.[0];
        if (!first) return null;
        return (
          <div
            key={a.id}
            className="absolute z-10"
            style={{ left: first.x * scale + first.w * scale - 4, top: first.y * scale - 8 }}
          >
            <button
              onClick={() => {
                if (editingNote === a.id) { setEditingNote(null); } else { setEditingNote(a.id); setNoteText(a.note_text); }
              }}
              className="w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center shadow"
              title={a.note_text || 'Note'}
            >📝</button>
            {editingNote === a.id && (
              <div className="absolute top-5 left-0 w-64 bg-card border border-border rounded-lg shadow-lg p-3 z-20">
                <div className="text-xs text-muted-foreground italic mb-2 line-clamp-2">"{a.quote}"</div>
                <textarea
                  value={editingNote === a.id ? (noteText !== null ? noteText : (a.note_text || '')) : ''}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  placeholder="Write a note…"
                  className="w-full text-sm p-2 border border-border rounded bg-background outline-none focus:border-accent resize-none"
                  onBlur={(e) => {
                    const v = e.target.value;
                    if (v !== (a.note_text ?? '')) onUpdateAnnotation(a.id, { note_text: v });
                  }}
                  autoFocus
                />
                <div className="flex justify-between mt-2">
                  <button onClick={() => { onDeleteAnnotation(a.id); setEditingNote(null); }} className="text-xs text-destructive flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                  <button onClick={() => setEditingNote(null)} className="text-xs text-muted-foreground">Close</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Selection toolbar — responsive for mobile */}
      {toolbar && (
        <div
          className="absolute z-30 -translate-x-1/2 bg-card border border-border rounded-xl shadow-lg p-1.5 flex items-center gap-0.5 animate-fade-in max-w-[95vw] overflow-x-auto"
          style={{
            left: toolbar.x,
            top: toolbar.y,
            // on very small screens stick to bottom to avoid going off-screen
            ...(isMobile ? { left: '50%', top: 'auto', bottom: 16, transform: 'translateX(-50%)' } : {}),
          }}
        >
          {canAnnotate ? (
            <>
              {Object.keys(HIGHLIGHT_COLORS).map(c => (
                <button
                  key={c}
                  onClick={() => { onCreateHighlight(pageNumber, c, toolbar.rects, toolbar.quote); dismissSelection(); }}
                  className="w-9 h-9 min-w-[44px] min-h-[44px] rounded-full border border-border hover:scale-110 transition flex-shrink-0 flex items-center justify-center"
                  style={{ background: HIGHLIGHT_COLORS[c] }}
                  title={`Highlight ${c}`}
                />
              ))}
              <div className="w-px h-5 bg-border mx-0.5 flex-shrink-0" />

              <button
                onClick={() => { onCreateNote(pageNumber, toolbar.rects, toolbar.quote); dismissSelection(); }}
                className="text-xs px-3 min-h-[44px] rounded hover:bg-muted flex-shrink-0 flex items-center"
                title="Add sticky note"
              >📝</button>

              <div className="w-px h-5 bg-border mx-0.5 flex-shrink-0" />
            </>
          ) : (
            <span className="text-[10px] px-2 text-muted-foreground whitespace-nowrap">Sign in to highlight</span>
          )}

          {onAddToStudyDeck && (
            <>
              <button
                onClick={() => { onAddToStudyDeck(toolbar.quote.trim(), pageNumber); dismissSelection(); }}
                className="flex items-center gap-1 text-xs px-3 min-h-[44px] rounded hover:bg-violet-500/10 text-violet-400 font-medium flex-shrink-0"
                title="Add to study deck"
              >
                <GraduationCap className="w-3.5 h-3.5" /> Study
              </button>
              <div className="w-px h-5 bg-border mx-0.5 flex-shrink-0" />
            </>
          )}

          <button
            onClick={() => { handleCopy(); }}
            className="flex items-center gap-1 text-xs px-3 min-h-[44px] rounded hover:bg-muted flex-shrink-0"
            title="Copy text"
          >
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>

          <div className="w-px h-5 bg-border mx-0.5 flex-shrink-0" />

          <button
            onClick={() => {
              const word = getFullWordAtSelection();
              const ctx = getContextAroundSelection();
              onDefineWord(word || toolbar.quote.trim(), ctx);
              dismissSelection();
            }}
            className="flex items-center gap-1 text-xs px-3 min-h-[44px] rounded hover:bg-accent/10 text-accent font-medium flex-shrink-0"
            title="Look up meaning"
          >
            <Sparkles className="w-3.5 h-3.5" /> Know Meaning
          </button>
        </div>
      )}
    </div>
  );
};

export default PageRenderer;
