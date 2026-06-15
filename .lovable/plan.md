# Security Hardening: CI Gate + Consolidated Findings

Three coordinated pieces of work: (1) a CI workflow that fails the build on new high-severity findings, (2) a re-run of all scans with confirmation of zero remaining issues, and (3) an in-app consolidated security view that loads & dedupes findings from every scanner (Supabase, Supabase-Lov, Wiz, Aikido, and any future connector scanners).

---

## 1. CI security gate (GitHub Actions)

New file: `.github/workflows/security-gate.yml`

- Triggers: `pull_request` and `push` to `main`.
- Steps:
  1. Checkout.
  2. `bun install`.
  3. **Dependency audit** — run `bun audit --json` (or `npm audit --audit-level=high --json` as fallback) and fail if any `high` or `critical` advisories appear.
  4. **Static secret scan** — run `gitleaks detect --no-banner --redact` (pinned action `gitleaks/gitleaks-action@v2`). Fail on any leak.
  5. **Lovable scan results gate** — call the Lovable scan-results API (workspace-scoped, includes Wiz/Aikido when connected) using a `LOVABLE_API_KEY` repo secret. A small Node script (`scripts/security-gate.mjs`) fetches `/v1/projects/{id}/security/findings`, filters `severity in (high, critical)` and `state = failing`, prints a Markdown table to `$GITHUB_STEP_SUMMARY`, and exits non-zero if the count > 0.
  6. Upload the JSON report as a workflow artifact for traceability.

Repo secrets required (documented in plan, asked at build time):
- `LOVABLE_API_KEY` — for the scan-results API.
- `LOVABLE_PROJECT_ID` — already known: this project's ID.

Bypass: a `security-gate-bypass` PR label skips step 5 only (audit + gitleaks still run) so urgent hotfixes aren't blocked.

---

## 2. Re-run all scans & confirm zero issues

After CI is in place:

1. Call `security--run_security_scan` (Supabase scanners).
2. Call `supabase--linter` for DB-level checks.
3. Pull persisted findings via `security--get_scan_results` (includes `connector_security_scan` which surfaces Wiz/Aikido).
4. Confirm every scanner returns `findings: []`. If anything new appears, fix it inline (RLS, GRANTs, policies, etc.) and rescan.
5. Update `@security-memory` with the latest posture summary.

Expected outcome: 0 failing findings across `supabase`, `supabase_lov`, and `connector_security_scan`. If Wiz is not connected at the workspace level, note that explicitly and offer a `<presentation-mcp-connect>`-style action so the user can hook it up.

---

## 3. In-app consolidated security view

New route: `/security` (auth-gated, owner only).

### Data layer
- New hook `src/hooks/useSecurityFindings.ts`:
  - Calls a new edge function `security-findings` (server-side, uses `LOVABLE_API_KEY` from secrets) that aggregates:
    - Supabase scanner output
    - Supabase-Lov scanner output
    - `connector_security_scan` output (Wiz, Aikido, future)
  - Normalizes every finding to:
    ```ts
    type Finding = {
      id: string;             // stable hash (see dedupe)
      scanner: string;        // 'supabase' | 'supabase_lov' | 'wiz' | 'aikido' | ...
      severity: 'critical'|'high'|'medium'|'low'|'info';
      title: string;
      description: string;
      resource?: string;      // table, file, URL
      firstSeen: string;
      lastSeen: string;
      state: 'failing'|'fixed'|'ignored';
      sources: string[];      // scanners that reported the same issue (post-dedupe)
    };
    ```

### Dedupe strategy
Composite key = `sha256(normalize(title) + '|' + normalize(resource) + '|' + severity)`.
- Lowercase, strip punctuation, collapse whitespace for `title` and `resource`.
- When two scanners produce the same key, merge into one row and append both scanner names to `sources`.
- Preserve the earliest `firstSeen` and the latest `lastSeen`.
- A small `dedupeFindings(rows: RawFinding[]): Finding[]` pure function lives in `src/lib/security/dedupe.ts` with unit tests in `src/lib/security/dedupe.test.ts`.

### UI (`src/pages/Security.tsx`)
- Header with totals per severity (Critical / High / Medium / Low) as colored chips.
- Filter bar: scanner multi-select, severity multi-select, state toggle (failing / ignored / fixed), free-text search.
- Sortable table (TanStack-style, but plain — no new dep) with columns: Severity • Title • Resource • Scanners • Last seen • Actions.
- Row expand → full description, remediation hint, "Mark fixed" / "Ignore" buttons (call existing manage-finding endpoint via the same edge function).
- Empty state styled to match the book aesthetic (warm paper, ruled lines) — "All clear. No open findings."
- Link from the home screen header: small shield icon → `/security`, shows a red dot if any high/critical failing finding exists.

### Edge function `supabase/functions/security-findings/index.ts`
- `GET` → returns deduped findings JSON.
- `POST` with `{action: 'mark_fixed'|'ignore', id, explanation}` → proxies to the Lovable security API.
- Uses `LOVABLE_API_KEY` from env (already a project secret).
- CORS headers + JWT verification (owner-only via a `user_roles` check; if no roles table exists yet, gate by `auth.uid() === documents.user_id LIMIT 1` owner heuristic — confirmed during build).

---

## Order of execution
1. Build the edge function + dedupe lib + tests.
2. Build the `/security` page + hook + home-screen shield link.
3. Add the GitHub Actions workflow + `scripts/security-gate.mjs`.
4. Re-run scans, fix anything new, confirm zero findings, update security memory.

## Open questions before I start
- Confirm you have a **GitHub repo connected** for this project (CI only makes sense if so).
- Confirm **Wiz is connected at the workspace level** (otherwise its findings will simply be absent — not an error, but worth surfacing in the UI as "Wiz not connected").
- Should the `/security` page be **owner-only** (you) or visible to **any authenticated user**? Default in the plan: owner-only.
