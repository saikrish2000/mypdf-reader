import { extractPageText, extractPageRangeText, extractDocumentText } from '@/lib/pdfText';
import type { PdfDoc } from '@/lib/pdfText';

// ponytail: in-memory only; upgrade to IndexedDB if cross-session cache needed
const pageCache = new Map<string, string>();

function cacheKey(hash: string, page: number) {
  return `${hash}:${page}`;
}

export async function getTextForScope(
  pdfDoc: PdfDoc,
  contentHash: string,
  scope: 'page' | 'range' | 'document',
  pageNumber: number,
  rangeEnd?: number,
): Promise<string> {
  if (scope === 'page') {
    const key = cacheKey(contentHash, pageNumber);
    const hit = pageCache.get(key);
    if (hit !== undefined) return hit;
    const text = await extractPageText(pdfDoc, pageNumber);
    pageCache.set(key, text);
    return text;
  }
  if (scope === 'range') {
    const end = rangeEnd ?? pageNumber;
    return extractPageRangeText(pdfDoc, pageNumber, end);
  }
  return extractDocumentText(pdfDoc);
}
