"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.query = query;
const pg_1 = require("pg");
/**
 * Database connection pool.
 *
 * The connection parameters are expected to be provided via environment variables.
 * Typically, you would set DATABASE_URL or provide PGUSER, PGPASSWORD, PGHOST,
 * PGPORT and PGDATABASE. This module exports a singleton pool instance that
 * can be imported throughout the backend to execute queries.
 */
exports.pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    // fallback individual parameters if DATABASE_URL is not set
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : undefined,
    database: process.env.PGDATABASE
});
// Optional helper to run a query using the pool
async function query(text, params) {
    const result = await exports.pool.query(text, params);
    return result.rows;
}
