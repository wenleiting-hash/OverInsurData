/**
 * Execute auth-i18n-init.sql against OVERINSURDATA database
 * Usage: node seed-data/run-i18n-init.js
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'carrier-service', 'node_modules', 'pg'));

async function main() {
  const envPaths = [
    path.join(__dirname, '..', 'apps', 'carrier-service', '.env'),
    path.join(__dirname, '..', '..', '.env'),
  ];
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      fs.readFileSync(p, 'utf-8').split('\n').forEach(line => {
        const m = line.match(/^([A-Z_]+)=(.*)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
      });
    }
  }

  const sqlFile = path.join(__dirname, 'auth-i18n-init.sql');
  const sql = fs.readFileSync(sqlFile, 'utf-8');

  console.log('=== I18n Translation Table Init ===');
  console.log(`Database: ${process.env.DB_NAME} @ ${process.env.DB_HOST}:${process.env.DB_PORT}`);

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    database: process.env.DB_NAME || 'overinsur_db',
    user: process.env.DB_USER || 'overinsur',
    password: process.env.DB_PASSWORD || 'overinsur123',
    max: 5,
  });

  try {
    const client = await pool.connect();
    console.log('[OK] Connected');

    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[OK] SQL executed successfully');

    const verify = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'ovwr_auth_i18n%'
      ORDER BY table_name
    `);
    console.log('\n[OK] I18n tables:');
    verify.rows.forEach(r => console.log('  -', r.table_name));

    const count = await client.query('SELECT COUNT(*)::int as cnt FROM ovwr_auth_i18n_translation');
    console.log(`\n[OK] Translation entries: ${count.rows[0].cnt}`);

    const modules = await client.query('SELECT DISTINCT ovwr_module FROM ovwr_auth_i18n_translation ORDER BY ovwr_module');
    console.log('\n[OK] Modules:');
    modules.rows.forEach(r => console.log('  -', r.ovwr_module));

    client.release();
    console.log('\n=== I18n table initialized successfully ===');
  } catch (err) {
    console.error('[ERROR]', err.message || String(err));
    if (err.detail) console.error('Detail:', err.detail);
    if (err.position) {
      const pos = parseInt(err.position);
      const ctx = sql.substring(Math.max(0, pos - 40), pos + 40);
      console.error(`Position ${pos}: ...${ctx}...`);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
