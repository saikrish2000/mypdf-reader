import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';
import type { Annotation, AnnotationRect } from '@/hooks/useAnnotations';
import { cn } from '@/lib/utils';
import { Trash2, BookOpen } from 'lucide-react';

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
}

const PageRenderer: React.FC<PageRendererProps> = ({
  pdfDoc, pageNumber, scale, annotations, canAnnotate,
  onCreateHighlight, onCreateNote, onDeleteAnnotation, onUpdateAnnotation, onDefineWord,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const renderCycleRef = useRef(0);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [toolbar, setToolbar] = useState<{ x: number; y: number; rects: AnnotationRect[]; quote: string } | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);

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
      } catch (e: any) {
        if (e?.name !== 'RenderingCancelledException') console.error(e);
        return;
      }

      // Text layer
      const layer = textLayerRef.current;
      if (layer && page && viewport && !cancelled && renderCycleRef.current === cycle) {
        while (layer.firstChild) layer.removeChild(layer.firstChild);
        layer.style.width = `${Math.ceil(viewport.width)}px`;
        layer.style.height = `${Math.ceil(viewport.height)}px`;
        try {
          const textContent = await page.getTextContent();
          // @ts-ignore - pdfjs has TextLayer in newer versions
          const TextLayer = (pdfjsLib as any).TextLayer;
          if (TextLayer) {
            const tl = new TextLayer({ textContentSource: textContent, container: layer, viewport: viewport.clone({ dontFlip: true }) });
            await tl.render();
          } else {
            // fallback for older pdfjs
            await (pdfjsLib as any).renderTextLayer({
              textContentSource: textContent,
              container: layer,
              viewport: viewport.clone({ dontFlip: true }),
            }).promise;
          }
        } catch (e) {
          // ignore text layer errors
        }
      }
    })();
    return () => { cancelled = true; renderTaskRef.current?.cancel(); };
  }, [pdfDoc, pageNumber, scale]);

  // Selection handler
  const handleMouseUp = useCallback(() => {
    if (!canAnnotate) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !wrapperRef.current) { setToolbar(null); return; }
    const range = sel.getRangeAt(0);
    if (!wrapperRef.current.contains(range.commonAncestorContainer)) { setToolbar(null); return; }

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const clientRects = Array.from(range.getClientRects()).filter(r => r.width > 1 && r.height > 1);
    if (clientRects.length === 0) { setToolbar(null); return; }

    // Convert to PDF user-space units (viewport at scale=1)
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
  }, [canAnnotate, scale]);

  const dismissSelection = () => {
    window.getSelection()?.removeAllRanges();
    setToolbar(null);
  };

  if (!size) {
    return (
      <div
        ref={wrapperRef}
        className="relative pdf-paper rounded-lg overflow-hidden mx-auto bg-paper/80"
        style={{ width: 600, height: 800 }}
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
      <canvas ref={canvasRef} className="block bg-white" />

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
              onContextMenu={(e) => { e.preventDefault(); onDeleteAnnotation(a.id); }}
            />
          ))
        )}
      </div>

      {/* Text layer */}
      <div
        ref={textLayerRef}
        className="textLayer absolute inset-0"
        style={{
          // pdf.js textLayer styles
          opacity: 0.25,
          color: 'transparent',
          lineHeight: 1,
          zIndex: 1,
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
              onClick={() => setEditingNote(editingNote === a.id ? null : a.id)}
              className="w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center shadow"
              title={a.note_text || 'Note'}
            >📝</button>
            {editingNote === a.id && (
              <div className="absolute top-5 left-0 w-64 bg-card border border-border rounded-lg shadow-lg p-3 z-20">
                <div className="text-xs text-muted-foreground italic mb-2 line-clamp-2">"{a.quote}"</div>
                <textarea
                  defaultValue={a.note_text ?? ''}
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

      {/* Selection toolbar */}
      {toolbar && (
        <div
          className="absolute z-30 -translate-x-1/2 bg-card border border-border rounded-lg shadow-lg p-1.5 flex items-center gap-1 animate-fade-in"
          style={{ left: toolbar.x, top: toolbar.y }}
        >
          {Object.keys(HIGHLIGHT_COLORS).map(c => (
            <button
              key={c}
              onClick={() => { onCreateHighlight(pageNumber, c, toolbar.rects, toolbar.quote); dismissSelection(); }}
              className="w-5 h-5 rounded-full border border-border hover:scale-110 transition"
              style={{ background: HIGHLIGHT_COLORS[c] }}
              title={`Highlight ${c}`}
            />
          ))}
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={() => { onCreateNote(pageNumber, toolbar.rects, toolbar.quote); dismissSelection(); }}
            className="text-xs px-2 py-1 rounded hover:bg-muted"
            title="Add sticky note"
          >📝</button>
          {/* Define button — only shown for single-word selections */}
          {toolbar.quote.trim().split(/\s+/).length === 1 && (
            <>
              <div className="w-px h-4 bg-border mx-1" />
              <button
                onClick={() => {
                  onDefineWord(toolbar.quote.trim(), '');
                  dismissSelection();
                }}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-accent/10 text-accent font-medium"
                title="Define this word"
              >
                <BookOpen className="w-3 h-3" /> Define
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PageRenderer;
