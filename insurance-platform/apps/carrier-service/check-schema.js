const pg = require('pg');
const { Pool } = pg;

async function checkSchema() {
  const pool = new Pool({
    host: 'localhost',
    port: 5433,
    database: 'overinsur_db',
    user: 'overinsur',
    password: 'overinsur123'
  });
  
  try {
    console.log('Checking auth_user table columns...');
    
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'auth_user' AND table_schema = 'public'
      ORDER BY ordinal_position;`);
    
    console.log('\nAuth USER COLUMNS:');
    if (res.rows.length === 0) {
      console.log('  TABLE NOT FOUND OR EMPTY');
    } else {
      res.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
    }
    
    console.log('\n\nChecking auth_role table...');
    const roleRes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'auth_role' AND table_schema = 'public'
      ORDER BY ordinal_position;`);
    
    if (roleRes.rows.length === 0) {
      console.log('  AUTH_ROLE TABLE NOT FOUND!');
    } else {
      console.log('AUTH_ROLE COLUMNS:');
      roleRes.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
    }
    
  } finally {
    await pool.end();
  }
}

checkSchema().catch(console.error);
