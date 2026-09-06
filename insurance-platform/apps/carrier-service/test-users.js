const { createPool } = require('pg');

async function listUsers() {
  const pool = createPool({
    host: 'localhost',
    port: 5433,
    database: 'overinsur_db',
    user: 'overinsur',
    password: 'overinsur123'
  });
  
  try {
    const res = await pool.query(`SELECT COUNT(*) FROM auth_user;`);
    console.log('Total users in DB:', res.rows[0].count);
  } finally {
    await pool.end();
  }
}

listUsers().catch(console.error);
