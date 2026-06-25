import { useCallback, useEffect, useState } from 'react';
import { getCachedPDF } from '@/lib/pdfCache';
import { usePDFStorage, type PDFProgress } from '@/hooks/usePDFStorage';
import { fileKey } from '@/components/library/BookOnShelf';

/** ponytail: cache probe is O(n) per file list change; fine for landing/library sizes */
export function useLibraryPreview(limit?: number) {
  const { getRecentFiles } = usePDFStorage();
  const [recentFiles, setRecentFiles] = useState<PDFProgress[]>([]);
  const [cachedIds, setCachedIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => {
    setRecentFiles(getRecentFiles());
  }, [getRecentFiles]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    const checkCache = async () => {
      const ids = new Set<string>();
      await Promise.all(
        recentFiles.map(async (file) => {
          const cached = await getCachedPDF(file.fileName, file.contentHash);
          if (cached) ids.add(fileKey(file));
        }),
      );
      if (!cancelled) setCachedIds(ids);
    };
    if (recentFiles.length > 0) checkCache();
    else setCachedIds(new Set());
    return () => { cancelled = true; };
  }, [recentFiles]);

  const files = limit != null ? recentFiles.slice(0, limit) : recentFiles;

  return {
    files,
    cachedIds,
    totalCount: recentFiles.length,
    refresh,
  };
}
