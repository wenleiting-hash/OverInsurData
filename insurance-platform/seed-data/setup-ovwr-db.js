const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONTAINER = 'ai-saas-postgres-dev';
const USER = 'postgres';

// Read SQL files
const i18nSQLPath = path.join(__dirname, './ovwr-i18n-db.sql');
const authSQLPath = path.join(__dirname, './ovwr-auth-db.sql');

const i18nSQL = fs.readFileSync(i18nSQLPath, 'utf-8');
const authSQL = fs.readFileSync(authSQLPath, 'utf-8');

function runCommand(cmd) {
    return new Promise((resolve, reject) => {
        console.log(`\n📝 Executing: ${cmd.substring(0, 50)}...`);
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout);
        });
    });
}

async function setupDatabase() {
    try {
        // Create databases
        console.log('=== Creating i18n_db database ===');
        await runCommand(`docker exec ${CONTAINER} psql -U ${USER} -c "CREATE DATABASE i18n_db;" -d postgres`);

        console.log('=== Creating auth_db database ===');
        await runCommand(`docker exec ${CONTAINER} psql -U ${USER} -c "CREATE DATABASE auth_db;" -d postgres`);

        // Execute i18n-db.sql
        console.log('\n=== Executing i18n-db.sql ===');
        await runCommand(`echo "${i18nSQL.replace(/\r\n/g, '\\n').replace(/"/g, '\\"')}" | docker exec -i ${CONTAINER} psql -U ${USER} -d i18n_db`);

        // Execute auth-db.sql
        console.log('\n=== Executing auth-db.sql ===');
        await runCommand(`echo "${authSQL.replace(/\r\n/g, '\\n').replace(/"/g, '\\"')}" | docker exec -i ${CONTAINER} psql -U ${USER} -d auth_db`);

        console.log('\n✅ Database setup complete!');
        
        // Verify tables
        console.log('\n=== Verifying i18n_db tables ===');
        const i18nTables = await runCommand(`docker exec ${CONTAINER} psql -U ${USER} -d i18n_db -c "\\dt"`);
        console.log(i18nTables);

        console.log('\n=== Verifying auth_db tables ===');
        const authTables = await runCommand(`docker exec ${CONTAINER} psql -U ${USER} -d auth_db -c "\\dt"`);
        console.log(authTables);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setupDatabase();
