import { getStorageFileId } from '@/lib/storageKeys';
import { getCachedPDF } from '@/lib/pdfCache';
import type { PDFProgress } from '@/hooks/usePDFStorage';

const STORAGE_KEY = 'pdf-reader-progress';

function readProgressStore(): Record<string, PDFProgress> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function toDocId(contentHash?: string, fileName?: string): string {
  return getStorageFileId(fileName ?? '', contentHash);
}

export function encodeDocId(id: string): string {
  return encodeURIComponent(id);
}

export function decodeDocId(param: string): string {
  return decodeURIComponent(param);
}

export function buildReadPath(docId: string): string {
  return `/read/${encodeDocId(docId)}`;
}

export function findProgressByDocId(docId: string): PDFProgress | null {
  const data = readProgressStore();
  if (data[docId]) return data[docId];
  const match = Object.values(data).find(
    (p) => getStorageFileId(p.fileName, p.contentHash) === docId,
  );
  return match ?? null;
}

export async function resolveDocument(docId: string): Promise<{
  file: File;
  meta: PDFProgress;
} | null> {
  const meta = findProgressByDocId(docId);
  if (!meta) return null;

  const file = await getCachedPDF(meta.fileName, meta.contentHash);
  if (!file) return null;

  return { file, meta };
}
