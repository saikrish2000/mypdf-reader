import { useCallback } from 'react';
import { getStorageFileId } from '@/lib/storageKeys';

const STORAGE_KEY = 'pdf-reader-progress';
const BOOKMARKS_KEY = 'pdf-reader-bookmarks';

export type ReadingMode = 'scroll' | 'flip';

export interface PDFProgress {
  fileName: string;
  currentPage: number;
  totalPages: number;
  lastRead: number;
  contentHash?: string;
  readingMode?: ReadingMode;
  coverThumbnail?: string;
  spineColor?: string;
  coverPage?: number;
  coverMetaVersion?: number;
}

export interface Bookmark {
  page: number;
  label: string;
  createdAt: number;
}

interface StoredProgress {
  [fileId: string]: PDFProgress;
}

interface StoredBookmarks {
  [fileId: string]: Bookmark[];
}

function readProgressStore(): StoredProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function writeProgressStore(data: StoredProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to write progress:', error);
  }
}

export const usePDFStorage = () => {
  const saveProgress = useCallback((
    fileName: string,
    currentPage: number,
    totalPages: number,
    contentHash?: string,
  ) => {
    try {
      const data = readProgressStore();
      const fileId = getStorageFileId(fileName, contentHash);
      const existing = data[fileId];

      data[fileId] = {
        ...existing,
        fileName,
        currentPage,
        totalPages,
        lastRead: Date.now(),
        ...(contentHash ? { contentHash } : {}),
      };

      writeProgressStore(data);
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, []);

  const saveReadingMode = useCallback((
    fileName: string,
    contentHash: string | undefined,
    mode: ReadingMode,
  ) => {
    try {
      const data = readProgressStore();
      const fileId = getStorageFileId(fileName, contentHash);
      const existing = data[fileId];

      data[fileId] = {
        fileName,
        currentPage: existing?.currentPage ?? 1,
        totalPages: existing?.totalPages ?? 0,
        lastRead: Date.now(),
        ...(contentHash ? { contentHash } : {}),
        ...existing,
        readingMode: mode,
      };

      writeProgressStore(data);
    } catch (error) {
      console.error('Failed to save reading mode:', error);
    }
  }, []);

  const saveBookMetadata = useCallback((
    fileName: string,
    contentHash: string | undefined,
    patch: Pick<PDFProgress, 'coverThumbnail' | 'spineColor' | 'coverPage' | 'coverMetaVersion'>,
  ) => {
    try {
      const data = readProgressStore();
      const fileId = getStorageFileId(fileName, contentHash);
      const existing = data[fileId];

      data[fileId] = {
        fileName,
        currentPage: existing?.currentPage ?? 1,
        totalPages: existing?.totalPages ?? 0,
        lastRead: existing?.lastRead ?? Date.now(),
        ...(contentHash ? { contentHash } : {}),
        ...existing,
        ...patch,
      };

      writeProgressStore(data);
    } catch (error) {
      console.error('Failed to save book metadata:', error);
    }
  }, []);

  const loadProgress = useCallback((fileName: string, contentHash?: string): PDFProgress | null => {
    try {
      const data = readProgressStore();
      if (contentHash && data[contentHash]) return data[contentHash];
      return data[getStorageFileId(fileName, contentHash)] ?? data[fileName] ?? null;
    } catch (error) {
      console.error('Failed to load progress:', error);
      return null;
    }
  }, []);

  const getRecentFiles = useCallback((): PDFProgress[] => {
    try {
      const data = readProgressStore();
      return Object.values(data)
        .sort((a, b) => b.lastRead - a.lastRead)
        .slice(0, 20);
    } catch (error) {
      console.error('Failed to get recent files:', error);
      return [];
    }
  }, []);

  const clearBookmarks = useCallback((fileName: string, contentHash?: string) => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      if (!stored) return;
      const data: StoredBookmarks = JSON.parse(stored);
      const fileId = getStorageFileId(fileName, contentHash);
      delete data[fileId];
      if (fileId !== fileName) delete data[fileName];
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to clear bookmarks:', error);
    }
  }, []);

  const clearProgress = useCallback((fileName: string, contentHash?: string) => {
    try {
      const data = readProgressStore();
      const fileId = getStorageFileId(fileName, contentHash);
      delete data[fileId];
      if (fileId !== fileName) delete data[fileName];
      writeProgressStore(data);
      clearBookmarks(fileName, contentHash);
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  }, [clearBookmarks]);

  const getBookmarks = useCallback((fileName: string, contentHash?: string): Bookmark[] => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      if (!stored) return [];
      const data: StoredBookmarks = JSON.parse(stored);
      const fileId = getStorageFileId(fileName, contentHash);
      return data[fileId] ?? data[fileName] ?? [];
    } catch {
      return [];
    }
  }, []);

  const addBookmark = useCallback((fileName: string, page: number, label: string, contentHash?: string) => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      const data: StoredBookmarks = stored ? JSON.parse(stored) : {};
      const fileId = getStorageFileId(fileName, contentHash);
      const bookmarks = data[fileId] || [];

      if (bookmarks.some(b => b.page === page)) return;

      bookmarks.push({ page, label, createdAt: Date.now() });
      bookmarks.sort((a, b) => a.page - b.page);
      data[fileId] = bookmarks;
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to add bookmark:', error);
    }
  }, []);

  const removeBookmark = useCallback((fileName: string, page: number, contentHash?: string) => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      if (!stored) return;
      const data: StoredBookmarks = JSON.parse(stored);
      const fileId = getStorageFileId(fileName, contentHash);
      data[fileId] = (data[fileId] || []).filter(b => b.page !== page);
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
    }
  }, []);

  const isBookmarked = useCallback((fileName: string, page: number, contentHash?: string): boolean => {
    return getBookmarks(fileName, contentHash).some(b => b.page === page);
  }, [getBookmarks]);

  return {
    saveProgress,
    saveReadingMode,
    saveBookMetadata,
    loadProgress,
    getRecentFiles,
    clearProgress,
    clearBookmarks,
    getBookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,
  };
};
