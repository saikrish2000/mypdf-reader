import React from 'react';
import { Clock, FileText, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentFile {
  fileName: string;
  currentPage: number;
  totalPages: number;
  lastRead: number;
}

interface RecentFilesProps {
  files: RecentFile[];
  onSelect: (fileName: string) => void;
}

const RecentFiles: React.FC<RecentFilesProps> = ({ files, onSelect }) => {
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

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">
          Recently Read
        </h3>
      </div>
      
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-soft">
        {files.map((file, index) => {
          const progress = Math.round((file.currentPage / file.totalPages) * 100);
          
          return (
            <button
              key={file.fileName}
              onClick={() => onSelect(file.fileName)}
              className={cn(
                "w-full flex items-center gap-4 p-4 text-left transition-colors",
                "hover:bg-secondary/50",
                index !== files.length - 1 && "border-b border-border"
              )}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {file.fileName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-progress-track max-w-[100px]">
                    <div 
                      className="h-full rounded-full bg-progress transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Page {file.currentPage} of {file.totalPages}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatDate(file.lastRead)}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          );
        })}
      </div>
      
      <p className="text-xs text-center text-muted-foreground mt-4">
        Upload the same file to continue reading from where you left off
      </p>
    </div>
  );
};

export default RecentFiles;
