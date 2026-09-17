import pg from 'pg';
import { config } from './env.js';

const { Pool } = pg;

/**
 * Safely parses the DATABASE_URL connection string into individual connection options.
 * Handles:
 * - standard postgresql://user:password@host:port/db
 * - postgres://user:password@host:port/db
 * - raw user:password@host:port/db
 * - special characters in passwords (such as #)
 *
 * @param {string} rawUrl
 * @returns {object|null}
 */
export function parseDatabaseConfig(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Remove leading postgresql:// or postgres://
  const withoutProtocol = trimmed.replace(/^postgres(?:ql)?:\/\//i, '');

  const atIdx = withoutProtocol.lastIndexOf('@');
  if (atIdx === -1) {
    // If no '@' is present, fallback to standard connectionString
    return {
      connectionString: trimmed.startsWith('postgres') ? trimmed : `postgresql://${trimmed}`,
      ssl: { rejectUnauthorized: false },
    };
  }

  const authPart = withoutProtocol.slice(0, atIdx);
  const hostPart = withoutProtocol.slice(atIdx + 1);

  let user = 'postgres';
  let password = '';
  const colonIdx = authPart.indexOf(':');
  if (colonIdx !== -1) {
    user = authPart.slice(0, colonIdx);
    password = authPart.slice(colonIdx + 1);
  } else {
    password = authPart;
  }

  let host = '';
  let port = 5432;
  let database = 'postgres';

  const slashIdx = hostPart.indexOf('/');
  if (slashIdx !== -1) {
    database = hostPart.slice(slashIdx + 1) || 'postgres';
    const hostAndPort = hostPart.slice(0, slashIdx);
    const portColonIdx = hostAndPort.indexOf(':');
    if (portColonIdx !== -1) {
      host = hostAndPort.slice(0, portColonIdx);
      port = parseInt(hostAndPort.slice(portColonIdx + 1), 10) || 5432;
    } else {
      host = hostAndPort;
    }
  } else {
    const portColonIdx = hostPart.indexOf(':');
    if (portColonIdx !== -1) {
      host = hostPart.slice(0, portColonIdx);
      port = parseInt(hostPart.slice(portColonIdx + 1), 10) || 5432;
    } else {
      host = hostPart;
    }
  }

  return {
    user,
    password,
    host,
    port,
    database,
    ssl: { rejectUnauthorized: false },
    // Connection pool tuning for serverless/Supabase
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

const dbConfig = parseDatabaseConfig(config.databaseUrl);

export const pool = dbConfig ? new Pool(dbConfig) : null;

// Pool-level error listener to prevent process crashes on background network drops
if (pool) {
  pool.on('error', (err) => {
    console.error('[PostgreSQL Pool Error]', err.message);
  });
}

/**
 * Execute a SQL query using the connection pool.
 *
 * @param {string} text - SQL statement
 * @param {Array} [params] - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(text, params) {
  if (!pool) {
    throw new Error('Database connection is not initialized. Please verify DATABASE_URL in server/.env.');
  }
  return pool.query(text, params);
}

/**
 * Safely verify connectivity to Supabase PostgreSQL without exposing credentials.
 *
 * @returns {Promise<{ ok: boolean, host: string, database: string, user: string, version: string, latencyMs: number }>}
 */
export async function testConnection() {
  if (!pool || !dbConfig) {
    throw new Error('DATABASE_URL is missing or invalid in server/.env');
  }

  const start = Date.now();
  const res = await pool.query('SELECT NOW() as current_time, version() as pg_version;');
  const latencyMs = Date.now() - start;

  return {
    ok: true,
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    version: res.rows[0].pg_version,
    currentTime: res.rows[0].current_time,
    latencyMs,
  };
}

export default {
  pool,
  query,
  testConnection,
  parseDatabaseConfig,
};
