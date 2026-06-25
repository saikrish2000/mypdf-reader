import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { PageFlip } from 'page-flip/dist/js/page-flip.module.js';
import { pdfjsLib } from '@/lib/pdfjs';
import { renderPdfPageToDataUrl } from '@/lib/pdfCover';
import { getNextFlipPage, getPrevFlipPage } from '@/lib/flipNavigation';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import 'page-flip/src/Style/stPageFlip.css';

interface PageFlipBookViewerProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  totalPages: number;
  currentPage: number;
  coverPage?: number;
  onPageChange: (page: number) => void;
  onAnimatingChange?: (animating: boolean) => void;
  onRenderFailed?: () => void;
  flipCancelRef?: React.MutableRefObject<(() => void) | null>;
}

const FLIPPING_STATES = new Set(['flipping']);
const SIZE_WAIT_MS = 2000;

function makeWhitePlaceholder(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  return canvas.toDataURL('image/jpeg', 0.85);
}

function waitForHostSize(host: HTMLElement, cancelled: () => boolean): Promise<boolean> {
  return new Promise((resolve) => {
    const deadline = Date.now() + SIZE_WAIT_MS;
    const tick = () => {
      if (cancelled()) {
        resolve(false);
        return;
      }
      const r = host.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        resolve(true);
        return;
      }
      if (Date.now() >= deadline) {
        resolve(false);
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

/**
 * Flip mode uses rendered page images (StPageFlip). Text selection and
 * highlight annotations are not available here — use scroll mode for those.
 */
const PageFlipBookViewer: React.FC<PageFlipBookViewerProps> = ({
  pdfDoc,
  totalPages,
  currentPage,
  coverPage = 1,
  onPageChange,
  onAnimatingChange,
  onRenderFailed,
  flipCancelRef,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const pageFlipRef = useRef<PageFlip | null>(null);
  const imagesRef = useRef<string[]>([]);
  const renderWidthRef = useRef(400);
  const internalFlipRef = useRef(false);
  const userNavRef = useRef(false);
  const currentPageRef = useRef(currentPage);
  const onPageChangeRef = useRef(onPageChange);
  const onAnimatingChangeRef = useRef(onAnimatingChange);
  const onRenderFailedRef = useRef(onRenderFailed);
  const lastAnimatingRef = useRef(false);
  const lastReportedPageRef = useRef(currentPage);
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renderingRef = useRef<Set<number>>(new Set());
  const renderedSuccessRef = useRef(0);
  const pdfDocRef = useRef(pdfDoc);
  const totalPagesRef = useRef(totalPages);
  const coverPageRef = useRef(coverPage);
  const [ready, setReady] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [renderFailed, setRenderFailed] = useState(false);
  const [mountId, setMountId] = useState(0);

  currentPageRef.current = currentPage;
  onPageChangeRef.current = onPageChange;
  onAnimatingChangeRef.current = onAnimatingChange;
  onRenderFailedRef.current = onRenderFailed;
  pdfDocRef.current = pdfDoc;
  totalPagesRef.current = totalPages;
  coverPageRef.current = coverPage;

  const reportAnimating = useCallback((animating: boolean) => {
    if (lastAnimatingRef.current === animating) return;
    lastAnimatingRef.current = animating;
    setIsAnimating(animating);
    onAnimatingChangeRef.current?.(animating);
  }, []);
  const reportAnimatingRef = useRef(reportAnimating);
  reportAnimatingRef.current = reportAnimating;

  const flushImageUpdate = useCallback(() => {
    if (!pageFlipRef.current) return;
    pageFlipRef.current.updateFromImages([...imagesRef.current]);
  }, []);

  const scheduleImageUpdate = useCallback(() => {
    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    updateTimerRef.current = setTimeout(flushImageUpdate, 400);
  }, [flushImageUpdate]);

  const renderPageImage = useCallback(async (pageNum: number) => {
    if (renderingRef.current.has(pageNum)) return;
    renderingRef.current.add(pageNum);
    try {
      const { dataUrl } = await renderPdfPageToDataUrl(
        pdfDocRef.current,
        pageNum,
        renderWidthRef.current,
        0.92,
      );
      if (imagesRef.current[pageNum - 1] === dataUrl) return;
      imagesRef.current[pageNum - 1] = dataUrl;
      renderedSuccessRef.current += 1;
      scheduleImageUpdate();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn(`PageFlip: failed to render page ${pageNum}`, err);
      }
    } finally {
      renderingRef.current.delete(pageNum);
    }
  }, [scheduleImageUpdate]);

  const queuePageRenders = useCallback(async (priority: number[]) => {
    const total = totalPagesRef.current;
    const seen = new Set<number>();
    const order = [...priority];
    for (let p = 1; p <= total; p++) {
      if (!order.includes(p)) order.push(p);
    }

    renderedSuccessRef.current = 0;
    for (const pageNum of priority) {
      if (seen.has(pageNum)) continue;
      seen.add(pageNum);
      await renderPageImage(pageNum);
    }
    flushImageUpdate();

    if (renderedSuccessRef.current === 0 && priority.length > 0) {
      setRenderFailed(true);
      onRenderFailedRef.current?.();
    }

    for (const pageNum of order) {
      if (seen.has(pageNum)) continue;
      seen.add(pageNum);
      await renderPageImage(pageNum);
    }
  }, [renderPageImage, flushImageUpdate]);

  const queuePageRendersRef = useRef(queuePageRenders);
  queuePageRendersRef.current = queuePageRenders;

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    const book = bookRef.current;
    if (!host || !book || totalPages === 0) return;

    lastAnimatingRef.current = false;
    lastReportedPageRef.current = currentPageRef.current;
    renderingRef.current.clear();
    setRenderFailed(false);

    const init = async () => {
      const sized = await waitForHostSize(host, () => cancelled);
      if (cancelled) return;
      if (!sized) {
        toast.error('Could not size flip book viewer. Try scroll mode.');
        setRenderFailed(true);
        onRenderFailedRef.current?.();
        return;
      }

      const rect = host.getBoundingClientRect();
      const page = await pdfDoc.getPage(1);
      const viewport = page.getViewport({ scale: 1 });
      const aspect = viewport.width / viewport.height;

      const maxW = Math.min(520, Math.max(280, rect.width * 0.46));
      const pageW = Math.round(maxW);
      const pageH = Math.round(pageW / aspect);
      renderWidthRef.current = pageW;

      const white = makeWhitePlaceholder(pageW, pageH);
      imagesRef.current = Array.from({ length: totalPages }, () => white);

      if (cancelled) return;

      const pf = new PageFlip(book, {
        width: pageW,
        height: pageH,
        size: 'stretch',
        minWidth: Math.min(240, pageW),
        maxWidth: Math.min(560, Math.round(rect.width * 0.92)),
        minHeight: Math.min(320, pageH),
        maxHeight: Math.min(800, Math.round(rect.height * 0.88)),
        showCover: coverPage === 1,
        startPage: Math.max(0, Math.min(totalPages - 1, currentPageRef.current - 1)),
        drawShadow: true,
        flippingTime: 800,
        maxShadowOpacity: 0.6,
        mobileScrollSupport: false,
        usePortrait: true,
        autoSize: true,
        useMouseEvents: true,
        clickEventForward: false,
      });

      pf.loadFromImages(imagesRef.current);
      pageFlipRef.current = pf;

      pf.on('flip', (_sender, pageIndex) => {
        internalFlipRef.current = true;
        const pageNum = pageIndex + 1;
        if (pageNum === lastReportedPageRef.current) return;
        lastReportedPageRef.current = pageNum;
        if (pageNum !== currentPageRef.current) {
          onPageChangeRef.current(pageNum);
        }
      });

      pf.on('changeState', (_sender, state) => {
        reportAnimatingRef.current(FLIPPING_STATES.has(String(state)));
      });

      setReady(true);
      reportAnimatingRef.current(false);

      const priority = [
        coverPage,
        currentPageRef.current,
        currentPageRef.current - 1,
        currentPageRef.current + 1,
        coverPage + 1,
      ].filter((p) => p >= 1 && p <= totalPages);
      await queuePageRendersRef.current(priority);
    };

    init();

    return () => {
      cancelled = true;
      if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
      pageFlipRef.current?.destroy();
      pageFlipRef.current = null;
      setReady(false);
      reportAnimatingRef.current(false);
      onAnimatingChangeRef.current?.(false);
      setMountId((id) => id + 1);
    };
  }, [pdfDoc, totalPages, coverPage]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !ready) return;
    const ro = new ResizeObserver(() => {
      pageFlipRef.current?.update();
    });
    ro.observe(host);
    return () => ro.disconnect();
  }, [ready]);

  useEffect(() => {
    const pf = pageFlipRef.current;
    if (!pf || !ready) return;

    if (internalFlipRef.current) {
      internalFlipRef.current = false;
      return;
    }

    const target = currentPage - 1;
    const current = pf.getCurrentPageIndex();
    if (current === target) return;

    lastReportedPageRef.current = currentPage;

    if (userNavRef.current && Math.abs(current - target) === 1) {
      userNavRef.current = false;
      if (target > current) pf.flipNext('top');
      else pf.flipPrev('top');
      return;
    }

    userNavRef.current = false;
    if (Math.abs(current - target) === 1) {
      if (target > current) pf.flipNext('top');
      else pf.flipPrev('top');
    } else {
      pf.turnToPage(target);
    }
  }, [currentPage, ready]);

  const cancelFlip = useCallback(() => {
    const pf = pageFlipRef.current;
    if (pf) {
      pf.turnToPage(Math.max(0, currentPageRef.current - 1));
    }
    reportAnimating(false);
  }, [reportAnimating]);

  useEffect(() => {
    if (!flipCancelRef) return;
    flipCancelRef.current = cancelFlip;
    return () => { flipCancelRef.current = null; };
  }, [flipCancelRef, cancelFlip]);

  const goPrev = useCallback(() => {
    const target = getPrevFlipPage(currentPage, totalPages, false, coverPage);
    if (target !== currentPage) {
      userNavRef.current = true;
      onPageChange(target);
    }
  }, [currentPage, totalPages, coverPage, onPageChange]);

  const goNext = useCallback(() => {
    const target = getNextFlipPage(currentPage, totalPages, false, coverPage);
    if (target !== currentPage) {
      userNavRef.current = true;
      onPageChange(target);
    }
  }, [currentPage, totalPages, coverPage, onPageChange]);

  if (renderFailed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center bg-muted/30">
        <p className="text-sm font-medium text-foreground">Couldn&apos;t render pages in flip mode</p>
        <p className="type-caption max-w-sm">Try scroll mode for reliable page display.</p>
        {onRenderFailed && (
          <Button variant="outline" onClick={onRenderFailed}>
            Switch to scroll mode
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-muted/30">
      <div
        ref={hostRef}
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

        {!ready && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-muted/30">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">Loading book…</p>
          </div>
        )}

        <div className={cn('page-flip-book w-full h-full flex items-center justify-center', !ready && 'invisible')}>
          <div key={mountId} ref={bookRef} className="page-flip-book__inner" />
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

export default PageFlipBookViewer;
