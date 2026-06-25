import { buildCacheKey } from '@/lib/storageKeys';

const DB_NAME = 'pdf-reader-cache';
const STORE = 'files';
const META_STORE = 'meta';
const VERSION = 2;
const MAX_CACHED_FILES = 20;

const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const getAccessTime = async (db: IDBDatabase, key: string): Promise<number> => {
  try {
    return await new Promise<number>((resolve) => {
      const tx = db.transaction(META_STORE, 'readonly');
      const req = tx.objectStore(META_STORE).get(key);
      req.onsuccess = () => resolve(req.result ?? 0);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
};

const setAccessTime = async (db: IDBDatabase, key: string, time: number): Promise<void> => {
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readwrite');
      tx.objectStore(META_STORE).put(time, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
};

const evictLRU = async (db: IDBDatabase): Promise<void> => {
  try {
    const allKeys: string[] = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAllKeys();
      req.onsuccess = () => resolve(req.result as string[]);
      req.onerror = () => reject(req.error);
    });
    if (allKeys.length <= MAX_CACHED_FILES) return;

    const times = await Promise.all(
      allKeys.map(async (key) => ({ key, time: await getAccessTime(db, key) }))
    );
    times.sort((a, b) => a.time - b.time);
    const toEvict = times.slice(0, times.length - MAX_CACHED_FILES);

    await Promise.all(toEvict.map(async ({ key }) => {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(META_STORE, 'readwrite');
        tx.objectStore(META_STORE).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }));
  } catch {
    // ignore
  }
};

const readByKey = async (db: IDBDatabase, key: string, displayName: string): Promise<File | null> =>
  new Promise<File | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => {
      const result = req.result;
      if (!result) return resolve(null);
      if (result instanceof File) return resolve(result);
      resolve(new File([result], displayName, { type: 'application/pdf' }));
    };
    req.onerror = () => reject(req.error);
  });

const deleteByKey = async (db: IDBDatabase, key: string): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readwrite');
    tx.objectStore(META_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const cachePDF = async (fileName: string, file: File, contentHash?: string): Promise<void> => {
  try {
    const db = await openDB();
    const key = buildCacheKey(fileName, contentHash);
    const now = Date.now();
    await setAccessTime(db, key, now);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(file, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await evictLRU(db);
  } catch (e) {
    console.warn('Failed to cache PDF:', e);
  }
};

export const getCachedPDF = async (fileName: string, contentHash?: string): Promise<File | null> => {
  try {
    const db = await openDB();
    const keys = contentHash
      ? [buildCacheKey(fileName, contentHash), fileName]
      : [fileName];

    for (const key of keys) {
      const file = await readByKey(db, key, fileName);
      if (file) {
        await setAccessTime(db, key, Date.now());
        return file;
      }
    }
    return null;
  } catch (e) {
    console.warn('Failed to read cached PDF:', e);
    return null;
  }
};

export const removeCachedPDF = async (fileName: string, contentHash?: string): Promise<void> => {
  try {
    const db = await openDB();
    const keys = new Set([buildCacheKey(fileName, contentHash), fileName]);
    await Promise.all([...keys].map((key) => deleteByKey(db, key)));
  } catch (e) {
    console.warn('Failed to remove cached PDF:', e);
  }
};
