import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { usePDFStorage, type Bookmark } from './usePDFStorage';

/**
 * Unifies local + cloud bookmarks for a single document.
 * - Always returns local bookmarks (offline-first).
 * - When user is authed AND documentId is known, also syncs to cloud:
 *   merges remote → local on first load, mirrors writes to remote.
 */
export function useSyncedBookmarks(fileName: string, documentId: string | null, contentHash?: string) {
  const { user } = useAuth();
  const local = usePDFStorage();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => local.getBookmarks(fileName, contentHash));
  const [version, setVersion] = useState(0);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'synced' | 'error' | 'offline'>(
    user ? 'syncing' : 'offline',
  );
  const mergedRef = useRef(false);
  const localRef = useRef(local);
  localRef.current = local;
  const fileNameRef = useRef(fileName);
  fileNameRef.current = fileName;
  const contentHashRef = useRef(contentHash);
  contentHashRef.current = contentHash;

  const isCurrentPageBookmarked = useCallback(
    (page: number) => local.isBookmarked(fileName, page, contentHash),
    [local, fileName, contentHash],
  );

  useEffect(() => {
    setBookmarks(local.getBookmarks(fileName, contentHash));
  }, [version, local, fileName, contentHash]);

  useEffect(() => {
    if (!user || !documentId) {
      setSyncState(user ? 'syncing' : 'offline');
      mergedRef.current = false;
      return;
    }
    let cancelled = false;
    setSyncState('syncing');
    (async () => {
      try {
        const { data: remote, error } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', user.id)
          .eq('document_id', documentId);
        if (cancelled) return;
        if (error) throw error;

        const l = localRef.current;
        const hash = contentHashRef.current;
        const localList = l.getBookmarks(fileName, hash);
        const localPages = new Set(localList.map((b) => b.page));
        const remotePages = new Set((remote ?? []).map((b) => b.page_number));

        (remote ?? []).forEach((r) => {
          if (!localPages.has(r.page_number)) {
            l.addBookmark(fileName, r.page_number, r.label || `Page ${r.page_number}`, hash);
          }
        });

        const localOnly = localList.filter((b) => !remotePages.has(b.page));
        if (localOnly.length > 0) {
          await supabase!.from('bookmarks').upsert(
            localOnly.map((b) => ({
              user_id: user.id,
              document_id: documentId,
              page_number: b.page,
              label: b.label,
              color: 'amber',
            })),
            { onConflict: 'user_id,document_id,page_number' },
          );
        }

        mergedRef.current = true;
        setBookmarks(l.getBookmarks(fileName, hash));
        setSyncState('synced');
        setVersion((v) => v + 1);
      } catch {
        if (!cancelled) setSyncState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, documentId, fileName, contentHash]);

  const refreshBookmarks = useCallback(() => {
    setBookmarks(local.getBookmarks(fileNameRef.current, contentHashRef.current));
  }, [local]);

  const addBookmark = useCallback(
    (page: number, label: string) => {
      const hash = contentHashRef.current;
      local.addBookmark(fileNameRef.current, page, label, hash);
      refreshBookmarks();
      setVersion((v) => v + 1);
      if (user && documentId) {
        setSyncState('syncing');
        supabase
          .from('bookmarks')
          .upsert(
            {
              user_id: user.id,
              document_id: documentId,
              page_number: page,
              label,
              color: 'amber',
            },
            { onConflict: 'user_id,document_id,page_number' },
          )
          .then(({ error }) => setSyncState(error ? 'error' : 'synced'));
      }
    },
    [local, user, documentId, refreshBookmarks],
  );

  const removeBookmark = useCallback(
    (page: number) => {
      const hash = contentHashRef.current;
      local.removeBookmark(fileNameRef.current, page, hash);
      refreshBookmarks();
      setVersion((v) => v + 1);
      if (user && documentId) {
        setSyncState('syncing');
        supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('document_id', documentId)
          .eq('page_number', page)
          .then(({ error }) => setSyncState(error ? 'error' : 'synced'));
      }
    },
    [local, user, documentId, refreshBookmarks],
  );

  return {
    bookmarks,
    isBookmarked: isCurrentPageBookmarked,
    addBookmark,
    removeBookmark,
    syncState,
    version,
  };
}
