
# Site Audit — Fixes & Feature Plan

I visited the live app on desktop (1280) and mobile (390) across `/`, `/library`, `/auth`, `/security` and captured screenshots. Below is what I found and what I propose.

---

## A. Bugs & UX corrections (do first)

### A1. Landing hero has a huge empty region
On desktop the H1 ("Read smarter. Understand faster.") sits ~700px down the page and the right column (3D robot scene) is anchored near the bottom. Result: users see a mostly-black viewport on first load.

**Fix:** In `HeroSection` / `HeroScene`, vertically center the two columns in a `min-h-[calc(100vh-4rem)] grid place-items-center` container; cap the 3D canvas at `h-[520px]` and align its top to the hero text row.

### A2. Landing sections below the hero don't render on mobile
The mobile screenshot ends after the feature chips and the preview card; Features / Pricing / Testimonials / Footer are either not mounted on mobile or hidden behind a `md:` breakpoint.

**Fix:** Audit `Landing.tsx` section list — remove `hidden md:block` on `FeaturesGrid`, `HowItWorks`, `Pricing`, `Testimonials`, `LandingFooter`. Add mobile-first spacing (`py-16 px-5`).

### A3. Auth page split-screen is unbalanced on desktop
Left showcase ends at ~250px height while the right card is ~1100px; large dead space in the middle.

**Fix:** Make the left column `sticky top-0 h-screen flex flex-col justify-center`, and stack the "Cloud Sync / Secure Storage / Lightning Fast" chips + testimonial to fill the column.

### A4. Landing 3D scene is missing on mobile
`HeroScene` (Spline/WebGL) is gated to desktop. Mobile users see nothing where the visual should be.

**Fix:** Replace with a lightweight animated preview (existing `HeroAppPreview`) for `<md` breakpoints; keep Spline for desktop only.

### A5. Reader toolbar/panel responsiveness (regression check)
The earlier mobile-responsive pass shipped, but I want to re-verify the reader on 390px width with a real PDF: toolbar overflow, panels (Search, Stats, Bookmarks, AI) opening as bottom sheets, and pinch-zoom.

**Fix:** Convert side panels to `<Sheet side="bottom">` on `<md`; collapse `PDFToolbar` extras into an overflow menu.

### A6. Console warnings
- `React Router Future Flag Warning: v7_startTransition` — enable the flag in `BrowserRouter.future`.
- `updating from 115 to 122` — noisy log from PDF.js version bump, silence in `useFullTextSearch`.

### A7. `/security` UX
Currently redirects unauth users straight to `/auth`. Show a friendlier "Sign in to view security dashboard" gate (already partially in `RequireAuth` — verify copy).

---

## B. Feature additions (grouped, pick which to build)

### B1. Reading experience
1. Continuous scroll mode toggle (page-flip ↔ vertical scroll).
2. Two-page spread on desktop (facing pages, center gutter shadow).
3. Focus/immersive mode — hide chrome, edge-tap to flip.
4. Per-document settings memory (zoom, theme, scroll mode, last page).

### B2. Study & AI
5. Flashcard SRS scheduling (Leitner boxes) on top of the existing study deck.
6. "Explain this page" one-click summary pinned in the AI panel.
7. Auto-generated chapter outline from PDF text (feeds OutlinePanel).
8. Selection → "Ask AI about this" quick action in the selection toolbar.

### B3. Library & organization
9. Folders / collections with drag-to-reorder.
10. Reading goals ("finish by X" + progress ring on cover).
11. Tags + saved searches.
12. Import from URL / Google Drive.

### B4. Sync & offline
13. PWA install + offline reading of last N documents.
14. Cross-device "resume where you left off" toast.

### B5. Accessibility & polish
15. Keyboard shortcut overlay (`?`).
16. Dyslexia-friendly font + line-height slider.
17. High-contrast theme.
18. Screen-reader labels audit.

---

## Suggested execution order

1. **Ship A1–A4 + A6** in one pass — pure presentational fixes, no business logic. Biggest visible impact.
2. **A5** reader mobile re-verification (measured with Playwright on a real PDF).
3. **A7** security-page gate copy.
4. Then pick a feature bundle from B — recommended first bundle: **B1.1 + B1.4 + B2.6 + B5.1** (fast wins, high perceived value).

---

## Open questions

1. Do you want me to start with **just the A fixes** (safe, presentational), or bundle a feature group from B in the same build?
2. For mobile hero (A4) — keep Spline off entirely on mobile, or load it lazily after first paint?
3. Any features in B you want to drop or add before I plan them in detail?
