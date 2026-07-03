# 📺 Pilot 2 Finale

A mobile-first Progressive Web App (PWA) for tracking TV shows — from the pilot episode all the way to the finale.

Built with **React + TypeScript** (frontend) and **Express + TypeScript** (backend), connected to the [TMDB API](https://www.themoviedb.org/).

---

## Features

- 🔍 **Search** TV shows via TMDB
- 📺 **Track status** — Watching, Want to Watch, Watched, On Hold, Dropped
- ✅ **Log episodes** — mark individual episodes as watched per season
- 📊 **Stats** — total episodes watched, shows by status
- 📱 **Mobile-first PWA** — installable, works offline, feels like a native app
- 🌐 **Trending** — browse trending shows from TMDB

---

## Project Structure

```
pilot2finale/
├── backend/          # Express + TypeScript API
│   ├── src/
│   │   ├── db/       # SQLite setup + TMDB client
│   │   ├── routes/   # shows, my-shows, episodes
│   │   └── index.ts  # Express entry point
│   └── .env.example
├── frontend/         # Vite + React + TypeScript PWA
│   ├── src/
│   │   ├── api/      # API client functions
│   │   ├── components/
│   │   ├── pages/    # Search, Watching, Watchlist, History, Stats, ShowDetail
│   │   ├── types/    # Shared TypeScript types
│   │   └── utils/    # TMDB image helpers, formatters
│   └── index.html
└── package.json      # Root scripts
```

---

## Getting Started

### 1. Get a TMDB API Key

Sign up at [themoviedb.org](https://www.themoviedb.org/settings/api) and get a free API key.

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set TMDB_API_KEY=your_key_here
npm install
```

### 3. Configure Frontend

```bash
cd frontend
npm install
```

### 4. Run in Development

In two terminals:

```bash
# Terminal 1 - Backend (port 3001)
npm run dev:backend

# Terminal 2 - Frontend (port 5173)
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for Production

```bash
npm run build
```

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS|
| PWA       | vite-plugin-pwa (Workbox)               |
| State     | TanStack Query (react-query)            |
| Routing   | React Router v7                         |
| Backend   | Express, TypeScript, Node.js            |
| Database  | SQLite (better-sqlite3)                 |
| TMDB      | REST API via axios proxy                |

---

## API Routes

### TMDB Proxy
- `GET /api/shows/search?query=...` — search TV shows
- `GET /api/shows/trending/week` — trending shows
- `GET /api/shows/:id` — show details
- `GET /api/shows/:id/season/:n` — season + episodes

### User Data
- `GET/POST/PATCH/DELETE /api/my-shows` — manage tracked shows
- `GET/POST/DELETE /api/episodes` — manage episode logs
- `GET /api/episodes/stats` — watch stats
