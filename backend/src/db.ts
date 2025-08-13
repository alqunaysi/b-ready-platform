import { Pool } from 'pg';

/**
 * Database connection pool.
 *
 * The connection parameters are expected to be provided via environment variables.
 * Typically, you would set DATABASE_URL or provide PGUSER, PGPASSWORD, PGHOST,
 * PGPORT and PGDATABASE. This module exports a singleton pool instance that
 * can be imported throughout the backend to execute queries.
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // fallback individual parameters if DATABASE_URL is not set
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : undefined,
  database: process.env.PGDATABASE
});

// Optional helper to run a query using the pool
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}