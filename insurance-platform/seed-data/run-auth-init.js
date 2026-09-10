/**
 * Execute auth-init.sql against ai_saas database
 * Usage: node seed-data/run-auth-init.js
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'apps', 'carrier-service', 'node_modules', 'pg'));

async function main() {
  // Load .env from carrier-service (primary) or project root (fallback)
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

  const sqlFile = path.join(__dirname, 'auth-init.sql');
  const sql = fs.readFileSync(sqlFile, 'utf-8');

  console.log('=== OverInsur Auth Schema V5 Init ===');
  console.log(`Database: ${process.env.DB_NAME || 'ai_saas'} @ ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}`);
  console.log('');

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ai_saas',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 5,
  });

  try {
    const client = await pool.connect();
    console.log('[OK] Connected to database');

    // Execute full SQL as single transaction
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[OK] SQL executed successfully');

    // Verify tables
    const verify = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'auth_%'
      ORDER BY table_name
    `);
    console.log('');
    console.log('[OK] Auth tables:');
    verify.rows.forEach(r => console.log('  -', r.table_name));

    // Verify seed data
    const counts = await client.query(`
      SELECT 'auth_department' as tbl, COUNT(*)::int as cnt FROM auth_department
      UNION ALL SELECT 'auth_role', COUNT(*)::int FROM auth_role
      UNION ALL SELECT 'auth_user', COUNT(*)::int FROM auth_user
      UNION ALL SELECT 'auth_user_role', COUNT(*)::int FROM auth_user_role
      ORDER BY tbl
    `);
    console.log('');
    console.log('[OK] Seed data:');
    counts.rows.forEach(r => console.log(`  ${r.tbl}: ${r.cnt} rows`));

    // Show admin user
    const admin = await client.query(`
      SELECT user_uuid, username, email, name_zh, status, auth_method
      FROM auth_user WHERE username = 'admin'
    `);
    if (admin.rows[0]) {
      console.log('');
      console.log('[OK] Admin user:', JSON.stringify(admin.rows[0], null, 2));
    }

    // Show roles
    const roles = await client.query('SELECT role_key, role_name_zh, role_code FROM auth_role ORDER BY sort_order');
    console.log('');
    console.log('[OK] Roles:');
    roles.rows.forEach(r => console.log(`  ${r.role_key} (${r.role_name_zh}) - ${r.role_code}`));

    client.release();
    console.log('');
    console.log('=== Schema V5 initialized successfully ===');
  } catch (err) {
    if (err.name === 'AggregateError' && err.errors) {
      console.error('[ERROR] Connection failed:');
      err.errors.forEach(e => console.error('  -', e.message || e.code || String(e)));
    } else {
      console.error('[ERROR]', err.message || String(err));
      if (err.detail) console.error('Detail:', err.detail);
      if (err.position) {
        const pos = parseInt(err.position);
        const ctx = sql.substring(Math.max(0, pos - 40), pos + 40);
        console.error(`Position ${pos}: ...${ctx}...`);
      }
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
