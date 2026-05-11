import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { hashFile } from '@/lib/documentHash';

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
      const hash = await hashFile(file);
      const { data: existing } = await supabase
        .from('documents')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_hash', hash)
        .maybeSingle();
      if (cancelled) return;
      if (existing) {
        setDocumentId(existing.id);
        await supabase.from('documents')
          .update({ last_opened_at: new Date().toISOString(), file_name: file.name, page_count: pageCount || 0 })
          .eq('id', existing.id);
        return;
      }
      const { data: created, error } = await supabase
        .from('documents')
        .insert({ user_id: user.id, content_hash: hash, file_name: file.name, page_count: pageCount || 0 })
        .select('id')
        .single();
      if (!error && created && !cancelled) setDocumentId(created.id);
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

  useEffect(() => {
    if (!documentId || !user) { setAnnotations([]); return; }
    setLoading(true);
    supabase
      .from('annotations')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setAnnotations((data ?? []) as unknown as Annotation[]);
        setLoading(false);
      });

    const ch = supabase
      .channel(`annot-${documentId}`)
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
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [documentId, user]);

  const create = useCallback(async (a: Omit<Annotation, 'id' | 'created_at' | 'updated_at' | 'document_id'>) => {
    if (!documentId || !user) return null;
    const payload: any = { ...a, document_id: documentId, user_id: user.id };
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
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...patch } as Annotation : a));
    await supabase.from('annotations').update(patch as any).eq('id', id);
  }, []);

  const remove = useCallback(async (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    await supabase.from('annotations').delete().eq('id', id);
  }, []);

  return { annotations, loading, create, update, remove };
}
