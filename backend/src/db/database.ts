import Database, { type Database as BetterDB } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = process.env.DB_DIR || path.join(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'pilot2finale.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db: BetterDB = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS user_shows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tmdb_id INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    poster_path TEXT,
    backdrop_path TEXT,
    overview TEXT,
    first_air_date TEXT,
    status TEXT NOT NULL DEFAULT 'watching',
    vote_average REAL DEFAULT 0,
    number_of_seasons INTEGER DEFAULT 0,
    number_of_episodes INTEGER DEFAULT 0,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS episode_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tmdb_show_id INTEGER NOT NULL,
    season_number INTEGER NOT NULL,
    episode_number INTEGER NOT NULL,
    episode_name TEXT,
    watched_at TEXT NOT NULL DEFAULT (datetime('now')),
    rating INTEGER CHECK(rating >= 1 AND rating <= 10),
    notes TEXT,
    FOREIGN KEY (tmdb_show_id) REFERENCES user_shows(tmdb_id) ON DELETE CASCADE,
    UNIQUE(tmdb_show_id, season_number, episode_number)
  );

  CREATE INDEX IF NOT EXISTS idx_episode_logs_show ON episode_logs(tmdb_show_id);
  CREATE INDEX IF NOT EXISTS idx_user_shows_status ON user_shows(status);
`);

export default db;
