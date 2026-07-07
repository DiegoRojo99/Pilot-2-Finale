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
      CREATE TABLE IF NOT EXISTS episode_logs (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        tmdb_show_id INTEGER NOT NULL,
        season_number INTEGER NOT NULL,
        episode_number INTEGER NOT NULL,
        episode_name TEXT,
        watched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        rating INTEGER CHECK(rating >= 1 AND rating <= 10),
        notes TEXT
      )
    `);

    await client.query("ALTER TABLE episode_logs ADD COLUMN IF NOT EXISTS user_id TEXT");

    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_episode_logs_show'
            AND conrelid = 'episode_logs'::regclass
        ) THEN
          ALTER TABLE episode_logs DROP CONSTRAINT fk_episode_logs_show;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'uq_episode_logs_episode'
            AND conrelid = 'episode_logs'::regclass
        ) THEN
          ALTER TABLE episode_logs DROP CONSTRAINT uq_episode_logs_episode;
        END IF;
      END
      $$
    `);

    // ON CONFLICT(user_id, ...) requires a non-partial unique index/constraint.
    await client.query("DROP INDEX IF EXISTS idx_user_shows_user_tmdb_unique");
    await client.query("DROP INDEX IF EXISTS idx_episode_logs_user_show_se_unique");
    await client.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_user_shows_user_tmdb_unique ON user_shows(user_id, tmdb_id)",
    );
    await client.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_episode_logs_user_show_se_unique ON episode_logs(user_id, tmdb_show_id, season_number, episode_number)",
    );
    await client.query("CREATE INDEX IF NOT EXISTS idx_episode_logs_user_show ON episode_logs(user_id, tmdb_show_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_episode_logs_show ON episode_logs(tmdb_show_id)");
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
