import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { pdfjsLib } from '@/lib/pdfjs';
import PageRenderer from '@/components/PageRenderer';
import type { Annotation, AnnotationRect } from '@/hooks/useAnnotations';
import { useSpreadLayout } from '@/hooks/use-spread-layout';
import {
  getSpread,
  isSameSpread,
  shouldSnapFlip,
  getNextFlipPage,
  getPrevFlipPage,
} from '@/lib/flipNavigation';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FlipBookViewerProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  annotations: Annotation[];
  canAnnotate: boolean;
  onCreateHighlight: (pageNumber: number, color: string, rects: AnnotationRect[], quote: string) => void;
  onCreateNote: (pageNumber: number, rects: AnnotationRect[], quote: string) => void;
  onDeleteAnnotation: (id: string) => void;
  onUpdateAnnotation: (id: string, patch: Partial<Annotation>) => void;
  onDefineWord: (word: string, context: string) => void;
  onAnimatingChange?: (animating: boolean) => void;
  flipCancelRef?: React.MutableRefObject<(() => void) | null>;
}

const FLIP_DURATION_MS = 650;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

type FlipAnimation = {
  direction: 'forward' | 'backward';
  leafFront: number;
  leafBack: number;
  staticLeft: number | null;
  staticRight: number | null;
};

function buildFlipAnimation(
  from: number,
  to: number,
  totalPages: number,
  singlePageView: boolean,
): FlipAnimation | null {
  if (from === to) return null;
  const forward = to > from;
  const fromSpread = getSpread(from, totalPages, singlePageView);
  const toSpread = getSpread(to, totalPages, singlePageView);

  if (singlePageView) {
    return {
      direction: forward ? 'forward' : 'backward',
      leafFront: from,
      leafBack: to,
      staticLeft: null,
      staticRight: null,
    };
  }

  if (forward) {
    const leafFront = fromSpread.isCover ? 1 : (fromSpread.right ?? from);
    const leafBack = toSpread.isCover ? 1 : (toSpread.left ?? to);
    return {
      direction: 'forward',
      leafFront,
      leafBack,
      staticLeft: fromSpread.isCover ? null : fromSpread.left,
      // Only show the turning leaf + optional left static; destination right page
      // appears after the flip completes to avoid a third page flashing early.
      staticRight: null,
    };
  }

  const leafFront = fromSpread.isCover ? 1 : (fromSpread.left ?? from);
  const leafBack = toSpread.isCover ? 1 : (toSpread.right ?? to);
  return {
    direction: 'backward',
    leafFront,
    leafBack,
    staticLeft: toSpread.left,
    staticRight: null,
  };
}

interface FlipPageLeafProps {
  front: number;
  back: number;
  direction: 'forward' | 'backward';
  pageProps: (pageNum: number) => React.ComponentProps<typeof PageRenderer>;
  onComplete: () => void;
}

function FlipPageLeaf({ front, back, direction, pageProps, onComplete }: FlipPageLeafProps) {
  const [turned, setTurned] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    setTurned(false);
    completedRef.current = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setTurned(true));
    });
    return () => cancelAnimationFrame(id);
  }, [front, back, direction]);

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== 'transform' || !turned || completedRef.current) return;
    if (e.target !== e.currentTarget) return;
    completedRef.current = true;
    onComplete();
  };

  return (
    <div
      className={cn(
        'flip-page-leaf shrink-0',
        direction === 'forward' ? 'flip-page-leaf--origin-left' : 'flip-page-leaf--origin-right',
        turned && direction === 'forward' && 'flip-page-leaf--turn-forward',
        turned && direction === 'backward' && 'flip-page-leaf--turn-backward',
      )}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="flip-page-leaf__face flip-page-leaf__face--front">
        <PageRenderer {...pageProps(front)} />
      </div>
      <div className="flip-page-leaf__face flip-page-leaf__face--back">
        <PageRenderer {...pageProps(back)} />
      </div>
    </div>
  );
}

const FlipBookViewer: React.FC<FlipBookViewerProps> = ({
  pdfDoc,
  totalPages,
  currentPage,
  onPageChange,
  annotations,
  canAnnotate,
  onCreateHighlight,
  onCreateNote,
  onDeleteAnnotation,
  onUpdateAnnotation,
  onDefineWord,
  onAnimatingChange,
  flipCancelRef,
}) => {
  const isSpreadLayout = useSpreadLayout();
  const singlePageView = !isSpreadLayout;
  const prefersReducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });
  const [pageSize, setPageSize] = useState({ w: 612, h: 792 });
  const [settledPage, setSettledPage] = useState(currentPage);
  const [flipAnim, setFlipAnim] = useState<FlipAnimation | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const isAnimatingRef = useRef(false);
  const flipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;

  const spread = useMemo(
    () => getSpread(settledPage, totalPages, singlePageView),
    [settledPage, totalPages, singlePageView],
  );

  useEffect(() => {
    let cancelled = false;
    pdfDoc.getPage(1).then((page) => {
      if (cancelled) return;
      const v = page.getViewport({ scale: 1 });
      setPageSize({ w: v.width, h: v.height });
    }).catch(() => { /* keep defaults */ });
    return () => { cancelled = true; };
  }, [pdfDoc]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let rafId = 0;
    const measure = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        setContainerSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      });
    };
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    measure();
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  const flipScale = useMemo(() => {
    const padX = 56;
    const padY = 32;
    const pagesInView = singlePageView || spread.isCover ? 1 : 2;
    const spineW = spread.isCover ? 0 : 10;
    const gutter = spread.isCover ? 0 : 6;
    const paperPad = 8;

    const bookW = pagesInView * pageSize.w + spineW + gutter + paperPad;
    const bookH = pageSize.h + paperPad;

    const scaleW = (containerSize.w - padX) / bookW;
    const scaleH = (containerSize.h - padY) / bookH;

    return Math.min(scaleW, scaleH, 1);
  }, [containerSize, pageSize, singlePageView, spread.isCover]);

  const clearFlipTimer = useCallback(() => {
    if (flipTimerRef.current) {
      clearTimeout(flipTimerRef.current);
      flipTimerRef.current = null;
    }
  }, []);

  const finishFlip = useCallback(() => {
    if (!isAnimatingRef.current) return;
    clearFlipTimer();
    isAnimatingRef.current = false;
    setIsAnimating(false);
    setFlipAnim(null);
    setSettledPage(currentPageRef.current);
  }, [clearFlipTimer]);

  const cancelFlip = useCallback(() => {
    clearFlipTimer();
    isAnimatingRef.current = false;
    setIsAnimating(false);
    setFlipAnim(null);
    setSettledPage(currentPageRef.current);
  }, [clearFlipTimer]);

  useEffect(() => {
    if (!flipCancelRef) return;
    flipCancelRef.current = cancelFlip;
    return () => { flipCancelRef.current = null; };
  }, [flipCancelRef, cancelFlip]);

  useEffect(() => {
    if (currentPage === settledPage) return;

    if (
      prefersReducedMotion
      || isSameSpread(settledPage, currentPage, totalPages, singlePageView)
      || shouldSnapFlip(settledPage, currentPage, totalPages, singlePageView)
    ) {
      clearFlipTimer();
      isAnimatingRef.current = false;
      setIsAnimating(false);
      setFlipAnim(null);
      setSettledPage(currentPage);
      return;
    }

    if (isAnimatingRef.current) return;

    const anim = buildFlipAnimation(settledPage, currentPage, totalPages, singlePageView);
    if (!anim) {
      setSettledPage(currentPage);
      return;
    }

    isAnimatingRef.current = true;
    setIsAnimating(true);
    setFlipAnim(anim);
    clearFlipTimer();
    flipTimerRef.current = setTimeout(finishFlip, FLIP_DURATION_MS + 100);
  }, [
    currentPage,
    settledPage,
    prefersReducedMotion,
    totalPages,
    singlePageView,
    finishFlip,
    clearFlipTimer,
  ]);

  const onAnimatingChangeRef = useRef(onAnimatingChange);
  onAnimatingChangeRef.current = onAnimatingChange;
  const lastReportedAnimatingRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (lastReportedAnimatingRef.current === isAnimating) return;
    lastReportedAnimatingRef.current = isAnimating;
    onAnimatingChangeRef.current?.(isAnimating);
  }, [isAnimating]);

  useEffect(() => {
    return () => {
      clearFlipTimer();
      lastReportedAnimatingRef.current = null;
      onAnimatingChangeRef.current?.(false);
    };
  }, [clearFlipTimer]);

  const navigate = useCallback((target: number) => {
    if (isAnimatingRef.current) return;
    if (target >= 1 && target <= totalPages) onPageChange(target);
  }, [totalPages, onPageChange]);

  const goPrev = useCallback(
    () => navigate(getPrevFlipPage(currentPage, totalPages, singlePageView)),
    [navigate, currentPage, totalPages, singlePageView],
  );
  const goNext = useCallback(
    () => navigate(getNextFlipPage(currentPage, totalPages, singlePageView)),
    [navigate, currentPage, totalPages, singlePageView],
  );

  const pageAnnotations = (pageNum: number) =>
    annotations.filter((a) => a.page_number === pageNum);

  const pageProps = useCallback((pageNum: number) => ({
    pdfDoc,
    pageNumber: pageNum,
    scale: flipScale,
    annotations: pageAnnotations(pageNum),
    canAnnotate,
    onCreateHighlight,
    onCreateNote,
    onDeleteAnnotation,
    onUpdateAnnotation,
    onDefineWord,
  }), [
    pdfDoc,
    flipScale,
    annotations,
    canAnnotate,
    onCreateHighlight,
    onCreateNote,
    onDeleteAnnotation,
    onUpdateAnnotation,
    onDefineWord,
  ]);

  const showAnim = flipAnim && !prefersReducedMotion;
  const leafVisible = !!showAnim;
  const isBackwardFlip = showAnim && flipAnim.direction === 'backward';
  const showSpine = isSpreadLayout && !(showAnim ? getSpread(settledPage, totalPages, false).isCover : spread.isCover);

  const staticLeftPage = showAnim
    ? flipAnim!.staticLeft
    : (isSpreadLayout ? spread.left : null);
  const staticRightPage = showAnim
    ? flipAnim!.staticRight
    : spread.right;

  const pageShellClass = (pageNum: number, extra?: string) =>
    cn(
      'flip-book-page shrink-0 rounded-lg transition-shadow duration-200',
      !leafVisible && pageNum === currentPage && 'ring-2 ring-accent/50 ring-offset-2 ring-offset-muted/30',
      extra,
    );

  const renderPage = (pageNum: number, extra?: string) => (
    <div className={pageShellClass(pageNum, extra)}>
      <PageRenderer {...pageProps(pageNum)} />
    </div>
  );

  const leafNode = leafVisible ? (
    <FlipPageLeaf
      key={`${flipAnim!.leafFront}-${flipAnim!.leafBack}-${flipAnim!.direction}`}
      front={flipAnim!.leafFront}
      back={flipAnim!.leafBack}
      direction={flipAnim!.direction}
      pageProps={pageProps}
      onComplete={finishFlip}
    />
  ) : null;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-muted/30">
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center px-3 py-4 sm:px-6 relative overflow-hidden"
      >
        <button
          type="button"
          onClick={goPrev}
          disabled={currentPage <= 1 || isAnimating}
          className="absolute left-0 top-0 bottom-0 w-10 sm:w-14 z-10 flex items-center justify-center opacity-70 md:opacity-0 md:hover:opacity-100 focus:opacity-100 transition-opacity disabled:pointer-events-none group"
          aria-label="Previous page"
        >
          <span className="p-2 rounded-full bg-background/90 shadow border border-border group-disabled:opacity-30">
            <ChevronLeft className="w-5 h-5" />
          </span>
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={currentPage >= totalPages || isAnimating}
          className="absolute right-0 top-0 bottom-0 w-10 sm:w-14 z-10 flex items-center justify-center opacity-70 md:opacity-0 md:hover:opacity-100 focus:opacity-100 transition-opacity disabled:pointer-events-none group"
          aria-label="Next page"
        >
          <span className="p-2 rounded-full bg-background/90 shadow border border-border group-disabled:opacity-30">
            <ChevronRight className="w-5 h-5" />
          </span>
        </button>

        <div className={cn('flip-book-stage w-full h-full flex items-center justify-center', isAnimating && 'flip-book-stage--animating')}>
          <div
            className={cn(
              'flip-book flex items-stretch',
              spread.isCover && isSpreadLayout && 'flip-book--cover',
              isAnimating && 'flip-book--animating pointer-events-none',
            )}
            style={{
              maxWidth: containerSize.w - 56,
              maxHeight: containerSize.h - 32,
            }}
          >
            {staticLeftPage !== null && renderPage(staticLeftPage)}

            {isBackwardFlip && leafNode}

            {showSpine && (
              <div className="flip-book-spine hidden sm:block" aria-hidden />
            )}

            {!isBackwardFlip && leafNode}

            {!leafVisible && staticRightPage !== null && renderPage(staticRightPage)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 pb-4 pt-2 text-muted-foreground border-t border-border/30 bg-background/50 shrink-0">
        <button
          type="button"
          onClick={goPrev}
          disabled={currentPage <= 1 || isAnimating}
          className="p-2 rounded-full hover:bg-secondary disabled:opacity-30 transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm tabular-nums font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={currentPage >= totalPages || isAnimating}
          className="p-2 rounded-full hover:bg-secondary disabled:opacity-30 transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default FlipBookViewer;
