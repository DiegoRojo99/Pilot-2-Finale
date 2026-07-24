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
const connectionString = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING || backupConnectionString;
if (!connectionString) throw new Error("DATABASE_URL or NEON_CONNECTION_STRING is not configured.");

const globalForDb = globalThis as typeof globalThis & {
  pilot2FinalePool?: Pool;
};

const pool = globalForDb.pilot2FinalePool ??
  new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pilot2FinalePool = pool;

const db: DbClient = {
  async query<T extends QueryResultRow = QueryResultRow>(sql: string, params: QueryParams = []) {
    const result = await pool.query<T>(sql, params as unknown[]);
    return { rows: result.rows };
  },

  async one<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: QueryParams = [],
  ): Promise<T | undefined> {
    const { rows } = await db.query<T>(sql, params);
    return rows[0] as T | undefined;
  },
};

export default db;
