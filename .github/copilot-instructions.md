# Copilot Instructions for AI Agents

## Project Overview

- **Purpose:** Track days spent per country for a user, with import/export and metrics.
- **Stack:** Next.js (App Router), Supabase (auth, Postgres DB), Prisma (ORM), CSV import/export.
- **Key Flows:**
  - User authentication via Supabase magic link (see `src/app/login/page.tsx`, `src/app/api/auth/callback/route.ts`).
  - Trips CRUD via API routes (`src/app/api/trips/route.ts`) and UI (`src/app/trips/page.tsx`).
  - CSV import/export (`src/app/api/import/route.ts`, `src/app/api/export/route.ts`).
  - Metrics view is a SQL view, not a UI page (see `sql/03_metrics_view.sql`).

## Architecture & Patterns

- **API routes** use Next.js App Router conventions, with server-side logic in `src/app/api/*/route.ts`.
- **Prisma** is initialized in `src/lib/prisma.ts` with a global singleton pattern for hot-reload safety.
- **Supabase**
  - Client: `@supabase/supabase-js` for browser-side (see `src/app/login/page.tsx`).
  - Server: `@supabase/ssr` with cookie management (see `src/lib/supabase.ts`).
- **Auth**: Use `requireUserId()` (`src/lib/auth.ts`) in server routes to enforce authentication.
- **CSV**: Parsing handled by `csv-parse/sync` in `src/lib/csv.ts`.
- **Forms**: Use standard HTML forms for POST/redirect flows; file uploads use `multipart/form-data`.
- **Environment**: All secrets/configs via `.env.local` (see README for setup).

## Developer Workflows

- **Setup:**
  - Run all SQL in `sql/` on Supabase (in order: 01, 02, 03).
  - Install dependencies: `npm i`
  - Start dev server: `npm run dev`
- **Testing:** No formal test suite; manual testing via UI and API.
- **Deploy:** Deploy to Vercel; ensure env vars are set.

## Conventions & Tips

- Use absolute imports with `@/src/...` alias.
- All API routes expect authenticated users (enforced server-side).
- CSV headers must be: `FROM,TO,LOCATION,NOTES`.
- Minimal error handling; propagate errors to UI or redirect with error message.
- Metrics are not exposed in the UI—query the SQL view directly if needed.

## Key Files & Directories

- `src/app/api/` — API endpoints (auth, trips, import/export)
- `src/app/trips/page.tsx` — Main trips UI
- `src/lib/` — Shared logic (auth, prisma, supabase, csv)
- `sql/` — DB schema, RLS, metrics view
- `README.md` — Setup and usage instructions

---

For more, see `README.md` and referenced files above. When in doubt, follow the patterns in existing files.
