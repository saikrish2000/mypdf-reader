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
export function useSyncedBookmarks(fileName: string, documentId: string | null) {
  const { user } = useAuth();
  const local = usePDFStorage();
  const [version, setVersion] = useState(0);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'synced' | 'error' | 'offline'>(
    user ? 'syncing' : 'offline',
  );
  const mergedRef = useRef(false);

  const bookmarks = local.getBookmarks(fileName);
  const isCurrentPageBookmarked = (page: number) => local.isBookmarked(fileName, page);

  // Initial merge: pull remote → ensure all are present locally, push local-only → remote.
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

        const localList = local.getBookmarks(fileName);
        const localPages = new Set(localList.map((b) => b.page));
        const remotePages = new Set((remote ?? []).map((b) => b.page_number));

        // Add remote-only into local
        (remote ?? []).forEach((r) => {
          if (!localPages.has(r.page_number)) {
            local.addBookmark(fileName, r.page_number, r.label || `Page ${r.page_number}`);
          }
        });

        // Push local-only → remote
        const localOnly = localList.filter((b) => !remotePages.has(b.page));
        if (localOnly.length > 0) {
          await supabase.from('bookmarks').upsert(
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
        setSyncState('synced');
        setVersion((v) => v + 1);
      } catch (e) {
        if (!cancelled) setSyncState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, documentId, fileName, local]);

  const addBookmark = useCallback(
    (page: number, label: string) => {
      local.addBookmark(fileName, page, label);
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
    [local, fileName, user, documentId],
  );

  const removeBookmark = useCallback(
    (page: number) => {
      local.removeBookmark(fileName, page);
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
    [local, fileName, user, documentId],
  );

  // version is used to force consumers re-render after add/remove
  return {
    bookmarks,
    isBookmarked: isCurrentPageBookmarked,
    addBookmark,
    removeBookmark,
    syncState,
    version,
  };
}
