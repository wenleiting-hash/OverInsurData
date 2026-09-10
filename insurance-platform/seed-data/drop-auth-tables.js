/**
 * Drop V5 auth tables from a database
 * Usage: node seed-data/drop-auth-tables.js [port]
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'carrier-service', 'node_modules', 'pg'));

async function main() {
  const port = parseInt(process.argv[2] || '5432');
  const dbName = process.argv[3] || 'ai_saas';

  console.log(`=== Drop V5 Auth Tables ===`);
  console.log(`Target: localhost:${port}/${dbName}`);

  const pool = new Pool({
    host: 'localhost',
    port,
    database: dbName,
    user: 'postgres',
    password: 'postgres',
    max: 2,
  });

  try {
    const client = await pool.connect();
    console.log('[OK] Connected');

    const tables = [
      'auth_operation_log',
      'auth_refresh_token',
      'auth_user_role',
      'auth_user',
      'auth_role',
      'auth_department'
    ];

    for (const t of tables) {
      const r = await client.query(`DROP TABLE IF EXISTS ${t} CASCADE`);
      console.log(`  - DROP TABLE ${t}`);
    }

    // Also drop the trigger function if only used by these tables
    await client.query(`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE`);
    console.log('  - DROP FUNCTION update_updated_at_column()');

    const verify = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'auth_%'
      ORDER BY table_name
    `);
    console.log('');
    if (verify.rows.length === 0) {
      console.log('[OK] All auth_* tables removed');
    } else {
      console.log('[WARN] Remaining auth tables:');
      verify.rows.forEach(r => console.log('  -', r.table_name));
    }

    client.release();
  } catch (err) {
    if (err.name === 'AggregateError' && err.errors) {
      console.error('[ERROR] Connection failed:');
      err.errors.forEach(e => console.error('  -', e.message || String(e)));
    } else {
      console.error('[ERROR]', err.message || String(err));
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
