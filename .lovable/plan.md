# Annotations, Cloud Sync & Virtualization

Three connected features. Shipping in one pass since annotations require auth + DB, and virtualization touches the same `PDFViewer` we'd otherwise rewrite twice.

## 1. Auth (prerequisite for cloud annotations)

- Email/password + Google sign-in (Lovable Cloud defaults).
- New `/auth` route with sign-in / sign-up tabs and a `/reset-password` page.
- Header shows user avatar + sign-out; PDF viewer works signed-out but **annotations are gated** (selecting text shows "Sign in to highlight").
- No `profiles` table needed — we don't store display names beyond what `auth.users` already has. (Tell me if you want avatars/usernames and I'll add one.)

## 2. Database

Document identity = SHA-256 of file bytes, so the same PDF reopened later (even renamed) loads the same annotations.

```
documents         id, user_id, content_hash (unique per user), file_name, page_count, last_opened_at
annotations       id, user_id, document_id, page_number, type ('highlight'|'note'),
                  color, rects (jsonb: [{x,y,w,h}] in PDF user-space units),
                  quote (selected text), note_text (nullable), created_at, updated_at
```

RLS: each user can only CRUD their own rows. Indexes on `(document_id, page_number)`.

## 3. Text-layer overlay & annotation UI

- Render PDF.js text layer absolutely positioned over the canvas (same scale/viewport).
- On `mouseup` inside the text layer with a non-empty selection → floating toolbar (4 highlight colors + 📝 sticky note).
- Highlights: store `rects` from `Range.getClientRects()` converted to PDF units; render as colored translucent boxes under the text layer.
- Sticky notes: small pin icon at the selection's start; click opens a popover with a textarea (autosaves on blur).
- Right-click an existing annotation → delete / change color / edit note.
- All writes go through `useAnnotations(documentId)` hook with optimistic updates and Realtime subscription so a second tab stays in sync.

## 4. Page virtualization

Replace single-canvas viewer with a virtualized vertical list:

- Compute each page's display height up-front from `page.getViewport({scale})` (cheap — no render).
- Use `@tanstack/react-virtual` to mount only pages whose placeholders intersect (or are within ~2 pages of) the viewport.
- Each visible page is a `<PageRenderer>` that renders canvas + text layer + annotation layer; off-screen pages show a sized skeleton so scrollbar length stays correct.
- `currentPage` is derived from which page occupies the most viewport (IntersectionObserver), keeping toolbar/bookmarks/chat behavior unchanged.
- Scroll-to-page (bookmarks, thumbnails, page input) uses the virtualizer's `scrollToIndex`.
- 3D page-flip animation only fires on explicit prev/next clicks, not on scroll, so virtualization stays smooth.

## 5. Files

```text
new   src/pages/Auth.tsx
new   src/pages/ResetPassword.tsx
new   src/hooks/useAuth.tsx              # session + listener
new   src/hooks/useAnnotations.ts        # fetch/create/update/delete + realtime
new   src/lib/documentHash.ts            # SHA-256 of file
new   src/components/AnnotationLayer.tsx
new   src/components/TextLayer.tsx
new   src/components/SelectionToolbar.tsx
new   src/components/StickyNotePopover.tsx
new   src/components/PageRenderer.tsx    # canvas + text + annotation layers for one page
new   src/components/VirtualPdfList.tsx  # tanstack-virtual list
edit  src/components/PDFViewer.tsx       # swap single-canvas for VirtualPdfList, gate annotations
edit  src/App.tsx                         # /auth, /reset-password routes
edit  src/pages/Index.tsx                 # show sign-in CTA in header
new   supabase migration                  # documents + annotations tables, RLS, indexes, updated_at trigger
```

## 6. Out of scope (next milestone)

- Shared read-only links (next feature in the roadmap).
- Exporting annotations.
- Annotations on scanned/image-only PDFs (no selectable text → toolbar simply won't appear).

Approve and I'll run the migration, then build it.
