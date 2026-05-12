import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import PageRenderer from './PageRenderer';
import type { Annotation, AnnotationRect } from '@/hooks/useAnnotations';

interface VirtualPdfListProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  totalPages: number;
  scale: number;
  currentPage: number;
  onVisiblePageChange: (page: number) => void;
  scrollToToken: number; // changes when external code wants to jump
  annotations: Annotation[];
  canAnnotate: boolean;
  onCreateHighlight: (pageNumber: number, color: string, rects: AnnotationRect[], quote: string) => void;
  onCreateNote: (pageNumber: number, rects: AnnotationRect[], quote: string) => void;
  onDeleteAnnotation: (id: string) => void;
  onUpdateAnnotation: (id: string, patch: Partial<Annotation>) => void;
}

const GAP = 24;
const DEFAULT_HEIGHT = 1000;
const OVERSCAN_PX = 1600;

const VirtualPdfList: React.FC<VirtualPdfListProps> = ({
  pdfDoc, totalPages, scale, currentPage, onVisiblePageChange, scrollToToken,
  annotations, canAnnotate, onCreateHighlight, onCreateNote, onDeleteAnnotation, onUpdateAnnotation,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState<number[]>([]);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Precompute page heights for current scale
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const arr: number[] = new Array(totalPages).fill(DEFAULT_HEIGHT);
      // Sample first page to estimate, then refine in batches
      const first = await pdfDoc.getPage(1);
      const fv = first.getViewport({ scale });
      arr.fill(fv.height);
      if (!cancelled) setHeights([...arr]);
      // Refine remaining
      for (let i = 2; i <= totalPages; i++) {
        if (cancelled) return;
        try {
          const p = await pdfDoc.getPage(i);
          const v = p.getViewport({ scale });
          arr[i - 1] = v.height;
          if (i % 10 === 0 || i === totalPages) setHeights([...arr]);
        } catch {}
      }
      if (!cancelled) setHeights([...arr]);
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, scale, totalPages]);

  const annotationsByPage = useMemo(() => {
    const m = new Map<number, Annotation[]>();
    for (const a of annotations) {
      const arr = m.get(a.page_number) ?? [];
      arr.push(a);
      m.set(a.page_number, arr);
    }
    return m;
  }, [annotations]);

  const pageOffsets = useMemo(() => {
    const offsets = new Array(totalPages + 1).fill(0);
    for (let i = 0; i < totalPages; i++) {
      offsets[i + 1] = offsets[i] + (heights[i] ?? DEFAULT_HEIGHT) + GAP;
    }
    return offsets;
  }, [heights, totalPages]);

  const renderedRange = useMemo(() => {
    const paddedTop = Math.max(0, scrollTop - OVERSCAN_PX);
    const paddedBottom = scrollTop + viewportHeight + OVERSCAN_PX;

    let startIndex = 0;
    while (startIndex < totalPages - 1 && pageOffsets[startIndex + 1] < paddedTop) {
      startIndex += 1;
    }

    let endIndex = startIndex;
    while (endIndex < totalPages - 1 && pageOffsets[endIndex] < paddedBottom) {
      endIndex += 1;
    }

    const topSpacer = pageOffsets[startIndex] ?? 0;
    const renderedHeight = Math.max(0, (pageOffsets[endIndex + 1] ?? topSpacer) - topSpacer);
    const totalHeight = pageOffsets[totalPages] ?? 0;

    return {
      startIndex,
      endIndex,
      topSpacer,
      bottomSpacer: Math.max(0, totalHeight - topSpacer - renderedHeight),
    };
  }, [pageOffsets, scrollTop, totalPages, viewportHeight]);

  // External jump
  useEffect(() => {
    if (scrollToToken < 0) return;
    parentRef.current?.scrollTo({ top: pageOffsets[currentPage - 1] ?? 0, behavior: 'smooth' });
  }, [currentPage, pageOffsets, scrollToToken]);

  // Track visible page
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    const updateViewport = () => {
      setScrollTop(el.scrollTop);
      setViewportHeight(el.clientHeight);
      const center = el.scrollTop + el.clientHeight / 2;
      let page = 1;

      for (let i = 0; i < totalPages; i++) {
        const start = pageOffsets[i] ?? 0;
        const end = pageOffsets[i + 1] ?? start;
        if (center >= start && center < end) {
          page = i + 1;
          break;
        }
        if (center >= end) page = Math.min(totalPages, i + 2);
      }

      if (page !== currentPage) onVisiblePageChange(page);
    };

    updateViewport();
    el.addEventListener('scroll', updateViewport, { passive: true });

    const resizeObserver = new ResizeObserver(updateViewport);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', updateViewport);
      resizeObserver.disconnect();
    };
  }, [currentPage, onVisiblePageChange, pageOffsets, totalPages]);

  return (
    <div ref={parentRef} className="flex-1 overflow-auto p-4 sm:p-8">
      <div style={{ paddingTop: renderedRange.topSpacer, paddingBottom: renderedRange.bottomSpacer }}>
        {Array.from({ length: renderedRange.endIndex - renderedRange.startIndex + 1 }, (_, offset) => {
          const pageIndex = renderedRange.startIndex + offset;
          return (
          <div key={pageIndex} style={{ paddingBottom: GAP }}>
            <PageRenderer
              pdfDoc={pdfDoc}
              pageNumber={pageIndex + 1}
              scale={scale}
              annotations={annotationsByPage.get(pageIndex + 1) ?? []}
              canAnnotate={canAnnotate}
              onCreateHighlight={onCreateHighlight}
              onCreateNote={onCreateNote}
              onDeleteAnnotation={onDeleteAnnotation}
              onUpdateAnnotation={onUpdateAnnotation}
            />
          </div>
        )})}
      </div>
    </div>
  );
};

export default VirtualPdfList;
