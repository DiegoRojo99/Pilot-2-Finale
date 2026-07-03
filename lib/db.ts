import BetterSqlite3 from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

type DatabaseInstance = BetterSqlite3.Database;

const DB_DIR = path.resolve(process.cwd(), process.env.DB_DIR ?? "./data");
const DB_PATH = path.join(DB_DIR, "pilot2finale.db");

const globalForDb = globalThis as typeof globalThis & {
  pilot2FinaleDb?: DatabaseInstance;
};

function createDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const db = new BetterSqlite3(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

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

  return db;
}

const db = globalForDb.pilot2FinaleDb ?? createDatabase();

if (process.env.NODE_ENV !== "production") {
  globalForDb.pilot2FinaleDb = db;
}

export default db;
