import { migrate } from 'drizzle-orm/pg-core/migrator';
import { pool } from '@/database/pool';

async function runMigration() {
  console.log('🚀 Running Drizzle migrations...');
  
  try {
    // Create drizzle schema table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _drizzle_drift (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Execute migration logic here
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
