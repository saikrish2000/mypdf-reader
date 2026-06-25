import { useEffect, useState } from 'react';
import { ListTree } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PdfDoc } from '@/lib/pdfText';

interface OutlineItem {
  title: string;
  page: number;
  items?: OutlineItem[];
}

async function parseOutline(
  pdfDoc: PdfDoc,
  items: Awaited<ReturnType<PdfDoc['getOutline']>>,
): Promise<OutlineItem[]> {
  if (!items?.length) return [];
  const result: OutlineItem[] = [];
  for (const item of items) {
    let page = 1;
    if (item.dest) {
      try {
        const dest = typeof item.dest === 'string'
          ? await pdfDoc.getDestination(item.dest)
          : item.dest;
        const ref = Array.isArray(dest) ? dest[0] : null;
        if (ref) {
          const idx = await pdfDoc.getPageIndex(ref);
          page = idx + 1;
        }
      } catch {
        // skip bad dest
      }
    }
    const children = item.items ? await parseOutline(pdfDoc, item.items) : undefined;
    result.push({ title: item.title || 'Untitled', page, items: children });
  }
  return result;
}

interface OutlinePanelProps {
  pdfDoc: PdfDoc | null;
  isOpen: boolean;
  onClose: () => void;
  onGoToPage: (page: number) => void;
}

function OutlineList({
  items,
  depth,
  onGoToPage,
}: {
  items: OutlineItem[];
  depth: number;
  onGoToPage: (page: number) => void;
}) {
  return (
    <ul className={cn(depth > 0 && 'ml-3 border-l border-border pl-2')}>
      {items.map((item, i) => (
        <li key={`${item.title}-${i}`}>
          <button
            type="button"
            onClick={() => onGoToPage(item.page)}
            className="w-full text-left text-sm py-1.5 px-2 rounded-md hover:bg-muted/50 text-foreground"
          >
            <span className="line-clamp-2">{item.title}</span>
            <span className="text-[10px] text-muted-foreground">p. {item.page}</span>
          </button>
          {item.items && item.items.length > 0 && (
            <OutlineList items={item.items} depth={depth + 1} onGoToPage={onGoToPage} />
          )}
        </li>
      ))}
    </ul>
  );
}

export default function OutlinePanel({ pdfDoc, isOpen, onClose, onGoToPage }: OutlinePanelProps) {
  const [outline, setOutline] = useState<OutlineItem[]>([]);

  useEffect(() => {
    if (!pdfDoc || !isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const raw = await pdfDoc.getOutline();
        const parsed = await parseOutline(pdfDoc, raw);
        if (!cancelled) setOutline(parsed);
      } catch {
        if (!cancelled) setOutline([]);
      }
    })();
    return () => { cancelled = true; };
  }, [pdfDoc, isOpen]);

  if (!isOpen) return null;

  return (
    <aside
      className={cn(
        'fixed top-0 right-0 z-40 h-full w-full sm:w-72 bg-card border-l border-border shadow-2xl',
        'flex flex-col',
      )}
    >
      <header className="flex items-center gap-2 p-4 border-b border-border">
        <ListTree className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold flex-1">Outline</h3>
        <button type="button" onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
          Close
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-2">
        {outline.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center mt-8 px-4">
            No table of contents in this PDF.
          </p>
        ) : (
          <OutlineList items={outline} depth={0} onGoToPage={(p) => { onGoToPage(p); onClose(); }} />
        )}
      </div>
    </aside>
  );
}
