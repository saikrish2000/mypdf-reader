import React, { useEffect, useMemo, useRef, useState } from 'react';
import { pdfjsLib } from '@/lib/pdfjs';
import PageRenderer from './PageRenderer';
import type { Annotation, AnnotationRect } from '@/hooks/useAnnotations';

interface VirtualPdfListProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  totalPages: number;
  scale: number;
  currentPage: number;
  onVisiblePageChange: (page: number) => void;
  scrollToToken: number;
  annotations: Annotation[];
  canAnnotate: boolean;
  onCreateHighlight: (pageNumber: number, color: string, rects: AnnotationRect[], quote: string) => void;
  onCreateNote: (pageNumber: number, rects: AnnotationRect[], quote: string) => void;
  onDeleteAnnotation: (id: string) => void;
  onUpdateAnnotation: (id: string, patch: Partial<Annotation>) => void;
  onDefineWord: (word: string, context: string) => void;
  onAddToStudyDeck?: (quote: string, pageNumber: number) => void;
}

const GAP = 24;
const DEFAULT_HEIGHT = 1000;
const OVERSCAN_PX = 1600;
const BATCH_SIZE = 10;

const VirtualPdfList: React.FC<VirtualPdfListProps> = ({
  pdfDoc, totalPages, scale, currentPage, onVisiblePageChange, scrollToToken,
  annotations, canAnnotate, onCreateHighlight, onCreateNote, onDeleteAnnotation, onUpdateAnnotation, onDefineWord, onAddToStudyDeck,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [heights, setHeights] = useState<number[]>([]);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const isInitialMount = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const arr: number[] = new Array(totalPages).fill(DEFAULT_HEIGHT);
      const first = await pdfDoc.getPage(1);
      const fv = first.getViewport({ scale });
      arr.fill(fv.height);
      if (!cancelled) {
        requestAnimationFrame(() => {
          if (!cancelled) setHeights([...arr]);
        });
      }
      for (let batchStart = 2; batchStart <= totalPages; batchStart += BATCH_SIZE) {
        if (cancelled) return;
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalPages);
        await Promise.all(
          Array.from({ length: batchEnd - batchStart + 1 }, (_, j) =>
            (async () => {
              const pageNum = batchStart + j;
              try {
                const p = await pdfDoc.getPage(pageNum);
                const v = p.getViewport({ scale });
                arr[pageNum - 1] = v.height;
              } catch {
                // ignore individual page measurement failures
              }
            })()
          )
        );
        if (!cancelled) {
          requestAnimationFrame(() => {
            if (!cancelled) setHeights([...arr]);
          });
        }
      }
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
  const pageOffsetsRef = useRef(pageOffsets);
  pageOffsetsRef.current = pageOffsets;
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  const renderedRange = useMemo(() => {
    if (heights.length === 0) {
      return { startIndex: 0, endIndex: -1, topSpacer: 0, bottomSpacer: 0 };
    }
    const paddedTop = Math.max(0, scrollTop - OVERSCAN_PX);
    const paddedBottom = scrollTop + viewportHeight + OVERSCAN_PX;

    let startIndex = 0;
    while (startIndex < totalPages - 1 && pageOffsets[startIndex + 1] < paddedTop) {
      startIndex += 1;
    }

    let endIndex = startIndex;
    while (endIndex < totalPages - 1 && pageOffsets[endIndex + 1] < paddedBottom) {
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
  }, [pageOffsets, scrollTop, totalPages, viewportHeight, heights]);

  const lastJumpTokenRef = useRef<number>(scrollToToken);
  const hasScrolledToInitialRef = useRef(false);

  useEffect(() => {
    if (heights.length === 0) return;
    const el = parentRef.current;
    if (!el) return;
    const totalHeight = pageOffsets[totalPages] ?? 0;
    const maxScroll = Math.max(0, totalHeight - el.clientHeight);
    if (el.scrollTop > maxScroll) {
      el.scrollTop = maxScroll;
      setScrollTop(maxScroll);
    }
  }, [heights, pageOffsets, totalPages]);

  useEffect(() => {
    if (scrollToToken === lastJumpTokenRef.current) return;
    lastJumpTokenRef.current = scrollToToken;
    const target = pageOffsets[currentPage - 1];
    if (target === undefined) return;
    parentRef.current?.scrollTo({ top: target, behavior: 'smooth' });
  }, [scrollToToken, currentPage, pageOffsets]);

  useEffect(() => {
    if (heights.length === 0) return;
    if (hasScrolledToInitialRef.current) return;
    hasScrolledToInitialRef.current = true;
    const el = parentRef.current;
    if (!el) return;
    const target = pageOffsetsRef.current[currentPage - 1];
    if (target === undefined) return;
    el.scrollTop = target;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heights]);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    const updateViewport = () => {
      setScrollTop(el.scrollTop);
      setViewportHeight(el.clientHeight);
      const center = el.scrollTop + el.clientHeight / 2;
      const offsets = pageOffsetsRef.current;
      let page = 1;

      for (let i = 0; i < totalPages; i++) {
        const start = offsets[i] ?? 0;
        const end = offsets[i + 1] ?? start;
        if (center >= start && center < end) {
          page = i + 1;
          break;
        }
        if (center >= end) page = Math.min(totalPages, i + 2);
      }

      if (page !== currentPageRef.current) onVisiblePageChange(page);
    };

    if (isInitialMount.current) {
      updateViewport();
      isInitialMount.current = false;
    }

    el.addEventListener('scroll', updateViewport, { passive: true });

    const resizeObserver = new ResizeObserver(updateViewport);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', updateViewport);
      resizeObserver.disconnect();
    };
  }, [onVisiblePageChange, totalPages]);

  if (heights.length === 0) {
    return (
      <div ref={parentRef} className="flex-1 overflow-auto p-4 sm:p-8 overscroll-none">
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Loading pages...
        </div>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-auto p-4 sm:p-8 overscroll-none">
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
              onDefineWord={onDefineWord}
              onAddToStudyDeck={onAddToStudyDeck}
            />
          </div>
        )})}
      </div>
    </div>
  );
};

export default VirtualPdfList;
