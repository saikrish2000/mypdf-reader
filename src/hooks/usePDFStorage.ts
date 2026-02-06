import { useCallback } from 'react';

const STORAGE_KEY = 'pdf-reader-progress';

interface PDFProgress {
  fileName: string;
  currentPage: number;
  totalPages: number;
  lastRead: number;
}

interface StoredProgress {
  [fileId: string]: PDFProgress;
}

export const usePDFStorage = () => {
  const getFileId = (fileName: string): string => {
    // Create a simple hash from filename for storage key
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
      const fileId = getFileId(fileName);
      
      return data[fileId] || null;
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
      const fileId = getFileId(fileName);
      delete data[fileId];
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to clear progress:', error);
    }
  }, []);

  return {
    saveProgress,
    loadProgress,
    getRecentFiles,
    clearProgress,
  };
};
