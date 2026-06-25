import React, { useState } from 'react';
import { BookOpen, ScrollText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ReadingMode } from '@/hooks/usePDFStorage';

interface ReadingModeDialogProps {
  open: boolean;
  fileName: string;
  onConfirm: (mode: ReadingMode, remember: boolean) => void;
  onCancel: () => void;
}

const ReadingModeDialog: React.FC<ReadingModeDialogProps> = ({
  open,
  fileName,
  onConfirm,
  onCancel,
}) => {
  const [remember, setRemember] = useState(true);

  const displayName = fileName.replace(/\.pdf$/i, '');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>How would you like to read?</DialogTitle>
          <DialogDescription>
            Choose a reading style for &ldquo;{displayName}&rdquo;. You can switch later from the toolbar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <button
            type="button"
            onClick={() => onConfirm('scroll', remember)}
            className={cn(
              'flex flex-col items-center gap-3 p-4 rounded-lg border border-border',
              'hover:bg-muted/50 transition-colors text-left',
            )}
          >
            <ScrollText className="w-7 h-7 text-foreground" />
            <div className="text-center">
              <p className="font-medium text-sm text-foreground">Scroll</p>
              <p className="type-caption mt-1">Continuous vertical reading</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onConfirm('flip', remember)}
            className={cn(
              'flex flex-col items-center gap-3 p-4 rounded-lg border border-border',
              'hover:bg-muted/50 transition-colors text-left',
            )}
          >
            <BookOpen className="w-7 h-7 text-foreground" />
            <div className="text-center">
              <p className="font-medium text-sm text-foreground">Flip book</p>
              <p className="type-caption mt-1">Page-turn spread view</p>
            </div>
          </button>
        </div>

        <label className="flex items-center gap-2 type-caption cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="rounded border-border accent-accent"
          />
          Remember for this book
        </label>
      </DialogContent>
    </Dialog>
  );
};

export default ReadingModeDialog;
