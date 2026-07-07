import { Pool, type QueryResultRow } from "pg";

type QueryParams = readonly unknown[];
type QueryResult<T extends QueryResultRow> = { rows: T[]; };
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
        tmdb_id INTEGER NOT NULL UNIQUE,
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

    await client.query(`
      CREATE TABLE IF NOT EXISTS episode_logs (
        id SERIAL PRIMARY KEY,
        tmdb_show_id INTEGER NOT NULL,
        season_number INTEGER NOT NULL,
        episode_number INTEGER NOT NULL,
        episode_name TEXT,
        watched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        rating INTEGER CHECK(rating >= 1 AND rating <= 10),
        notes TEXT,
        CONSTRAINT fk_episode_logs_show
          FOREIGN KEY (tmdb_show_id)
          REFERENCES user_shows(tmdb_id)
          ON DELETE CASCADE,
        CONSTRAINT uq_episode_logs_episode
          UNIQUE(tmdb_show_id, season_number, episode_number)
      )
    `);

    await client.query("CREATE INDEX IF NOT EXISTS idx_episode_logs_show ON episode_logs(tmdb_show_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_user_shows_status ON user_shows(status)");
    await client.query("COMMIT");
  } 
  catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } 
  finally {
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
