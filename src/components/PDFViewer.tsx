import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import PDFToolbar from './PDFToolbar';
import { usePDFStorage } from '@/hooks/usePDFStorage';
import { cn } from '@/lib/utils';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  file: File;
  onClose: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isRendering, setIsRendering] = useState(false);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  
  const { saveProgress, loadProgress } = usePDFStorage();

  // Load PDF document
  useEffect(() => {
    const loadPDF = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        
        // Check for saved progress
        const saved = loadProgress(file.name);
        if (saved && saved.currentPage <= pdf.numPages) {
          setCurrentPage(saved.currentPage);
        }
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    loadPDF();
  }, [file, loadProgress]);

  // Render current page
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current || isRendering) return;

    // Cancel any ongoing render
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    setIsRendering(true);

    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      const viewport = page.getViewport({ scale });
      
      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;
      
      // Save progress
      saveProgress(file.name, pageNum, totalPages);
    } catch (error) {
      if ((error as Error).name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', error);
      }
    } finally {
      setIsRendering(false);
    }
  }, [pdfDoc, scale, file.name, totalPages, saveProgress, isRendering]);

  // Render when page or scale changes
  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [currentPage, scale, pdfDoc, renderPage]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePageChange(currentPage - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        handlePageChange(currentPage + 1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, handlePageChange, onClose]);

  return (
    <div className="flex flex-col h-screen bg-muted animate-fade-in">
      <PDFToolbar
        currentPage={currentPage}
        totalPages={totalPages}
        fileName={file.name}
        scale={scale}
        onPageChange={handlePageChange}
        onScaleChange={setScale}
      />
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center"
      >
        <div className="inline-block animate-scale-in">
          <div className={cn(
            "pdf-paper rounded-lg overflow-hidden transition-shadow duration-300",
            isRendering && "opacity-80"
          )}>
            <canvas 
              ref={canvasRef}
              className="block max-w-full h-auto"
            />
          </div>
        </div>
      </div>
      
      {/* Mobile navigation overlay */}
      <div className="fixed bottom-4 left-4 right-4 sm:hidden">
        <div className="flex justify-center gap-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={cn(
              "flex-1 py-4 rounded-xl font-medium transition-all",
              "bg-toolbar text-toolbar-foreground",
              "disabled:opacity-40"
            )}
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={cn(
              "flex-1 py-4 rounded-xl font-medium transition-all",
              "bg-accent text-accent-foreground",
              "disabled:opacity-40"
            )}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
