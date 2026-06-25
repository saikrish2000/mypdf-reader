import React, { useState } from 'react';
import { Clock, FileText, MoreHorizontal, Trash2, Pin, Download, ChevronRight, BookOpen, LayoutGrid, List as ListIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { PDFProgress } from '@/hooks/usePDFStorage';

interface RecentFilesProps {
  files: PDFProgress[];
  onSelect: (file: PDFProgress) => void;
  viewMode: 'grid' | 'list';
  onRemove: (file: PDFProgress) => void;
}

const RecentFiles: React.FC<RecentFilesProps> = ({ files, onSelect, viewMode, onRemove }) => {
  const [removingFile, setRemovingFile] = useState<string | null>(null);

  const fileKey = (file: PDFProgress) => file.contentHash ?? file.fileName;

  if (files.length === 0) return null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return date.toLocaleDateString();
  };

  const getFileInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const handleRemove = (e: React.MouseEvent, file: PDFProgress) => {
    e.stopPropagation();
    const key = fileKey(file);
    setRemovingFile(key);
    setTimeout(() => {
      onRemove(file);
      setRemovingFile(null);
    }, 300);
  };

  if (viewMode === 'list') {
    return (
      <div className="w-full animate-fade-in">
        <div className="bg-card/40 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
          {files.map((file, index) => {
            const progress = file.totalPages > 0 ? Math.round((file.currentPage / file.totalPages) * 100) : 0;

            return (
              <div
                key={fileKey(file)}
                onClick={() => onSelect(file)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(file); } }}
                className={cn(
                  "w-full flex items-center gap-4 p-4 text-left transition-all cursor-pointer",
                  "hover:bg-secondary/50",
                  index !== files.length - 1 && "border-b border-border/50",
                  removingFile === fileKey(file) && "opacity-0 scale-95 transition-all duration-300"
                )}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 shrink-0">
                  <FileText className="w-5 h-5 text-accent" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate text-sm">
                    {file.fileName}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <Progress value={progress} className="h-1.5 max-w-[120px] bg-secondary" />
                    <span className="text-xs text-muted-foreground shrink-0">
                      Page {file.currentPage} of {file.totalPages}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {formatDate(file.lastRead)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(file); }} className="cursor-pointer">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Resume Reading
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => handleRemove(e, file)} className="cursor-pointer text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove from History
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {files.map((file, index) => {
          const progress = file.totalPages > 0 ? Math.round((file.currentPage / file.totalPages) * 100) : 0;

          return (
            <div
              key={fileKey(file)}
              onClick={() => onSelect(file)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(file); } }}
              className={cn(
                "group relative flex flex-col bg-card/40 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden",
                "text-left transition-all duration-300 cursor-pointer",
                "hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                removingFile === fileKey(file) && "opacity-0 scale-95 transition-all duration-300"
              )}
            >
              {/* Thumbnail area */}
              <div className="relative h-28 bg-gradient-to-br from-accent/5 via-secondary/50 to-accent/5 flex items-center justify-center overflow-hidden">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/30 shadow-sm">
                  <span className="text-2xl font-bold text-accent/70">
                    {getFileInitial(file.fileName)}
                  </span>
                </div>

                {/* Progress overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary">
                  <div
                    className="h-full bg-accent transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Card body */}
              <div className="flex-1 p-3.5 flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-foreground text-sm truncate flex-1">
                    {file.fileName}
                  </h4>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="p-1 rounded-lg hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100 shrink-0 -mr-1 -mt-1">
                        <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(file); }} className="cursor-pointer">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Resume Reading
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => handleRemove(e, file)} className="cursor-pointer text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove from History
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="w-3 h-3 shrink-0" />
                  <span>Page {file.currentPage} of {file.totalPages}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span>{progress}% read</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(file.lastRead)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentFiles;
