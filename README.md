# PDF Reader

A browser-based PDF reader with local progress, bookshelf library, AI-assisted reading (summarize, chat), highlights, bookmarks, and three reading themes (Light, Dark, High Contrast).

## Quick start

The app lives in the **`mypdf-reader`** folder (not the repo root).

```bash
cd mypdf-reader
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:8080`).

## Environment variables

Create `mypdf-reader/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Required for sign-in, cloud bookmarks, annotations, and AI features (summarize/chat). Uploading and reading PDFs works without auth using local storage.

For Google OAuth and email auth setup, see [docs/AUTH_SETUP.md](docs/AUTH_SETUP.md).

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing — hero, upload, feature overview |
| `/library` | Bookshelf, search, upload |
| `/read/:docId` | PDF reader |
| `/auth` | Sign in / sign up |
| `/security` | Security findings (authenticated) |

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run test     # Vitest unit tests
npm run preview  # Preview production build
```

## Supabase edge functions

Deploy after changing auth or AI functions:

```bash
supabase functions deploy summarize-page
supabase functions deploy chat-page
supabase functions deploy security-findings
```

Set `LOVABLE_API_KEY` in Supabase secrets for AI endpoints.

## Tech stack

- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- pdf.js for rendering
- Supabase (auth, annotations, edge functions)

## Data storage

- **PDF files:** IndexedDB cache (max 20 files, LRU eviction)
- **Progress & bookmarks:** `localStorage` when logged out; synced to Supabase when signed in
