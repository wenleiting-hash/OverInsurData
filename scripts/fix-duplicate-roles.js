/**
 * Delete duplicate roles table (ovwr.roles)
 * 目的：解决 P1 级问题 - Flyway 脚本与 Drizzle Schema 表名冲突
 */

// Use pg from carrier-service module (installed in parent directory)
const { Pool } = require('../../insurance-platform/apps/carrier-service/node_modules/pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ai_saas',
  user: 'postgres',
  password: 'postgres',
});

async function deleteDuplicateTables() {
  try {
    console.log('⚡ Checking duplicate tables...\n');
    
    // Check if ovwr.roles exists
    const rolesCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'roles' AND table_schema = 'ovwr'
      )`
    );
    
    console.log(`📍 ovwr.roles exists: ${rolesCheck.rows[0].exists}`);
    
    // Check if auth.auth_role exists
    const authRoleCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'auth_role' AND table_schema = 'auth'
      )`
    );
    
    console.log(`📍 auth.auth_role exists: ${authRoleCheck.rows[0].exists}`);
    
    // Count data in both tables
    const rolesCount = await pool.query('SELECT COUNT(*) as cnt FROM ovwr.roles');
    console.log(`📊 ovwr.roles row count: ${rolesCount.rows[0].cnt}`);
    
    const authRoleCount = await pool.query('SELECT COUNT(*) as cnt FROM auth.auth_role');
    console.log(`📊 auth.auth_role row count: ${authRoleCount.rows[0].cnt}`);
    
    console.log('\n⚠️  Action: Drop ovwr.roles (keep auth.auth_role)\n');
    
    // Drop ovwr.roles
    if (rolesCheck.rows[0].exists) {
      await pool.query('DROP TABLE IF EXISTS ovwr.roles CASCADE');
      await pool.query('DROP TABLE IF EXISTS ovwr.permission_templates CASCADE');
      console.log('✅ Successfully dropped ovwr.roles and ovwr.permission_templates\n');
    } else {
      console.log('ℹ️  ovwr.roles already does not exist, skipping drop\n');
    }
    
    // Verify deletion
    const finalCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'roles' AND table_schema = 'ovwr'
      )`
    );
    
    console.log(`🔍 Verification: ovwr.roles still exists: ${finalCheck.rows[0].exists}`);
    
    // Show active tables
    const tables = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname IN ('auth', 'ovwr') ORDER BY schemaname, tablename"
    );
    
    console.log('\n📋 Active tables in auth/ovwr schemas:');
    tables.rows.forEach(row => {
      console.log(`   • ${row.tablename}`);
    });
    
    console.log('\n✅ Fix completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

deleteDuplicateTables();
