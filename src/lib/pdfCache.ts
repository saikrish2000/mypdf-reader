// Simple IndexedDB wrapper to cache PDF file blobs by fileName
const DB_NAME = 'pdf-reader-cache';
const STORE = 'files';
const VERSION = 1;

const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

export const cachePDF = async (fileName: string, file: File): Promise<void> => {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(file, fileName);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Failed to cache PDF:', e);
  }
};

export const getCachedPDF = async (fileName: string): Promise<File | null> => {
  try {
    const db = await openDB();
    return await new Promise<File | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(fileName);
      req.onsuccess = () => {
        const result = req.result;
        if (!result) return resolve(null);
        if (result instanceof File) return resolve(result);
        // Reconstruct as File if it's a Blob
        resolve(new File([result], fileName, { type: 'application/pdf' }));
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Failed to read cached PDF:', e);
    return null;
  }
};

export const removeCachedPDF = async (fileName: string): Promise<void> => {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(fileName);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('Failed to remove cached PDF:', e);
  }
};
