/** Stable local-storage / IndexedDB key: prefer content hash over display name. */
export function getStorageFileId(fileName: string, contentHash?: string | null): string {
  return contentHash ?? fileName;
}

export function buildCacheKey(fileName: string, contentHash?: string | null): string {
  return getStorageFileId(fileName, contentHash);
}
