import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PDFUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

const PDFUpload: React.FC<PDFUploadProps> = ({ onFileSelect, isLoading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

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
      if (file.type === 'application/pdf') {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto",
        "min-h-[400px] p-12 rounded-2xl cursor-pointer",
        "border-2 border-dashed transition-all duration-300 ease-out",
        "bg-card hover:bg-secondary/50",
        isDragOver 
          ? "border-accent bg-accent/5 scale-[1.02]" 
          : "border-border hover:border-accent/50",
        isLoading && "pointer-events-none opacity-60"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className={cn(
        "flex items-center justify-center w-20 h-20 rounded-2xl mb-6",
        "bg-secondary transition-all duration-300",
        isDragOver && "bg-accent/20 scale-110"
      )}>
        {isLoading ? (
          <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        ) : isDragOver ? (
          <FileText className="w-10 h-10 text-accent" />
        ) : (
          <Upload className="w-10 h-10 text-muted-foreground" />
        )}
      </div>
      
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {isLoading ? 'Loading PDF...' : 'Drop your PDF here'}
      </h3>
      
      <p className="text-muted-foreground text-center max-w-sm">
        {isLoading 
          ? 'Please wait while we prepare your document'
          : 'or click to browse your files. Your reading progress will be saved automatically.'
        }
      </p>
      
      {!isLoading && (
        <div className="mt-8 px-6 py-3 rounded-lg bg-secondary text-foreground font-medium transition-all hover:bg-secondary/80">
          Choose PDF File
        </div>
      )}
    </div>
  );
};

export default PDFUpload;
