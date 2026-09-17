import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '../db/migrations');

/**
 * Migration runner:
 * - Initializes tracking table `schema_migrations` if not present.
 * - Identifies pending migration files sorted in alphabetical order.
 * - Applies each pending migration within an atomic transaction.
 * - Records applied migrations with timestamps.
 * - Safely rolls back on failure and exits with non-zero exit code.
 */
async function runMigrations() {
  if (!pool) {
    console.error('[MIGRATE] Database connection pool is not configured. Please check DATABASE_URL.');
    process.exit(1);
  }

  let client;
  try {
    client = await pool.connect();
    console.log('[MIGRATE] Connected to PostgreSQL for schema migrations.');

    // 1. Ensure migration tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Fetch already applied migrations
    const { rows: appliedRows } = await client.query(
      'SELECT name FROM schema_migrations ORDER BY id ASC;'
    );
    const appliedSet = new Set(appliedRows.map((r) => r.name));

    // 3. Read migration directory
    let files = [];
    try {
      files = await fs.readdir(MIGRATIONS_DIR);
    } catch (err) {
      console.error(`[MIGRATE] Could not read migrations directory (${MIGRATIONS_DIR}): ${err.message}`);
      process.exit(1);
    }

    const migrationFiles = files
      .filter((file) => file.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    const pendingMigrations = migrationFiles.filter((file) => !appliedSet.has(file));

    if (pendingMigrations.length === 0) {
      console.log('[MIGRATE] No pending migrations. Database schema is up to date.');
      console.log(`[MIGRATE] Total migrations recorded in database: ${appliedSet.size}`);
      return;
    }

    console.log(`[MIGRATE] Found ${pendingMigrations.length} pending migration(s): ${pendingMigrations.join(', ')}`);

    // 4. Execute pending migrations transactionally
    for (const file of pendingMigrations) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      console.log(`[MIGRATE] Applying: ${file}...`);

      const sqlContent = await fs.readFile(filePath, 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sqlContent);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1);', [file]);
        await client.query('COMMIT');
        console.log(`[MIGRATE] Successfully applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[MIGRATE] FAILED to apply migration "${file}": ${err.message}`);
        if (err.position) {
          console.error(`[MIGRATE] Error position in SQL: ${err.position}`);
        }
        throw err;
      }
    }

    console.log('[MIGRATE] All pending migrations executed successfully.');
  } catch (err) {
    console.error('[MIGRATE] Migration process aborted due to an error.');
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    if (pool) {
      await pool.end().catch(() => {});
    }
  }
}

runMigrations();
