# Auth setup (Google OAuth + Email)

Project ref: **lgparlvsqrlrtqfyavle**

## Environment variables

Create `mypdf-reader/.env` from [Settings → API Keys](https://supabase.com/dashboard/project/lgparlvsqrlrtqfyavle/settings/api-keys):

```env
VITE_SUPABASE_URL=https://lgparlvsqrlrtqfyavle.supabase.co
VITE_SUPABASE_ANON_KEY=<Publishable key — sb_publishable_...>
```

- Use the **Publishable key** (`sb_publishable_...`), not Secret keys.
- **Never** put `sb_secret_...` in `VITE_SUPABASE_URL` — that variable must be the Project URL only.

Restart the dev server after changing `.env`.

## Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project (e.g. `mypdf-reader`)
3. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name: `mypdf.reader`
   - Scopes: `email`, `profile`, `openid`
   - Add your email as a **Test user** while in Testing mode
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Type: **Web application**
   - **Authorized JavaScript origins:**
     - `http://localhost:8080`
     - `http://localhost:8081`
     - `https://mypdf-reader-delta.vercel.app`
   - **Authorized redirect URIs** (must match exactly):
     - `https://lgparlvsqrlrtqfyavle.supabase.co/auth/v1/callback`
5. Copy **Client ID** and **Client Secret**

If you see `Error 400: redirect_uri_mismatch`, the redirect URI above is missing or still points at an old Supabase project ref.

## Supabase Dashboard

1. [Project dashboard](https://supabase.com/dashboard/project/lgparlvsqrlrtqfyavle)
2. **Authentication → Providers → Google** — enable, paste Client ID + Secret, Save
3. **Authentication → Providers → Email** — enable (disable **Confirm email** for local dev if desired)
4. **Authentication → URL Configuration**
   - Site URL: `http://localhost:8080` (local) or `https://mypdf-reader-delta.vercel.app` (production)
   - Redirect URLs: `http://localhost:8080/**`, `http://localhost:8080/library`, `http://localhost:8080/auth`, `https://mypdf-reader-delta.vercel.app/**`

## Verify

1. `/auth` → **Continue with Google** → Google login → redirect to `/library` (no `redirect_uri_mismatch`)
2. Email sign-up → confirm (if enabled) → sign in → Network tab shows **200** on `/auth/v1/token?grant_type=password`

## Production (Vercel)

Deploy at [mypdf-reader-delta.vercel.app](https://mypdf-reader-delta.vercel.app) requires extra steps beyond local `.env`.

### Vercel environment variables

In **Vercel → Project → Settings → Environment Variables**, add for **Production** (and Preview if used):

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | `https://lgparlvsqrlrtqfyavle.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your publishable key from Supabase API settings |

Vite bakes these in at **build time**. After adding or changing them, **Redeploy** (do not reuse an old build).

### Supabase URL configuration (production)

**Authentication → URL Configuration:**

- **Site URL:** `https://mypdf-reader-delta.vercel.app`
- **Redirect URLs:** add `https://mypdf-reader-delta.vercel.app/**`

Keep localhost entries if you still develop locally.

### Google OAuth (production)

In Google Cloud Console, add to **Authorized JavaScript origins:**

- `https://mypdf-reader-delta.vercel.app`

Redirect URI stays Supabase (do not point at Vercel):

- `https://lgparlvsqrlrtqfyavle.supabase.co/auth/v1/callback`

### Verify production sign-in

1. Open `/auth` in an incognito window on the production URL.
2. DevTools → **Application → Local Storage** — look for `sb-lgparlvsqrlrtqfyavle-auth-token` after sign-in.
3. Network tab — `supabase.co` auth requests should return **200**.
