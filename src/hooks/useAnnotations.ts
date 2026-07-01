import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { hashFile } from '@/lib/documentHash';
import { toast } from 'sonner';

type AnnotationInsert = Database['public']['Tables']['annotations']['Insert'];
type AnnotationUpdate = Database['public']['Tables']['annotations']['Update'];

export type AnnotationType = 'highlight' | 'note';
export interface AnnotationRect {
  x: number; y: number; w: number; h: number;
}
export interface Annotation {
  id: string;
  document_id: string;
  page_number: number;
  type: AnnotationType;
  color: string;
  rects: AnnotationRect[];
  quote: string;
  note_text: string | null;
  created_at: string;
  updated_at: string;
}

export function useDocumentId(file: File | null, pageCount: number) {
  const { user } = useAuth();
  const [documentId, setDocumentId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!file || !user) { setDocumentId(null); return; }
      if (pageCount <= 0) return;
      if (!supabase) return;

      try {
        const hash = await hashFile(file);
        const { data: existing, error: selectError } = await supabase
          .from('documents')
          .select('id')
          .eq('user_id', user.id)
          .eq('content_hash', hash)
          .maybeSingle();
        if (cancelled) return;
        if (selectError) throw selectError;
        if (existing) {
          setDocumentId(existing.id);
          await supabase!.from('documents')
            .update({ last_opened_at: new Date().toISOString(), file_name: file.name, page_count: pageCount })
            .eq('id', existing.id);
          return;
        }
        const { data: created, error } = await supabase
          .from('documents')
          .insert({ user_id: user.id, content_hash: hash, file_name: file.name, page_count: pageCount })
          .select('id')
          .single();
        if (!error && created && !cancelled) setDocumentId(created.id);
        else if (error) throw error;
      } catch {
        if (!cancelled) toast.error('Could not register document for cloud sync.');
      }
    };
    run();
    return () => { cancelled = true; };
  }, [file, user, pageCount]);

  return documentId;
}

export function useAnnotations(documentId: string | null) {
  const { user } = useAuth();
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(false);
  const annotationsRef = useRef(annotations);
  annotationsRef.current = annotations;

  useEffect(() => {
    if (!documentId || !user) { setAnnotations([]); return; }
    let cancelled = false;
    setLoading(true);
    let fetchFailed = false;
    supabase
      .from('annotations')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          fetchFailed = true;
          console.error('Failed to load annotations:', error);
          toast.error('Could not load your highlights. They may appear after you refresh.');
          setAnnotations([]);
        } else {
          setAnnotations((data ?? []) as unknown as Annotation[]);
        }
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (!fetchFailed) {
          console.error('Failed to load annotations:', err);
          toast.error('Could not load your highlights.');
        }
        setAnnotations([]);
        setLoading(false);
      });

    const ch = supabase
      .channel(`user:${user.id}:annot-${documentId}`, { config: { private: true } })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'annotations', filter: `document_id=eq.${documentId}` },
        (payload) => {
          setAnnotations((prev) => {
            if (payload.eventType === 'INSERT') {
              const row = payload.new as unknown as Annotation;
              if (prev.some(a => a.id === row.id)) return prev;
              return [...prev, row];
            }
            if (payload.eventType === 'UPDATE') {
              const row = payload.new as unknown as Annotation;
              return prev.map(a => a.id === row.id ? row : a);
            }
            if (payload.eventType === 'DELETE') {
              const row = payload.old as unknown as Annotation;
              return prev.filter(a => a.id !== row.id);
            }
            return prev;
          });
        })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.warn('Realtime annotations subscription status:', status);
        }
      });
    return () => { cancelled = true; supabase!.removeChannel(ch); };
  }, [documentId, user]);

  const create = useCallback(async (a: Omit<Annotation, 'id' | 'created_at' | 'updated_at' | 'document_id'>) => {
    if (!documentId || !user) return null;
    const payload: AnnotationInsert = {
      ...a,
      document_id: documentId,
      user_id: user.id,
      rects: a.rects as unknown as AnnotationInsert['rects'],
    };
    const { data, error } = await supabase
      .from('annotations')
      .insert(payload)
      .select('*')
      .single();
    if (error) return null;
    const row = data as unknown as Annotation;
    setAnnotations(prev => prev.some(x => x.id === row.id) ? prev : [...prev, row]);
    return row;
  }, [documentId, user]);

  const update = useCallback(async (id: string, patch: Partial<Annotation>) => {
    const prevSnapshot = annotationsRef.current;
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...patch } as Annotation : a));
    const dbPatch: AnnotationUpdate = {
      ...patch,
      rects: patch.rects as unknown as AnnotationUpdate['rects'],
    };
    const { error } = await supabase!.from('annotations').update(dbPatch).eq('id', id);
    if (error) setAnnotations(prevSnapshot);
  }, []);

  const remove = useCallback(async (id: string) => {
    const prevSnapshot = annotationsRef.current;
    setAnnotations(prev => prev.filter(a => a.id !== id));
    const { error } = await supabase!.from('annotations').delete().eq('id', id);
    if (error) setAnnotations(prevSnapshot);
  }, []);

  return { annotations, loading, create, update, remove };
}
