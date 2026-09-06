require('dotenv').config();
const { Pool } = require('pg');

console.log('========================================');
console.log('  Database Connection Test');
console.log('========================================\n');

console.log('Environment Variables:');
console.log('  DB_HOST:', process.env.DB_HOST);
console.log('  DB_PORT:', process.env.DB_PORT);
console.log('  DB_NAME:', process.env.DB_NAME);
console.log('  DB_USER:', process.env.DB_USER);
console.log('  DB_PASSWORD:', '••••••••');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

console.log('\nConnecting to PostgreSQL...');

pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Connection failed:', err.message);
        return;
    }
    
    console.log('✅ Connected!\n');
    
    client.query('SELECT version()', (e, res) => {
        if (e) {
            console.error('❌ Error:', e.message);
            return;
        }
        
        console.log('Database Version:');
        console.log(res.rows[0].version);
        console.log('\nDatabase Name:', res.rows[0].server);
        
        client.release();
        pool.end();
    });
});
