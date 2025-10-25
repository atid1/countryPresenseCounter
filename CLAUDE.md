# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js application for tracking days spent per country with CSV import/export and metrics. Uses:
- **Next.js 14** (App Router)
- **Supabase** for authentication and PostgreSQL database
- **Prisma 6** as ORM
- **TypeScript** with strict mode

## Development Commands

```bash
# Install dependencies
npm i

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Generate Prisma client (after schema changes)
npm run db:gen

# Push Prisma schema to database
npm run db:push
```

## Initial Setup

1. Create a Supabase project and copy environment variables from `.env.example` to `.env.local`
2. Run SQL files in Supabase SQL editor **in order**:
   - `sql/01_schema.sql` - Database schema
   - `sql/02_rls_policies.sql` - Row Level Security policies
   - `sql/03_metrics_view.sql` - Metrics view
3. Run `npm i` and `npm run dev`

## Architecture

### Authentication Flow
- **Server-side**: Use `requireUserId()` from [src/lib/auth.ts](src/lib/auth.ts) in API routes to enforce authentication and get the current user ID
- **Client-side**: Supabase client handles magic link and OAuth flows
- **Callback**: Auth callback handled in [src/app/api/auth/callback/route.ts](src/app/api/auth/callback/route.ts)

### Database Access
- **Prisma client**: Initialized as a global singleton in [src/lib/prisma.ts](src/lib/prisma.ts) for hot-reload safety in development
- **Supabase server client**: Created via [src/lib/supabase.ts](src/lib/supabase.ts) using `@supabase/ssr` with cookie management
- **Security**: Row Level Security (RLS) enforced at database level; trips are filtered by `user_id`

### Data Model
Two main tables (see [prisma/schema.prisma](prisma/schema.prisma)):
- `country`: Reference table with 2-letter country codes and labels
- `trip`: User trips with date ranges (`date_from`, `date_to`), linked to countries via `country_code`

Important: Field names use `snake_case` (e.g., `user_id`, `country_code`, `date_from`, `date_to`, `created_at`).

### CSV Import/Export
- **Format**: CSV headers must be `FROM,TO,LOCATION,NOTES`
- **Parsing**: Handled by `csv-parse/sync` in [src/lib/csv.ts](src/lib/csv.ts)
- **Import**: [src/app/api/import/route.ts](src/app/api/import/route.ts) - normalizes country input, validates dates, and upserts country codes
- **Export**: [src/app/api/export/route.ts](src/app/api/export/route.ts)

### API Routes Structure
All API routes follow Next.js App Router conventions in `src/app/api/`:
- `api/trips/route.ts` - GET (list), POST (create), DELETE trips
- `api/import/route.ts` - POST multipart CSV upload
- `api/export/route.ts` - GET CSV download
- `api/auth/callback/route.ts` - OAuth callback handler

All routes expect authenticated users (enforced via `requireUserId()`).

### Metrics
Metrics are computed via a SQL view (`sql/03_metrics_view.sql`) and are not exposed in the UI. Query the database view directly if needed.

## Code Conventions

- **Imports**: Use absolute imports with `@/` alias (e.g., `@/src/lib/prisma`)
- **Forms**: Standard HTML forms with POST/redirect flows; file uploads use `multipart/form-data`
- **Error handling**: Minimal; errors are propagated to UI or handled via redirect with error messages
- **Environment variables**: All secrets/configs in `.env.local` (never commit this file)

## Key Architectural Patterns

1. **Prisma Client Singleton**: Global instance prevents multiple clients in development hot-reload scenarios
2. **Supabase SSR**: Server client uses cookie-based session management compatible with Next.js App Router
3. **Server-side Auth**: All protected routes call `requireUserId()` which throws if not authenticated
4. **CSV Normalization**: Import process normalizes country inputs (removes emojis, trims whitespace) and upserts country codes