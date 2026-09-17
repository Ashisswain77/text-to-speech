import { pool } from '../config/db.js';

async function verifySchema() {
  if (!pool) {
    console.error('Database connection pool is not configured.');
    process.exit(1);
  }

  try {
    console.log('--- VERIFYING SUPABASE POSTGRESQL SCHEMA ---');

    // 1. Check migrations table
    const migrationsRes = await pool.query(
      'SELECT id, name, applied_at FROM schema_migrations ORDER BY id ASC;'
    );
    console.log('\n[Applied Migrations]:');
    migrationsRes.rows.forEach((r) => {
      console.log(` - ID ${r.id}: ${r.name} (Applied at: ${r.applied_at.toISOString()})`);
    });

    // 2. Check tables exist
    const tablesRes = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'speeches', 'schema_migrations')
      ORDER BY table_name;
    `);
    console.log('\n[Existing Tables]:', tablesRes.rows.map((r) => r.table_name).join(', '));

    // 3. Check users columns
    const usersCols = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position;
    `);
    console.log('\n[Users Table Columns]:');
    usersCols.rows.forEach((r) => {
      console.log(` - ${r.column_name}: ${r.data_type} (nullable: ${r.is_nullable}, default: ${r.column_default})`);
    });

    // 4. Check speeches columns
    const speechesCols = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'speeches'
      ORDER BY ordinal_position;
    `);
    console.log('\n[Speeches Table Columns]:');
    speechesCols.rows.forEach((r) => {
      console.log(` - ${r.column_name}: ${r.data_type} (nullable: ${r.is_nullable}, default: ${r.column_default})`);
    });

    // 5. Check constraints
    const constraintsRes = await pool.query(`
      SELECT conname, contype, pg_get_constraintdef(c.oid) as definition
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'public'
        AND conrelid IN ('users'::regclass, 'speeches'::regclass)
      ORDER BY conname;
    `);
    console.log('\n[Table Constraints]:');
    constraintsRes.rows.forEach((r) => {
      const typeDesc = { p: 'PRIMARY KEY', f: 'FOREIGN KEY', c: 'CHECK', u: 'UNIQUE' }[r.contype] || r.contype;
      console.log(` - [${typeDesc}] ${r.conname}: ${r.definition}`);
    });

    // 6. Check indexes
    const indexesRes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('users', 'speeches')
      ORDER BY tablename, indexname;
    `);
    console.log('\n[Indexes]:');
    indexesRes.rows.forEach((r) => {
      console.log(` - ${r.indexname}: ${r.indexdef}`);
    });

    console.log('\n--- SCHEMA VERIFICATION COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Schema verification error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifySchema();
