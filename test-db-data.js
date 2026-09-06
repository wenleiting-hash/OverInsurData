const { createPool } = require('pg');

async function testUserAPI() {
  const pool = createPool({
    host: 'localhost',
    port: 5433,
    database: 'overinsur_db',
    user: 'overinsur',
    password: 'overinsur123'
  });
  
  try {
    // Query users directly from DB
    const res = await pool.query(`
      SELECT user_id, username, real_name, email, status, created_at 
      FROM auth_user 
      WHERE deleted = FALSE 
      ORDER BY created_at DESC;`);
    
    console.log('Database has', res.rows.length, 'users:');
    res.rows.forEach(row => {
      console.log(`  - ${row.real_name} (${row.username}): ${row.user_id}`);
    });
    
    // Check if there are roles assigned
    const roleRes = await pool.query(`
      SELECT ar.role_key, ar.role_name_zh
      FROM auth_user_role aur
      JOIN auth_role ar ON aur.role_id = ar.role_id
      WHERE aur.deleted = FALSE
      LIMIT 5;`);
    
    console.log('\nRoles found:', roleRes.rows.length);
  } finally {
    await pool.end();
  }
}

testUserAPI().catch(console.error);
