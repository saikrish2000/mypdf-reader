import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useVirtualizer } from '@tanstack/react-virtual';
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

const VirtualPdfList: React.FC<VirtualPdfListProps> = ({
  pdfDoc, totalPages, scale, currentPage, onVisiblePageChange, scrollToToken,
  annotations, canAnnotate, onCreateHighlight, onCreateNote, onDeleteAnnotation, onUpdateAnnotation,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState<number[]>([]);

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

  const virtualizer = useVirtualizer({
    count: totalPages,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => (heights[i] ?? DEFAULT_HEIGHT) + GAP,
    overscan: 2,
  });

  // Re-measure when heights change
  useEffect(() => { virtualizer.measure(); }, [heights, virtualizer]);

  // External jump
  useEffect(() => {
    if (scrollToToken < 0) return;
    virtualizer.scrollToIndex(currentPage - 1, { align: 'start' });
  }, [scrollToToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track visible page
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const onScroll = () => {
      const items = virtualizer.getVirtualItems();
      if (!items.length) return;
      const center = el.scrollTop + el.clientHeight / 2;
      const found = items.find(v => v.start <= center && v.end >= center) ?? items[0];
      const page = found.index + 1;
      if (page !== currentPage) onVisiblePageChange(page);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [virtualizer, currentPage, onVisiblePageChange]);

  return (
    <div ref={parentRef} className="flex-1 overflow-auto p-4 sm:p-8">
      <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map(v => (
          <div
            key={v.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${v.start}px)`,
              paddingBottom: GAP,
            }}
          >
            <PageRenderer
              pdfDoc={pdfDoc}
              pageNumber={v.index + 1}
              scale={scale}
              annotations={annotationsByPage.get(v.index + 1) ?? []}
              canAnnotate={canAnnotate}
              onCreateHighlight={onCreateHighlight}
              onCreateNote={onCreateNote}
              onDeleteAnnotation={onDeleteAnnotation}
              onUpdateAnnotation={onUpdateAnnotation}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualPdfList;
