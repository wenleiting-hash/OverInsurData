require('dotenv').config();
const { Pool } = require('pg');

console.log('Connecting to:', process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME);

const pool = new Pool({
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Connection error:', err.message);
        return;
    }
    
    console.log('Connected! Querying auth_user...');
    
    client.query('SELECT * FROM auth_user WHERE username = $1', ['admin'], (e, res) => {
        console.log('Rows found:', res.rows.length);
        if (res.rows.length > 0) {
            console.log('User:', JSON.stringify(res.rows[0], null, 2));
        } else {
            console.log('No admin user found!');
        }
        client.release();
        pool.end();
    });
});
