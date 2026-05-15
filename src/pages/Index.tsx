import React, { useState, useEffect, useCallback } from 'react';
import PDFUpload from '@/components/PDFUpload';
import PDFViewer from '@/components/PDFViewer';
import RecentFiles from '@/components/RecentFiles';
import ThemeToggle from '@/components/ThemeToggle';
import { usePDFStorage } from '@/hooks/usePDFStorage';
import { useTheme } from '@/hooks/useTheme';
import { getCachedPDF } from '@/lib/pdfCache';
import { BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { getRecentFiles } = usePDFStorage();
  const [recentFiles, setRecentFiles] = useState<ReturnType<typeof getRecentFiles>>([]);
  const { theme, toggleTheme, setTheme } = useTheme();

  useEffect(() => {
    setRecentFiles(getRecentFiles());
  }, [getRecentFiles]);

  const handleFileSelect = useCallback((file: File) => {
    setIsLoading(true);
    setTimeout(() => {
      setSelectedFile(file);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedFile(null);
    setRecentFiles(getRecentFiles());
  }, [getRecentFiles]);

  const handleRecentSelect = useCallback(async (fileName: string) => {
    setIsLoading(true);
    const cached = await getCachedPDF(fileName);
    setIsLoading(false);
    if (cached) {
      setSelectedFile(cached);
    } else {
      toast.error('File not cached. Please re-upload it to continue reading.');
    }
  }, []);

  if (selectedFile) {
    return (
      <PDFViewer
        file={selectedFile}
        onClose={handleClose}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSelectTheme={setTheme}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Top-right controls */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle theme={theme} onToggle={toggleTheme} onSelect={setTheme} />
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-12 sm:py-20">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-6">
            <BookOpen className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            PDF Reader
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Read PDFs in your browser with automatic progress saving.
            Pick up right where you left off.
          </p>
        </div>

        {/* Upload area */}
        <PDFUpload
          onFileSelect={handleFileSelect}
          isLoading={isLoading}
        />

        {/* Recent files */}
        <RecentFiles
          files={recentFiles}
          onSelect={handleRecentSelect}
        />

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>Your reading progress is saved locally in your browser.</p>
          <p className="mt-1">Use arrow keys or spacebar to navigate between pages.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
