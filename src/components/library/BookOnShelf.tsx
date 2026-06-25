import React from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Trash2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PDFProgress } from '@/hooks/usePDFStorage';
import BookCover from './BookCover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BookOnShelfProps {
  file: PDFProgress;
  available: boolean;
  onSelect: () => void;
  onRemove: () => void;
  index?: number;
  showActions?: boolean;
}

function fileKey(file: PDFProgress) {
  return file.contentHash ?? file.fileName;
}

const BookOnShelf: React.FC<BookOnShelfProps> = ({
  file,
  available,
  onSelect,
  onRemove,
  index = 0,
  showActions = true,
}) => {
  const progress = file.totalPages > 0 ? Math.round((file.currentPage / file.totalPages) * 100) : 0;
  const title = file.fileName.replace(/\.pdf$/i, '');

  return (
    <motion.div
      className="group relative flex flex-col items-center"
      initial={false}
      whileHover={available ? {
        y: -14,
        rotateY: -8,
        rotateZ: -1,
        scale: 1.05,
        transition: { type: 'spring', stiffness: 400, damping: 18 },
      } : undefined}
      style={{ perspective: 800, transformStyle: 'preserve-3d' }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={available ? onSelect : undefined}
            disabled={!available}
            className={cn(
              'book-spine relative w-[88px] sm:w-[96px] aspect-[612/792] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm transition-shadow',
              available && 'hover:shadow-elevated',
              !available && 'opacity-40 cursor-not-allowed grayscale',
            )}
          >
            <BookCover
              title={title}
              spineColor={file.spineColor}
              thumbnail={file.coverThumbnail}
              progress={progress}
              className="h-full"
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="font-medium truncate">{title}</p>
          {file.totalPages > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Page {file.currentPage} of {file.totalPages} · {progress}% read
            </p>
          )}
          {!available && (
            <p className="text-xs text-destructive mt-0.5">Re-upload to read</p>
          )}
        </TooltipContent>
      </Tooltip>

      {showActions && (
      <div className="absolute -top-1 -right-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded-md bg-card border border-border shadow-sm hover:bg-secondary"
              aria-label="Book options"
            >
              <MoreHorizontal className="w-3 h-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {available && (
              <DropdownMenuItem onClick={onSelect} className="cursor-pointer">
                <BookOpen className="w-4 h-4 mr-2" />
                Open
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="cursor-pointer text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      )}
    </motion.div>
  );
};

export { fileKey };
export default BookOnShelf;
