# 🌳 MineTree

The sleek, ad-free, open link-in-bio platform. Built with Next.js (App Router),
Supabase, Tailwind CSS v4, and dnd-kit.

## What's inside

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx        # Supabase SSR cookie login
│   │   ├── signup/page.tsx       # Signup (+ DB trigger bootstraps profile)
│   │   ├── layout.tsx            # Centered auth card
│   │   └── actions.ts            # signUp / signInWithPassword / signOut
│   ├── auth/confirm/route.ts     # Email confirmation token exchange (PKCE)
│   ├── dashboard/
│   │   ├── page.tsx              # Protected portal: stats + DnD + live preview
│   │   ├── actions.ts            # Link CRUD, atomic reorder RPC, settings
│   │   ├── claim/page.tsx        # Onboarding: claim your username
│   │   └── settings/page.tsx     # Profile, avatar upload, theme editor
│   ├── [username]/page.tsx       # Public tree (ISR 60s, notFound fallback)
│   ├── api/click/route.ts        # sendBeacon analytics sink (service role)
│   ├── layout.tsx, page.tsx, globals.css, not-found.tsx
│   └── middleware.ts             # Session refresh + route protection
├── components/                   # TreeContent, PhonePreview, LinkManager,
│                                 # ThemeEditor, ClickTracker, ui/ primitives
├── lib/
│   ├── supabase/                 # client.ts / server.ts / admin.ts / middleware.ts
│   ├── database.types.ts         # Generated-style DB types
│   ├── themes.ts                 # 5 presets + custom accent/font/button styles
│   ├── analytics.ts              # Aggregated view/click stats
│   └── utils.ts                  # cn(), URL + username validation
└── middleware.ts → src/middleware.ts
supabase/migrations/0001_init.sql # Full schema: tables, RLS, triggers, RPCs, storage
```

## Setup — step by step

### 1. Create the Supabase project
1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Once created, open **SQL Editor** → **New query**.
3. Paste the entire contents of `supabase/migrations/0001_init.sql` and **Run**.
   This creates `profiles`, `links`, `analytics_events`, all RLS policies, the
   signup trigger, the `reorder_links` / `record_link_click` RPCs, and the
   public `avatars` storage bucket with owner-only write policies.

### 2. Configure auth URLs
In Supabase → **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000` (later: your Vercel URL)
- **Redirect URLs**: add `http://localhost:3000/auth/confirm`

### 3. Environment variables
```bash
cp .env.example .env.local
```
Fill in from **Project Settings → API**: the project URL, the `anon` key, and
the `service_role` key (server-only, used by `/api/click`).

### 4. Run locally
```bash
npm install
npm run dev
```
Open `http://localhost:3000`, sign up, claim a username, add links.

### 5. Deploy to Vercel
1. Push this repo to GitHub and import it in Vercel.
2. Add the same env vars from `.env.local` (plus `NEXT_PUBLIC_SITE_URL` set to
   your production URL).
3. In Supabase → Authentication → URL Configuration, update **Site URL** to the
   production domain and add `https://<your-domain>/auth/confirm` to redirects.
4. Deploy. The public `/[username]` pages are ISR-cached (60s) and instantly
   revalidated on every edit via server actions.

## How the core pieces work

**Auth (SSR cookies).** `@supabase/ssr` clients in `lib/supabase/` share the
cookie session between browser, Server Components, and server actions.
`middleware.ts` refreshes expiring tokens on every navigation and gates
`/dashboard/**`.

**Drag-and-drop.** The dashboard renders sortable rows with `dnd-kit`. On drag
end it updates local state instantly (optimistic) and calls the
`reorder_links` Postgres function — one atomic `UPDATE ... FROM unnest(...)`
that positions every link of the caller in a single statement, guarded by
`auth.uid()`.

**Public pages.** `/[username]` is a Server Component that fetches profile +
active links with the anon key (RLS applies), validates the slug against
`USERNAME_RE`, and calls `notFound()` for unknown usernames. `revalidate = 60`
keeps it edge-cached; edits trigger `revalidatePath` so changes appear instantly.

**Analytics.** `ClickTracker` (client) sends `navigator.sendBeacon` events to
`/api/click`, which writes rows with the service-role client via the
`record_link_click` RPC. Visitors never touch the analytics table directly, and
the beacon never blocks navigation.
