import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThumbnailSidebarProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  currentPage: number;
  totalPages: number;
  onPageSelect: (page: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const THUMB_SCALE = 0.3;

const ThumbnailSidebar: React.FC<ThumbnailSidebarProps> = ({
  pdfDoc,
  currentPage,
  totalPages,
  onPageSelect,
  isOpen,
  onToggle,
}) => {
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Render thumbnails lazily
  const renderThumbnail = useCallback(async (pageNum: number) => {
    if (!pdfDoc || thumbnails.has(pageNum)) return;
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: THUMB_SCALE });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      setThumbnails(prev => new Map(prev).set(pageNum, dataUrl));
    } catch {
      // ignore render errors
    }
  }, [pdfDoc, thumbnails]);

  // Render visible thumbnails on open
  useEffect(() => {
    if (!isOpen || !pdfDoc) return;
    // Render first batch
    const batch = Math.min(totalPages, 20);
    for (let i = 1; i <= batch; i++) {
      renderThumbnail(i);
    }
  }, [isOpen, pdfDoc, totalPages, renderThumbnail]);

  // Render remaining thumbnails after initial batch
  useEffect(() => {
    if (!isOpen || !pdfDoc || totalPages <= 20) return;
    const timer = setTimeout(() => {
      for (let i = 21; i <= totalPages; i++) {
        renderThumbnail(i);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [isOpen, pdfDoc, totalPages, renderThumbnail]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (isOpen && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentPage, isOpen]);

  return (
    <>
      {/* Toggle button when closed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className={cn(
            "fixed left-3 top-1/2 -translate-y-1/2 z-20",
            "p-2 rounded-lg bg-toolbar text-toolbar-foreground",
            "shadow-lg hover:bg-toolbar/90 transition-all",
            "hidden sm:flex"
          )}
          title="Show thumbnails"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 bottom-0 z-20 flex flex-col",
          "bg-card border-r border-border shadow-lg",
          "transition-all duration-300 ease-out",
          "hidden sm:flex",
          isOpen ? "w-48 translate-x-0" : "w-0 -translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Pages
          </span>
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-secondary transition-colors"
            title="Hide thumbnails"
          >
            <PanelLeftClose className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Thumbnails list */}
        <div ref={containerRef} className="flex-1 overflow-y-auto p-2 space-y-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <button
              key={pageNum}
              ref={pageNum === currentPage ? activeRef : undefined}
              onClick={() => onPageSelect(pageNum)}
              className={cn(
                "w-full rounded-lg overflow-hidden transition-all duration-200",
                "border-2 hover:border-accent/50",
                pageNum === currentPage
                  ? "border-accent ring-2 ring-accent/20"
                  : "border-transparent"
              )}
            >
              <div className="relative aspect-[3/4] bg-muted">
                {thumbnails.has(pageNum) ? (
                  <img
                    src={thumbnails.get(pageNum)}
                    alt={`Page ${pageNum}`}
                    className="w-full h-full object-contain bg-paper"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-accent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className={cn(
                "text-xs py-1 text-center font-medium",
                pageNum === currentPage ? "text-accent" : "text-muted-foreground"
              )}>
                {pageNum}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default ThumbnailSidebar;
