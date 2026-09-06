require('dotenv').config();
const { pool } = require('./dist/database/drizzle.client');
const bcrypt = require('bcrypt');

console.log('Testing password verification...');

pool.query('SELECT * FROM auth_user WHERE username = $1', ['admin'])
    .then(r => {
        const user = r.rows[0];
        console.log('Found user:', user.username);
        console.log('Hash:', user.password_hash);
        
        return bcrypt.compare('admin123', user.password_hash)
            .then(isMatch => console.log('Password match:', isMatch))
            .catch(e => console.error('bcrypt error:', e.message));
    })
    .catch(e => console.error('DB error:', e.message));
