const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  user: 'overinsur',
  password: 'overinsur123',
  database: 'overinsur_db'
});

async function resetPasswords() {
  try {
    // Delete all existing users
    const delResult = await pool.query('DELETE FROM auth_user');
    console.log(`Deleted ${delResult.rowCount} rows`);
    
    // Insert with correct bcrypt hashes
    const users = [
      ['user-admin-001', 'admin', '$2b$10$gmYyOUTkVTrqYLejwFOM0.5hroZKR0tuzz8nSGEslQsRVhLNTHuXS', 'Administrator', 'admin@overinsur.com', '1'],
      ['user-li-001', 'li.xiaoyan', '$2a$10$LQv3c.YmZNPPTLXjyKJOTu.6tjNB0y7dHJ8B.vJqW.5ZqYxNzGKmO', '李小红', 'li.xiaoyan@overinsur.com', '1'],
      ['user-zhang-001', 'zhang.wei', '$2a$10$LQv3c.YmZNPPTLXjyKJOTu.6tjNB0y7dHJ8B.vJqW.5ZqYxNzGKmO', '张伟', 'zhang.wei@overinsur.com', '1'],
    ];
    
    for (const user of users) {
      await pool.query(
        'INSERT INTO auth_user (user_id, username, password_hash, real_name, email, status) VALUES ($1, $2, $3, $4, $5, $6)',
        user
      );
      console.log(`Inserted: ${user[1]}`);
    }
    
    console.log('\nVerifying...');
    const result = await pool.query('SELECT user_id, username, LEFT(password_hash, 40) as preview FROM auth_user');
    for (const row of result.rows) {
      console.log(`${row.user_id}: ${row.username} -> ${row.preview}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

resetPasswords();
