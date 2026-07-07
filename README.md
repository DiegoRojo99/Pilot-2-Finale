# Pilot 2 Finale

Pilot 2 Finale is a mobile-first TV show tracker built as a single Next.js application.

## Features

- Search TV shows from TMDB
- Browse weekly trending shows
- Track shows by status: Watching, Want to Watch, Watched, On Hold, Dropped
- Log watched episodes per season
- View watch history and stats
- Store tracking data in Neon Postgres

## Stack

- Next.js 16 + React 19
- App Router for UI and API routes
- Tailwind CSS v4
- TanStack Query
- Neon Postgres via `pg`

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

3. Set your TMDB API key in `.env`:

   ```bash
   TMDB_API_KEY=your_tmdb_api_key_here
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## API routes

- `GET /api/shows/search?query=...`
- `GET /api/shows/trending/week`
- `GET /api/shows/:id`
- `GET /api/shows/:id/season/:n`
- `GET/POST /api/my-shows`
- `GET/PATCH/DELETE /api/my-shows/:tmdbId`
- `GET/POST /api/episodes`
- `DELETE /api/episodes/:id`
- `GET /api/episodes/show/:tmdbShowId`
- `DELETE /api/episodes/show/:tmdbShowId/season/:season/episode/:episode`
- `GET /api/episodes/stats`
