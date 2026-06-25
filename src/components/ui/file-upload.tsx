import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, File, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelect,
  accept = '.pdf,application/pdf',
  maxSize = 50 * 1024 * 1024,
  multiple = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndFilter = (incoming: File[]): File[] => {
    const oversized = incoming.filter(f => f.size > maxSize);
    for (const f of oversized) {
      toast.error(`${f.name} exceeds the ${maxSize / 1024 / 1024}MB limit.`);
    }
    const valid = incoming.filter(f => f.size <= maxSize);
    const acceptTypes = accept.split(',').map(t => t.trim().toLowerCase());
    const invalidType = valid.filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return !acceptTypes.some(t => t === f.type.toLowerCase() || t === ext);
    });
    for (const f of invalidType) {
      toast.error(`${f.name} is not an accepted file type.`);
    }
    return valid.filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return acceptTypes.some(t => t === f.type.toLowerCase() || t === ext);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const allFiles = Array.from(e.dataTransfer.files);
      const validFiles = validateAndFilter(allFiles);
      if (validFiles.length === 0) return;
      if (!multiple && allFiles.length > 1) {
        toast.info('Only one file can be selected at a time.');
      }
      setFiles((prev) => {
        const updated = multiple ? [...prev, ...validFiles] : [validFiles[0]];
        onFilesSelect(updated);
        return updated;
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const allFiles = Array.from(e.target.files);
      const validFiles = validateAndFilter(allFiles);
      if (validFiles.length === 0) return;
      if (!multiple && allFiles.length > 1) {
        toast.info('Only one file can be selected at a time.');
      }
      setFiles((prev) => {
        const updated = multiple ? [...prev, ...validFiles] : [validFiles[0]];
        onFilesSelect(updated);
        return updated;
      });
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        className="relative"
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          onChange={handleChange}
          accept={accept}
          className="hidden"
        />

        <div
          className={cn(
            'flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer',
            dragActive
              ? 'border-accent bg-accent/10 scale-[1.02]'
              : 'border-border bg-muted/30 hover:bg-muted/50 hover:border-accent/50'
          )}
          onClick={onButtonClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <UploadCloud
            className={cn(
              'w-10 h-10 mb-3 transition-colors',
              dragActive ? 'text-accent' : 'text-muted-foreground'
            )}
          />
          <p className="text-sm text-foreground font-medium">
            Drag & drop files or{' '}
            <span className="text-accent hover:text-accent/80 transition-colors">
              Browse
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF up to {maxSize / 1024 / 1024}MB
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-foreground">
            Selected Files ({files.length})
          </h3>
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg group hover:border-accent/50 transition-colors"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="p-2 bg-background rounded shadow-sm text-accent shrink-0 border border-border/50">
                    <File className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatSize(file.size)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors shrink-0"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { FileUpload };
