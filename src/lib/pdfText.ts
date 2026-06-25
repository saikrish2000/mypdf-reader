import { pdfjsLib } from '@/lib/pdfjs';

export type PdfDoc = pdfjsLib.PDFDocumentProxy;

export async function extractPageText(
  pdfDoc: PdfDoc,
  pageNum: number,
): Promise<string> {
  const page = await pdfDoc.getPage(pageNum);
  const textContent = await page.getTextContent();
  return textContent.items
    .map((item) => ('str' in item ? item.str : ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function extractPageRangeText(
  pdfDoc: PdfDoc,
  start: number,
  end: number,
): Promise<string> {
  const parts: string[] = [];
  const lo = Math.max(1, Math.min(start, end));
  const hi = Math.min(pdfDoc.numPages, Math.max(start, end));
  for (let p = lo; p <= hi; p++) {
    const text = await extractPageText(pdfDoc, p);
    if (text) parts.push(`--- Page ${p} ---\n${text}`);
  }
  return parts.join('\n\n');
}

export async function extractDocumentText(
  pdfDoc: PdfDoc,
  maxPages = 50,
): Promise<string> {
  const limit = Math.min(pdfDoc.numPages, maxPages);
  return extractPageRangeText(pdfDoc, 1, limit);
}
