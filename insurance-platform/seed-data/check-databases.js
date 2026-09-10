const fs = require('fs');
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'carrier-service', 'node_modules', 'pg'));

async function main() {
  const port = parseInt(process.argv[2] || '5433');

  console.log(`=== Check databases on port ${port} ===`);

  const pool = new Pool({
    host: 'localhost',
    port,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
    max: 2,
  });

  try {
    const client = await pool.connect();

    const dbs = await client.query(
      `SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname`
    );
    console.log('Databases:');
    dbs.rows.forEach(r => console.log('  -', r.datname));

    client.release();
  } catch (err) {
    if (err.name === 'AggregateError' && err.errors) {
      console.error('[ERROR] Connection failed:');
      err.errors.forEach(e => console.error('  -', e.message || String(e)));
    } else {
      console.error('[ERROR]', err.message);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
