const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'overinsur',
  password: 'overinsur123',
  database: 'overinsur_db'
});

async function testPassword() {
  try {
    const result = await pool.query('SELECT password_hash FROM auth_user WHERE username = $1', ['admin']);
    const hash = result.rows[0].password_hash;
    
    console.log('Stored hash:', hash);
    console.log('Length:', hash.length);
    
    // Test with correct password
    const match = await bcrypt.compare('admin123', hash);
    console.log('Password match (admin123):', match);
    
    // Try to create new hash and test it
    const newHash = '$2b$10$gmYyOUTkVTrqYLejwFOM0.5hroZKR0tuzz8nSGEslQsRVhLNTHuXS';
    const newMatch = await bcrypt.compare('admin123', newHash);
    console.log('Test new hash match:', newMatch);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testPassword();
