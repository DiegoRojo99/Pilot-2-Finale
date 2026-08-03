# Pilot 2 Finale

Pilot 2 Finale is a mobile-first TV tracking project focused on one core idea: make show tracking fast enough to use daily.

Instead of managing a giant media catalog, the app is centered on your active watch journey: discover a show, add it to your list, log episodes as you watch, and understand your habits over time.

## Product goals

- Keep episode tracking friction low on mobile
- Provide clear status-based organization for shows
- Offer lightweight insights without dashboard complexity
- Ensure every user sees only their own watch data

## Core experience

1. Discover
- Search TMDB titles
- Browse trending and top-rated content
- Open detailed show pages with season information

2. Organize
- Add shows to your personal tracker
- Manage lifecycle states: Watching, Want to Watch, Watched, On Hold, Dropped
- Move shows across statuses as your progress changes

3. Track
- Log individual episodes by season and episode number
- Add optional rating and personal notes
- Update previous logs when your opinion changes

4. Understand
- Review watch history chronologically
- See personal stats for episodes and show statuses
- Monitor current momentum and completion patterns

## Key features

- Mobile-first interface for daily usage
- TMDB-powered discovery and metadata
- Personal show library with status management
- Episode-level logging with deduped upsert behavior
- User-scoped stats and history
- Authenticated, user-isolated API access
- Neon Postgres persistence

## Architecture at a glance

- Frontend
   - Next.js App Router pages for search, watching, history, stats, and show detail views
   - React components for reusable UI and page composition
- Backend
   - Route handlers under app/api for shows, my-shows, episodes, and auth proxying
   - Rate-limited endpoints for client-facing operations
- Data
   - Neon Postgres via pg connection pool
   - Runtime schema initialization and migration guards
   - User-scoped indexes and constraints for multi-tenant safety
- Authentication
   - Neon Auth integration with Next server/client adapters
   - Middleware-protected app/API sections
   - Session-based user identification in API handlers

## Data model highlights

- user_shows
   - Tracks one user-to-show relationship per tmdb_id
   - Stores status, metadata, and progress context
- episode_logs
   - Tracks one user-to-episode record per show/season/episode
   - Stores watched_at, rating, and optional notes

The project enforces user-level ownership in both read and write queries.

## API surface

- Discovery
   - GET /api/shows/search
   - GET /api/shows/trending/week
   - GET /api/shows/top-rated
   - GET /api/shows/:id
   - GET /api/shows/:id/season/:seasonNumber
- Personal library
   - GET, POST /api/my-shows
   - GET, PATCH, DELETE /api/my-shows/:tmdbId
- Episode tracking
   - GET, POST /api/episodes
   - DELETE /api/episodes/:id
   - GET /api/episodes/show/:tmdbShowId
   - DELETE /api/episodes/show/:tmdbShowId/season/:season/episode/:episode
   - GET /api/episodes/stats
- Auth
   - GET, POST, PUT, PATCH, DELETE /api/auth/*

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- TanStack Query
- Neon Postgres (pg)
- Prisma ORM
- Neon Auth

## Prisma setup

Prisma is now configured in this repo for schema management and migrations.

Environment variables Prisma expects:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
```

Recommended Neon usage:

- `DATABASE_URL`: direct Neon Postgres connection string for Prisma migrations and Prisma Client
- `NEON_CONNECTION_STRING`: optional fallback for the existing `pg` layer while the app is still mixed

Useful commands:

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:studio
```

Current transition note:

- The existing `pg` query layer is still in place.
- Prisma has been added as the migration/schema system first.
- Once migrations are the only source of truth, the runtime schema bootstrap in `lib/db.ts` should be removed.

## Current state and next steps

Current focus is on reliable per-user tracking with Neon Auth and Neon Postgres.

Near-term improvements:

- Add explicit sign-out and profile controls in app navigation
- Refine auth UX for session transitions and error states
- Expand stats with streaks and trend views
- Add tests for auth-guarded API behavior and user data isolation

## Hidden admin utility

- Path: /admin
- Purpose: hidden admin hub page for internal tools
- Path: /admin/catalog-refresh
- Purpose: refreshes show catalog metadata for all shows in the database, including show names
- Access control: only user IDs listed in ADMIN_USER_IDS can access this page and API

Set environment variable:

```bash
ADMIN_USER_IDS=user_id_1,user_id_2
```

Optional analytics exclusion (client-side):

```bash
NEXT_PUBLIC_ANALYTICS_EXCLUDED_USER_IDS=user_id_1,user_id_2
```

When a signed-in user ID is in `NEXT_PUBLIC_ANALYTICS_EXCLUDED_USER_IDS`, Vercel page analytics is not mounted for that session.

The page runs refresh in batches through:

- POST /api/admin/catalog-refresh
