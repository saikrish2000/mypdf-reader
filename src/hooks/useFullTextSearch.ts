import { useCallback, useEffect, useRef, useState } from 'react';
import type { PdfTextItem } from '@/lib/types/external';
import { pdfjsLib } from '@/lib/pdfjs';

export interface SearchResult {
  page: number;
  snippet: string;
  matchStart: number; // index within the page text
  matchLength: number;
  resultIndex: number; // sequential across whole document
}

interface IndexState {
  ready: boolean;
  progress: number; // 0..1
  totalPages: number;
}

/**
 * Lazily indexes the full text of a PDF document and exposes a search function.
 * Text per page is cached after the first extraction.
 */
export function useFullTextSearch(pdfDoc: pdfjsLib.PDFDocumentProxy | null) {
  const cacheRef = useRef<Map<number, string>>(new Map());
  const [state, setState] = useState<IndexState>({ ready: false, progress: 0, totalPages: 0 });

  // Reset cache when document changes
  useEffect(() => {
    cacheRef.current = new Map();
    setState({ ready: false, progress: 0, totalPages: pdfDoc?.numPages ?? 0 });
  }, [pdfDoc]);

  // Background-extract all pages so search is instant after first run.
  useEffect(() => {
    if (!pdfDoc) return;
    let cancelled = false;
    const total = pdfDoc.numPages;
    (async () => {
      for (let p = 1; p <= total; p++) {
        if (cancelled) return;
        if (!cacheRef.current.has(p)) {
          try {
            const page = await pdfDoc.getPage(p);
            const tc = await page.getTextContent();
            const text = tc.items
              .map((it) => ('str' in (it as PdfTextItem) ? (it as PdfTextItem).str : ''))
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
            cacheRef.current.set(p, text);
          } catch {
            cacheRef.current.set(p, '');
          }
        }
        if (p % 5 === 0 || p === total) {
          setState((prev) => {
            const next = { ready: p === total, progress: p / total, totalPages: total };
            if (prev.ready === next.ready && prev.progress === next.progress && prev.totalPages === next.totalPages) {
              return prev;
            }
            return next;
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfDoc]);

  const search = useCallback(
    (query: string, caseSensitive = false): SearchResult[] => {
      const q = query.trim();
      if (!q || !pdfDoc) return [];
      const needle = caseSensitive ? q : q.toLowerCase();
      const results: SearchResult[] = [];
      let counter = 0;
      for (let p = 1; p <= pdfDoc.numPages; p++) {
        const text = cacheRef.current.get(p);
        if (text === undefined) continue;
        const haystack = caseSensitive ? text : text.toLowerCase();
        let from = 0;
        while (true) {
          const idx = caseSensitive
            ? text.indexOf(needle, from)
            : haystack.indexOf(needle, from);
          if (idx === -1) break;
          const snippetStart = Math.max(0, idx - 40);
          const snippetEnd = Math.min(text.length, idx + needle.length + 60);
          results.push({
            page: p,
            snippet:
              (snippetStart > 0 ? '… ' : '') +
              text.slice(snippetStart, snippetEnd) +
              (snippetEnd < text.length ? ' …' : ''),
            matchStart: idx,
            matchLength: needle.length,
            resultIndex: counter++,
          });
          from = idx + needle.length;
          if (counter > 500) return results; // safety cap
        }
      }
      return results;
    },
    [pdfDoc],
  );

  return { search, indexState: state };
}
