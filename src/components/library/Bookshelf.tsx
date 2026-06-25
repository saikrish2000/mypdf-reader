import React from 'react';
import type { PDFProgress } from '@/hooks/usePDFStorage';
import BookOnShelf, { fileKey } from './BookOnShelf';

interface BookshelfProps {
  files: PDFProgress[];
  cachedIds: Set<string>;
  onSelect: (file: PDFProgress) => void;
  onRemove: (file: PDFProgress) => void;
  showActions?: boolean;
}

const BOOKS_PER_ROW = 4;

const Bookshelf: React.FC<BookshelfProps> = ({ files, cachedIds, onSelect, onRemove, showActions = true }) => {
  if (files.length === 0) return null;

  const rows: PDFProgress[][] = [];
  for (let i = 0; i < files.length; i += BOOKS_PER_ROW) {
    rows.push(files.slice(i, i + BOOKS_PER_ROW));
  }

  return (
    <div className="w-full animate-fade-in space-y-6">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="relative">
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-5 px-2 pb-3 min-h-[168px] items-end">
            {row.map((file, bookIndex) => {
              const key = fileKey(file);
              const available = cachedIds.has(key);
              return (
                <BookOnShelf
                  key={key}
                  file={file}
                  available={available}
                  index={rowIndex * BOOKS_PER_ROW + bookIndex}
                  onSelect={() => onSelect(file)}
                  onRemove={() => onRemove(file)}
                  showActions={showActions}
                />
              );
            })}
          </div>
          <div className="bookshelf-plank h-3 rounded-sm mx-1" aria-hidden />
          <div className="bookshelf-plank-edge h-1.5 rounded-b-md mx-2 -mt-0.5 opacity-80" aria-hidden />
        </div>
      ))}
    </div>
  );
};

export default Bookshelf;
