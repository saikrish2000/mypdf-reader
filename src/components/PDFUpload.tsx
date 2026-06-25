import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Theme } from '@/hooks/useTheme';

const MAX_FILE_SIZE = 50 * 1024 * 1024;

interface PDFUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  variant?: 'default' | 'hero' | 'compact';
  theme?: Theme;
}

const PDFUpload: React.FC<PDFUploadProps> = ({
  onFileSelect,
  isLoading,
  variant = 'default',
  theme,
}) => {
  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';
  const isContrast = theme === 'contrast';
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const isPDF = file.type === 'application/pdf' && file.name.toLowerCase().endsWith('.pdf');
    if (!isPDF) {
      toast.error('Please select a PDF file.');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`);
      return false;
    }
    return true;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (isLoading) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, [isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
    e.target.value = '';
  }, [onFileSelect]);

  const handleClick = () => {
    if (isLoading) return;
    inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center w-full rounded-lg cursor-pointer',
        'transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isCompact ? 'min-h-[120px] p-4' : isHero ? 'min-h-[180px] p-6' : 'min-h-[240px] p-8',
        isLoading && 'pointer-events-none opacity-60',
      )}
    >
      <div
        className={cn(
          'absolute inset-0 rounded-lg border transition-colors duration-200',
          isContrast
            ? 'bg-card border-foreground'
            : 'bg-card border-border',
          isDragOver && 'border-accent bg-muted/50',
          !isDragOver && !isContrast && 'group-hover:border-muted-foreground/30',
        )}
      />

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div
          className={cn(
            'flex items-center justify-center rounded-md mb-3 bg-muted',
            isCompact ? 'w-10 h-10' : 'w-12 h-12',
          )}
        >
          {isLoading ? (
            <div className={cn(
              'border-2 border-accent border-t-transparent rounded-full animate-spin',
              isCompact ? 'w-4 h-4' : 'w-5 h-5',
            )} />
          ) : isDragOver ? (
            <FileText className={cn('text-accent', isCompact ? 'w-5 h-5' : 'w-6 h-6')} />
          ) : (
            <Upload className={cn('text-muted-foreground', isCompact ? 'w-5 h-5' : 'w-6 h-6')} />
          )}
        </div>

        <h3 className={cn('font-medium text-foreground mb-1', isCompact ? 'text-sm' : 'text-base')}>
          {isLoading ? 'Opening PDF…' : 'Drop your PDF here'}
        </h3>

        <p className="type-caption max-w-xs">
          {isLoading ? 'Preparing your document' : 'or click to browse · .pdf up to 50MB'}
        </p>
      </div>
    </div>
  );
};

export default PDFUpload;
