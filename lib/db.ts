import { Pool, type QueryResultRow } from "pg";

type QueryParams = readonly unknown[];
type QueryResult<T extends QueryResultRow> = { rows: T[] };
type DbClient = {
  query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: QueryParams,
  ): Promise<QueryResult<T>>;
  one<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: QueryParams,
  ): Promise<T | undefined>;
};

const backupConnectionString = `postgresql://${process.env.NEON_ROLE}:${process.env.NEON_PASSWORD}@${process.env.NEON_HOST}/${process.env.NEON_DATABASE}?sslmode=verify-full`;
const connectionString = process.env.NEON_CONNECTION_STRING || backupConnectionString;
if (!connectionString) throw new Error("NEON_CONNECTION_STRING is not configured.");

const globalForDb = globalThis as typeof globalThis & {
  pilot2FinalePool?: Pool;
  pilot2FinaleInitPromise?: Promise<void>;
};

const pool =
  globalForDb.pilot2FinalePool ??
  new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pilot2FinalePool = pool;

async function initializeSchema() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [9274101]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS shows (
        tmdb_id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        poster_path TEXT,
        backdrop_path TEXT,
        overview TEXT,
        first_air_date TEXT,
        vote_average DOUBLE PRECISION DEFAULT 0,
        number_of_seasons INTEGER DEFAULT 0,
        number_of_episodes INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await client.query("ALTER TABLE shows ADD COLUMN IF NOT EXISTS poster_path TEXT");
    await client.query("ALTER TABLE shows ADD COLUMN IF NOT EXISTS backdrop_path TEXT");
    await client.query("ALTER TABLE shows ADD COLUMN IF NOT EXISTS overview TEXT");
    await client.query("ALTER TABLE shows ADD COLUMN IF NOT EXISTS first_air_date TEXT");
    await client.query("ALTER TABLE shows ADD COLUMN IF NOT EXISTS vote_average DOUBLE PRECISION DEFAULT 0");
    await client.query("ALTER TABLE shows ADD COLUMN IF NOT EXISTS number_of_seasons INTEGER DEFAULT 0");
    await client.query("ALTER TABLE shows ADD COLUMN IF NOT EXISTS number_of_episodes INTEGER DEFAULT 0");
    await client.query("ALTER TABLE shows ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()");
    await client.query("ALTER TABLE shows ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()");
    await client.query("UPDATE shows SET created_at = COALESCE(created_at, now()), updated_at = COALESCE(updated_at, now())");

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_shows (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        tmdb_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        poster_path TEXT,
        backdrop_path TEXT,
        overview TEXT,
        first_air_date TEXT,
        status TEXT NOT NULL DEFAULT 'watching',
        vote_average DOUBLE PRECISION DEFAULT 0,
        number_of_seasons INTEGER DEFAULT 0,
        number_of_episodes INTEGER DEFAULT 0,
        added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await client.query("ALTER TABLE user_shows ADD COLUMN IF NOT EXISTS user_id TEXT");
    await client.query("ALTER TABLE user_shows ALTER COLUMN name DROP NOT NULL");
    await client.query("UPDATE user_shows SET status = 'watching' WHERE status IS NULL OR status NOT IN ('watching', 'want_to_watch', 'watched', 'dropped', 'on_hold')");
    await client.query("DELETE FROM user_shows WHERE user_id IS NULL");

    await client.query(`
      INSERT INTO shows (
        tmdb_id,
        name,
        poster_path,
        backdrop_path,
        overview,
        first_air_date,
        vote_average,
        number_of_seasons,
        number_of_episodes
      )
      SELECT DISTINCT ON (tmdb_id)
        tmdb_id,
        COALESCE(name, 'TMDB Show ' || tmdb_id::text),
        poster_path,
        backdrop_path,
        overview,
        first_air_date,
        COALESCE(vote_average, 0),
        COALESCE(number_of_seasons, 0),
        COALESCE(number_of_episodes, 0)
      FROM user_shows
      WHERE tmdb_id IS NOT NULL
      ORDER BY tmdb_id, updated_at DESC, added_at DESC
      ON CONFLICT (tmdb_id) DO UPDATE SET
        name = EXCLUDED.name,
        poster_path = COALESCE(EXCLUDED.poster_path, shows.poster_path),
        backdrop_path = COALESCE(EXCLUDED.backdrop_path, shows.backdrop_path),
        overview = COALESCE(EXCLUDED.overview, shows.overview),
        first_air_date = COALESCE(EXCLUDED.first_air_date, shows.first_air_date),
        vote_average = COALESCE(EXCLUDED.vote_average, shows.vote_average),
        number_of_seasons = COALESCE(EXCLUDED.number_of_seasons, shows.number_of_seasons),
        number_of_episodes = COALESCE(EXCLUDED.number_of_episodes, shows.number_of_episodes),
        updated_at = now()
    `);

    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'user_shows_tmdb_id_key'
            AND conrelid = 'user_shows'::regclass
        ) THEN
          ALTER TABLE user_shows DROP CONSTRAINT user_shows_tmdb_id_key CASCADE;
        END IF;
      END
      $$
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS episodes (
        id SERIAL PRIMARY KEY,
        tmdb_episode_id INTEGER,
        tmdb_show_id INTEGER NOT NULL,
        season_number INTEGER NOT NULL,
        episode_number INTEGER NOT NULL,
        name TEXT,
        overview TEXT,
        air_date TEXT,
        still_path TEXT,
        vote_average DOUBLE PRECISION DEFAULT 0,
        runtime INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await client.query("ALTER TABLE episodes ADD COLUMN IF NOT EXISTS tmdb_episode_id INTEGER");
    await client.query("ALTER TABLE episodes ADD COLUMN IF NOT EXISTS name TEXT");
    await client.query("ALTER TABLE episodes ADD COLUMN IF NOT EXISTS overview TEXT");
    await client.query("ALTER TABLE episodes ADD COLUMN IF NOT EXISTS air_date TEXT");
    await client.query("ALTER TABLE episodes ADD COLUMN IF NOT EXISTS still_path TEXT");
    await client.query("ALTER TABLE episodes ADD COLUMN IF NOT EXISTS vote_average DOUBLE PRECISION DEFAULT 0");
    await client.query("ALTER TABLE episodes ADD COLUMN IF NOT EXISTS runtime INTEGER");
    await client.query("ALTER TABLE episodes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()");
    await client.query("ALTER TABLE episodes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()");
    await client.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_episodes_show_season_episode ON episodes(tmdb_show_id, season_number, episode_number)");
    await client.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_episodes_tmdb_episode_id ON episodes(tmdb_episode_id) WHERE tmdb_episode_id IS NOT NULL");

    await client.query(`
      CREATE TABLE IF NOT EXISTS watch_entries (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        episode_id INTEGER,
        watched_at TIMESTAMPTZ,
        rating DOUBLE PRECISION,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await client.query("ALTER TABLE watch_entries ADD COLUMN IF NOT EXISTS user_id TEXT");
    await client.query("ALTER TABLE watch_entries ADD COLUMN IF NOT EXISTS episode_id INTEGER");
    await client.query("ALTER TABLE watch_entries ALTER COLUMN rating TYPE DOUBLE PRECISION USING rating::double precision");
    await client.query("ALTER TABLE watch_entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()");
    await client.query("ALTER TABLE watch_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()");
    await client.query("ALTER TABLE watch_entries DROP COLUMN IF EXISTS legacy_episode_log_id");
    await client.query("ALTER TABLE watch_entries ALTER COLUMN watched_at DROP NOT NULL");

    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'chk_user_shows_status'
            AND conrelid = 'user_shows'::regclass
        ) THEN
          ALTER TABLE user_shows DROP CONSTRAINT chk_user_shows_status;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_user_shows_tmdb_id'
            AND conrelid = 'user_shows'::regclass
        ) THEN
          ALTER TABLE user_shows DROP CONSTRAINT fk_user_shows_tmdb_id;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_episodes_tmdb_show_id'
            AND conrelid = 'episodes'::regclass
        ) THEN
          ALTER TABLE episodes DROP CONSTRAINT fk_episodes_tmdb_show_id;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'uq_episodes_show_season_episode'
            AND conrelid = 'episodes'::regclass
        ) THEN
          ALTER TABLE episodes DROP CONSTRAINT uq_episodes_show_season_episode;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_watch_entries_episode_id'
            AND conrelid = 'watch_entries'::regclass
        ) THEN
          ALTER TABLE watch_entries DROP CONSTRAINT fk_watch_entries_episode_id;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'watch_entries_rating_check'
            AND conrelid = 'watch_entries'::regclass
        ) THEN
          ALTER TABLE watch_entries DROP CONSTRAINT watch_entries_rating_check;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'chk_watch_entries_rating'
            AND conrelid = 'watch_entries'::regclass
        ) THEN
          ALTER TABLE watch_entries DROP CONSTRAINT chk_watch_entries_rating;
        END IF;
      END
      $$
    `);

    await client.query("ALTER TABLE user_shows ALTER COLUMN user_id SET NOT NULL");
    await client.query("ALTER TABLE episodes ALTER COLUMN tmdb_show_id SET NOT NULL");
    await client.query("ALTER TABLE episodes ALTER COLUMN season_number SET NOT NULL");
    await client.query("ALTER TABLE episodes ALTER COLUMN episode_number SET NOT NULL");
    await client.query("DELETE FROM watch_entries WHERE user_id IS NULL OR episode_id IS NULL");
    await client.query("ALTER TABLE watch_entries ALTER COLUMN user_id SET NOT NULL");
    await client.query("ALTER TABLE watch_entries ALTER COLUMN episode_id SET NOT NULL");
    await client.query(`
      ALTER TABLE user_shows
      ADD CONSTRAINT chk_user_shows_status CHECK (status IN ('watching', 'want_to_watch', 'watched', 'dropped', 'on_hold'))
    `);
    await client.query(`
      ALTER TABLE user_shows
      ADD CONSTRAINT fk_user_shows_tmdb_id FOREIGN KEY (tmdb_id) REFERENCES shows(tmdb_id) ON DELETE RESTRICT
    `);
    await client.query(`
      ALTER TABLE episodes
      ADD CONSTRAINT uq_episodes_show_season_episode UNIQUE (tmdb_show_id, season_number, episode_number)
    `);
    await client.query(`
      ALTER TABLE episodes
      ADD CONSTRAINT fk_episodes_tmdb_show_id FOREIGN KEY (tmdb_show_id) REFERENCES shows(tmdb_id) ON DELETE CASCADE
    `);
    await client.query(`
      ALTER TABLE watch_entries
      ADD CONSTRAINT fk_watch_entries_episode_id FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
    `);
    await client.query(`
      ALTER TABLE watch_entries
      ADD CONSTRAINT chk_watch_entries_rating CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10))
    `);

    // ON CONFLICT(user_id, ...) requires a non-partial unique index/constraint.
    await client.query("DROP INDEX IF EXISTS idx_user_shows_user_tmdb_unique");
    await client.query("DROP INDEX IF EXISTS idx_episodes_tmdb_episode_id");
    await client.query("DROP INDEX IF EXISTS idx_episodes_show_season_episode");
    await client.query("DROP INDEX IF EXISTS idx_watch_entries_user_episode");
    await client.query("DROP INDEX IF EXISTS idx_watch_entries_user_watched_at");
    await client.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_user_shows_user_tmdb_unique ON user_shows(user_id, tmdb_id)",
    );
    await client.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_episodes_tmdb_episode_id ON episodes(tmdb_episode_id) WHERE tmdb_episode_id IS NOT NULL");
    await client.query("CREATE INDEX IF NOT EXISTS idx_episodes_show_season_episode ON episodes(tmdb_show_id, season_number, episode_number)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_watch_entries_user_episode ON watch_entries(user_id, episode_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_watch_entries_user_watched_at ON watch_entries(user_id, watched_at DESC)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_watch_entries_user_episode_latest ON watch_entries(user_id, episode_id, watched_at DESC, created_at DESC, id DESC)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_watch_entries_episode_user_latest ON watch_entries(episode_id, user_id, watched_at DESC, created_at DESC, id DESC)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_shows_updated_at ON shows(updated_at DESC)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_user_shows_user_status ON user_shows(user_id, status)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_user_shows_status ON user_shows(status)");
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

const initPromise = globalForDb.pilot2FinaleInitPromise ?? initializeSchema();
if (process.env.NODE_ENV !== "production") globalForDb.pilot2FinaleInitPromise = initPromise;

const db: DbClient = {
  async query<T extends QueryResultRow = QueryResultRow>(sql: string, params: QueryParams = []) {
    await initPromise;
    const result = await pool.query<T>(sql, params as unknown[]);
    return { rows: result.rows };
  },

  async one<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: QueryParams = [],
  ): Promise<T | undefined> {
    const { rows } = await db.query<T>(sql, params);
    const row = rows[0] as T | undefined;
    return row;
  },
};

export default db;
