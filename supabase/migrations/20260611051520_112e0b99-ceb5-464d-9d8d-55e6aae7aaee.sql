CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  page_number int NOT NULL,
  label text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT 'amber',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_id, page_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own bookmarks" ON public.bookmarks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own bookmarks" ON public.bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own bookmarks" ON public.bookmarks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own bookmarks" ON public.bookmarks FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX bookmarks_user_doc_idx ON public.bookmarks(user_id, document_id);