# Dad Days Per Country - Minimal

Minimal Next.js + Supabase + Prisma to track days per country.
- Auth: Supabase (magic link/Google) via server checks
- DB: Supabase Postgres with RLS
- CSV import/export
- Metrics view is provided by a SQL view

## Quick start
1. Create Supabase project. Copy envs to `.env.local` from `.env.example`.
2. In Supabase SQL editor run `sql/01_schema.sql`, then `sql/02_rls_policies.sql`, then `sql/03_metrics_view.sql`.
3. Install & dev:
   ```bash
   npm i
   npm run dev
   ```
4. Deploy to Vercel; add the same env vars in Vercel.

CSV headers: `FROM,TO,LOCATION,NOTES`
