import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { hashFile } from '@/lib/documentHash';
import { cachePDF, getCachedPDF } from '@/lib/pdfCache';
import { buildReadPath, toDocId } from '@/lib/documentRoute';
import { generateCoverThumbnail, needsCoverUpdate } from '@/lib/pdfCover';
import { usePDFStorage, type PDFProgress } from '@/hooks/usePDFStorage';

export function useOpenDocument() {
  const navigate = useNavigate();
  const { loadProgress, saveBookMetadata } = usePDFStorage();
  const [isLoading, setIsLoading] = useState(false);

  const openFile = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const hash = await hashFile(file);
      const saved = loadProgress(file.name, hash);
      const meta: PDFProgress = saved ?? {
        fileName: file.name,
        currentPage: 1,
        totalPages: 0,
        lastRead: Date.now(),
        contentHash: hash,
      };
      await cachePDF(file.name, file, hash);
      if (needsCoverUpdate(saved)) {
        generateCoverThumbnail(file)
          .then((cover) => {
            saveBookMetadata(file.name, hash, {
              coverThumbnail: cover.thumbnail,
              spineColor: cover.spineColor,
              coverPage: cover.coverPage,
              coverMetaVersion: cover.coverMetaVersion,
            });
          })
          .catch(() => { /* cover optional */ });
      }
      const docId = toDocId(hash, file.name);
      navigate(buildReadPath(docId), { state: { file, meta } });
    } catch {
      toast.error('Failed to open file.');
    } finally {
      setIsLoading(false);
    }
  }, [loadProgress, navigate, saveBookMetadata]);

  const openFromLibrary = useCallback(async (meta: PDFProgress) => {
    setIsLoading(true);
    try {
      const cached = await getCachedPDF(meta.fileName, meta.contentHash);
      if (!cached) {
        toast.error('File not cached. Please re-upload it to continue reading.');
        return;
      }
      const docId = toDocId(meta.contentHash, meta.fileName);
      navigate(buildReadPath(docId), { state: { file: cached, meta } });
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  return { openFile, openFromLibrary, isLoading };
}
