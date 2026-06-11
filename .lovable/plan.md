# Enhancement Plan

Four selected scopes, shipped as four phases. Each phase is independently usable so you can stop or reprioritize between them.

---

## Phase 1 — Mobile Responsive (ship first)

Highest impact, no backend work. Makes the app actually usable on phones.

**Toolbar (`PDFToolbar.tsx`)**
- Detect mobile via existing `useIsMobile` hook.
- On mobile: collapse non-essential controls into a hamburger sheet (Sheet from shadcn). Keep page nav + page indicator + close inline.
- Larger 44px tap targets, icon-only on small screens.

**Side panels → bottom sheets on mobile**
- `ThumbnailSidebar`, `BookmarkPanel`, `ChatPanel`, `SummaryPanel`, `WordDefinitionPanel` already use Sheet; switch `side="right"` to `side="bottom"` when `isMobile` and cap height at 85vh.

**Viewer gestures (`VirtualPdfList` + `PageRenderer`)**
- Pinch-to-zoom: native CSS `touch-action: pan-y pinch-zoom` on the canvas wrapper + a JS pinch listener that updates `scale` (debounced).
- Double-tap to toggle fit-width ↔ 200%.
- Swipe left/right at viewport edges to flip page (only when zoomed at fit-width).

**Default scale**
- On first open on mobile, auto-compute scale so page width = container width (fit-to-width). Already partially handled; add explicit `useEffect` on mount + resize.

**Misc**
- Read-aloud controls dock to bottom on mobile.
- `Index.tsx` upload area: stack vertically, larger drop zone.

---

## Phase 2 — Full-text Search

Pure frontend, uses PDF.js's `getTextContent` (already loaded).

- New `useFullTextSearch(pdfDoc)` hook: extracts text per page lazily, caches in a Map, exposes `search(query)` returning `{page, snippet, matchIndex}[]`.
- New `SearchPanel` component (Sheet, opens from toolbar search icon): input + result list with snippets and page numbers; click jumps to page.
- Highlight matches: pass `searchQuery` to `PageRenderer`; after text layer renders, wrap matches in `<mark>` (CSS class with accent background).
- Keyboard: `Ctrl/Cmd+F` opens search; `Enter`/`Shift+Enter` next/prev.

---

## Phase 3 — Reading Stats + Streaks

LocalStorage-based (no backend dependency), shown in a stats panel.

**New `useReadingStats` hook**
- Track per-document: `totalSecondsRead`, `pagesRead` (Set), `sessions[]` (date + duration), `lastReadDate`.
- Track global: `dailyMinutes` (Map<YYYY-MM-DD, minutes>), `currentStreak`, `longestStreak`.
- Timer: increments while tab is visible AND user is interacting (scroll/click in last 60s). Pause on `visibilitychange`.

**New `StatsPanel` component**
- Triggered from toolbar (BarChart icon) or `Index.tsx`.
- Shows: today's minutes, current streak (🔥), longest streak, last 30 days heatmap (simple grid), per-document progress bars, top 5 most-read documents.

---

## Phase 4 — Cloud Sync (bookmarks + annotations)

Annotations table already exists. Add bookmarks table + auth gate.

**Auth**
- `Auth.tsx` and `useAuth` already exist. Add a "Sign in to sync" banner in `Index.tsx`; sync is optional.

**Schema migration**
```sql
CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  page_number int NOT NULL,
  label text,
  color text NOT NULL DEFAULT 'amber',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bookmarks" ON public.bookmarks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

**Sync strategy (last-write-wins, simple)**
- New `useCloudSync(documentId)` hook: when authed, on document open it
  1. Upserts a `documents` row keyed by `content_hash`.
  2. Pulls remote bookmarks + annotations.
  3. Merges with localStorage (remote wins on conflict by `updated_at`).
  4. Subscribes to realtime changes for live multi-device updates.
- Local writes mirror to cloud in background; failures queued in localStorage and retried on reconnect.
- Reading stats stay local for now (can add later if you want).

**UI**
- Small cloud icon in toolbar: grey (offline), blue (synced), spinner (syncing), red (error with retry).

---

## Technical notes (skip if not interested)

- No new heavy deps. Pinch zoom uses native pointer events; no `hammerjs`.
- Search highlight uses existing text layer DOM (already rendered for selection), so no extra render pass.
- Stats panel uses a simple CSS grid heatmap, no chart lib.
- Realtime requires `ALTER PUBLICATION supabase_realtime ADD TABLE` for `annotations` and `bookmarks` — included in Phase 4 migration.
- Each phase ends with a typecheck (`bunx tsc --noEmit`) and a quick manual smoke in the preview.

---

## Order

Phase 1 → Phase 2 → Phase 3 → Phase 4. Approve and I'll start with Phase 1.
