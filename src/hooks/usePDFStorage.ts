import { useCallback } from 'react';

const STORAGE_KEY = 'pdf-reader-progress';
const BOOKMARKS_KEY = 'pdf-reader-bookmarks';

interface PDFProgress {
  fileName: string;
  currentPage: number;
  totalPages: number;
  lastRead: number;
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

export const usePDFStorage = () => {
  const getFileId = (fileName: string): string => {
    return fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  };

  const saveProgress = useCallback((fileName: string, currentPage: number, totalPages: number) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const data: StoredProgress = stored ? JSON.parse(stored) : {};
      const fileId = getFileId(fileName);
      
      data[fileId] = {
        fileName,
        currentPage,
        totalPages,
        lastRead: Date.now(),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, []);

  const loadProgress = useCallback((fileName: string): PDFProgress | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const data: StoredProgress = JSON.parse(stored);
      return data[getFileId(fileName)] || null;
    } catch (error) {
      console.error('Failed to load progress:', error);
      return null;
    }
  }, []);

  const getRecentFiles = useCallback((): PDFProgress[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const data: StoredProgress = JSON.parse(stored);
      return Object.values(data)
        .sort((a, b) => b.lastRead - a.lastRead)
        .slice(0, 5);
    } catch (error) {
      console.error('Failed to get recent files:', error);
      return [];
    }
  }, []);

  const clearProgress = useCallback((fileName: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const data: StoredProgress = JSON.parse(stored);
      delete data[getFileId(fileName)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  }, []);

  // Bookmark methods
  const getBookmarks = useCallback((fileName: string): Bookmark[] => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      if (!stored) return [];
      const data: StoredBookmarks = JSON.parse(stored);
      return data[getFileId(fileName)] || [];
    } catch {
      return [];
    }
  }, []);

  const addBookmark = useCallback((fileName: string, page: number, label: string) => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      const data: StoredBookmarks = stored ? JSON.parse(stored) : {};
      const fileId = getFileId(fileName);
      const bookmarks = data[fileId] || [];
      
      // Don't add duplicate page bookmarks
      if (bookmarks.some(b => b.page === page)) return;
      
      bookmarks.push({ page, label, createdAt: Date.now() });
      bookmarks.sort((a, b) => a.page - b.page);
      data[fileId] = bookmarks;
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to add bookmark:', error);
    }
  }, []);

  const removeBookmark = useCallback((fileName: string, page: number) => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      if (!stored) return;
      const data: StoredBookmarks = JSON.parse(stored);
      const fileId = getFileId(fileName);
      data[fileId] = (data[fileId] || []).filter(b => b.page !== page);
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
    }
  }, []);

  const isBookmarked = useCallback((fileName: string, page: number): boolean => {
    return getBookmarks(fileName).some(b => b.page === page);
  }, [getBookmarks]);

  return {
    saveProgress,
    loadProgress,
    getRecentFiles,
    clearProgress,
    getBookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,
  };
};
