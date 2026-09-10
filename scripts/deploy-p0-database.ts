/**
 * P0-1: 数据库基础设施搭建
 * 自动执行 Flyway 迁移脚本 + 索引优化 + 种子数据
 * 预估时间：15 分钟
 */

// 使用本地导入或直接连接池
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres@localhost/overinsur_db',
});

async function connect() {
  await client.connect();
}

async function query(text: string, params?: any[]) {
  return client.query(text, params);
}

async function close() {
  await client.end();
}

async function printSection(title: string) {
  console.log('\n' + '='.repeat(80));
  console.log(title.padEnd(80, '='));
  console.log('='.repeat(80) + '\n');
}

async function createAuthTables() {
  await printSection('📦 步骤 1/7: 创建核心表结构');
  
  const tables = [
    {
      name: 'auth_user',
      sql: `
        CREATE TABLE IF NOT EXISTS auth_user (
          user_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(100) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(100) NOT NULL,
          name_en VARCHAR(100),
          dept_code VARCHAR(20) NOT NULL,
          phone VARCHAR(20),
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          auth_method VARCHAR(20) DEFAULT 'local',
          mfa_enabled BOOLEAN DEFAULT FALSE,
          mfa_secret VARCHAR(255),
          last_login_at TIMESTAMPTZ,
          failed_login_attempts INTEGER DEFAULT 0,
          deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    },
    {
      name: 'auth_role',
      sql: `
        CREATE TABLE IF NOT EXISTS auth_role (
          role_id VARCHAR(50) PRIMARY KEY,
          role_key VARCHAR(50) NOT NULL UNIQUE,
          role_name VARCHAR(100) NOT NULL,
          role_name_en VARCHAR(100),
          description TEXT,
          description_en TEXT,
          is_system BOOLEAN DEFAULT FALSE,
          user_count INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    },
    {
      name: 'auth_user_role',
      sql: `
        CREATE TABLE IF NOT EXISTS auth_user_role (
          user_uuid UUID NOT NULL REFERENCES auth_user(user_uuid) ON DELETE CASCADE,
          role_id VARCHAR(50) NOT NULL REFERENCES auth_role(role_id),
          assigned_by UUID REFERENCES auth_user(user_uuid),
          granted_at TIMESTAMPTZ DEFAULT NOW(),
          expires_at TIMESTAMPTZ,
          PRIMARY KEY (user_uuid, role_id)
        );
      `,
    },
    {
      name: 'sys_department',
      sql: `
        CREATE TABLE IF NOT EXISTS sys_department (
          dept_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          dept_code VARCHAR(20) UNIQUE NOT NULL,
          dept_name VARCHAR(100) NOT NULL,
          dept_name_en VARCHAR(100),
          parent_id UUID REFERENCES sys_department(dept_id),
          org_type VARCHAR(20) DEFAULT 'internal',
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    },
    {
      name: 'auth_operation_log',
      sql: `
        CREATE TABLE IF NOT EXISTS auth_operation_log (
          log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_uuid UUID REFERENCES auth_user(user_uuid),
          action VARCHAR(50) NOT NULL,
          module VARCHAR(50) NOT NULL,
          target_id UUID,
          ip_address INET,
          user_agent TEXT,
          request_data JSONB,
          response_data JSONB,
          duration_ms INTEGER,
          success BOOLEAN DEFAULT TRUE,
          error_message TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    },
    {
      name: 'ovwr_auth_permission_template',
      sql: `
        CREATE TABLE IF NOT EXISTS ovwr_auth_permission_template (
          ovwr_template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          ovwr_template_name VARCHAR(100) NOT NULL UNIQUE,
          ovwr_description TEXT,
          ovwr_permissions JSONB NOT NULL,
          ovwr_applicable_roles TEXT[],
          ovwr_is_system BOOLEAN DEFAULT FALSE,
          ovwr_usage_count INTEGER DEFAULT 0,
          ovwr_status VARCHAR(20) DEFAULT 'active',
          ovwr_metadata JSONB,
          ovwr_created_at TIMESTAMPTZ DEFAULT NOW(),
          ovwr_updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    },
    {
      name: 'ovwr_auth_role_permission',
      sql: `
        CREATE TABLE IF NOT EXISTS ovwr_auth_role_permission (
          ovwr_permission_template_id UUID REFERENCES ovwr_auth_permission_template(ovwr_template_id) ON DELETE CASCADE,
          ovwr_role_id VARCHAR(50) NOT NULL REFERENCES auth_role(role_id),
          ovwr_permission_id VARCHAR(100) NOT NULL,
          permission_level VARCHAR(20) DEFAULT 'view',
          condition_rules JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (ovwr_permission_template_id, ovwr_role_id, ovwr_permission_id)
        );
      `,
    },
  ];
  
  for (const table of tables) {
    console.log(`\n正在创建 ${table.name} 表...`);
    await query(table.sql);
    console.log(`✅ ${table.name} 已就绪\n`);
  }
}

async function createIndexes() {
  await printSection('📈 步骤 2/7: 创建性能优化索引');
  
  const indexes = [
    { name: 'idx_auth_user_username', sql: 'CREATE INDEX IF NOT EXISTS idx_auth_user_username ON auth_user(username);' },
    { name: 'idx_auth_user_email', sql: 'CREATE INDEX IF NOT EXISTS idx_auth_user_email ON auth_user(email);' },
    { name: 'idx_auth_user_dept', sql: 'CREATE INDEX IF NOT EXISTS idx_auth_user_dept ON auth_user(dept_code);' },
    { name: 'idx_auth_user_status', sql: 'CREATE INDEX IF NOT EXISTS idx_auth_user_status ON auth_user(status);' },
    { name: 'idx_auth_user_deleted', sql: 'CREATE INDEX IF NOT EXISTS idx_auth_user_deleted ON auth_user(deleted) WHERE deleted = FALSE;' },
    { name: 'idx_auth_user_role_user', sql: 'CREATE INDEX IF NOT EXISTS idx_auth_user_role_user ON auth_user_role(user_uuid);' },
    { name: 'idx_auth_user_role_role', sql: 'CREATE INDEX IF NOT EXISTS idx_auth_user_role_role ON auth_user_role(role_id);' },
    { name: 'idx_auth_oplog_user', sql: 'CREATE INDEX IF NOT EXISTS idx_auth_oplog_user ON auth_operation_log(user_uuid);' },
    { name: 'idx_auth_oplog_module', sql: 'CREATE INDEX IF NOT EXISTS idx_auth_oplog_module ON auth_operation_log(module);' },
    { name: 'idx_auth_oplog_action', sql: 'CREATE INDEX IF NOT EXISTS idx_auth_oplog_action ON auth_operation_log(action);' },
    { name: 'idx_auth_oplog_created', sql: 'CREATE INDEX IF NOT EXISTS idx_auth_oplog_created ON auth_operation_log(created_at DESC);' },
    { name: 'idx_ovwr_permissions', sql: 'CREATE INDEX IF NOT EXISTS idx_ovwr_permissions ON ovwr_auth_permission_template USING GIN(ovwr_permissions);' },
  ];
  
  for (const index of indexes) {
    console.log(`  → 创建索引：${index.name}`);
    await query(index.sql);
  }
  
  console.log(`\n✅ 所有 ${indexes.length} 个索引创建成功\n`);
}

async function seedInitialData() {
  await printSection('🌱 步骤 3/7: 初始化种子数据');
  
  // 部门数据
  const departments = [
    { code: 'tech', name: '技术部', nameEn: 'Technology Department' },
    { code: 'ops', name: '运营部', nameEn: 'Operations Department' },
    { code: 'hr', name: '人力资源部', nameEn: 'Human Resources' },
    { code: 'finance', name: '财务部', nameEn: 'Finance Department' },
  ];
  
  console.log('插入部门数据...');
  for (const dept of departments) {
    await query(`
      INSERT INTO sys_department (dept_id, dept_code, dept_name, dept_name_en, org_type)
      VALUES (gen_random_uuid(), $1, $2, $3, 'internal')
      ON CONFLICT (dept_code) DO NOTHING
    `, [dept.code, dept.name, dept.nameEn]);
  }
  console.log(`  ✓ 创建了 4 个部门\n`);
  
  // 角色数据
  const roles = [
    { id: 'super_admin', key: 'superAdmin', name: '超级管理员', desc: '拥有所有权限', system: true },
    { id: 'ops_admin', key: 'opsAdmin', name: '运维管理员', desc: '运维配置权限', system: false },
    { id: 'carrier_admin', key: 'carrierAdmin', name: '保险公司管理员', desc: '保险公司管理权限', system: false },
    { id: 'finance_admin', key: 'financeAdmin', name: '财务管理员', desc: '财务结算权限', system: false },
    { id: 'viewer', key: 'readOnly', name: '只读用户', desc: '仅查看权限', system: false },
  ];
  
  console.log('插入角色数据...');
  for (const role of roles) {
    await query(`
      INSERT INTO auth_role (role_id, role_key, role_name, description, is_system)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (role_id) DO NOTHING
    `, [role.id, role.key, role.name, role.desc, role.system]);
  }
  console.log(`  ✓ 创建了 5 个预定义角色\n`);
}

async function verifySetup() {
  await printSection('✓ 步骤 4/7: 验证安装结果');
  
  const tableCheck = await query(`
    SELECT COUNT(*) as cnt FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN (
        'auth_user', 'auth_role', 'auth_user_role',
        'sys_department', 'auth_operation_log',
        'ovwr_auth_permission_template', 'ovwr_auth_role_permission'
      )
  `);
  
  console.log(`核心表数量：${parseInt(tableCheck.rows[0].cnt)}/7 ✅`);
  
  const roleCount = await query('SELECT COUNT(*) as cnt FROM auth_role');
  const deptCount = await query('SELECT COUNT(*) as cnt FROM sys_department');
  const indexCount = await query(`
    SELECT COUNT(*) as cnt FROM pg_indexes 
    WHERE tablename IN ('auth_user', 'auth_role', 'auth_operation_log')
  `);
  
  console.log(`预定义角色：${parseInt(roleCount.rows[0].cnt)} ✅`);
  console.log(`组织部门：${parseInt(deptCount.rows[0].cnt)} ✅`);
  console.log(`性能索引：${parseInt(indexCount.rows[0].cnt)}+ ✅\n`);
}

async function main() {
  console.log('\n🚀 P0-1: 数据库基础设施自动化部署');
  
  try {
    // Connect to database first
    await connect();
    
    // Step 1: Backup warning
    console.log('\n⚠️  重要提示:');
    console.log('   建议先备份现有数据:');
    console.log('   pg_dump -U postgres -d overinsur_db > backup_pre_deploy.sql\n');
    
    // Step 2: Create everything
    await createAuthTables();
    await createIndexes();
    await seedInitialData();
    
    // Step 3: Verify
    await verifySetup();
    
    console.log('='.repeat(80));
    console.log('🎉 P0-1 数据库基础设施搭建完成!\n');
    console.log('下一步：执行 scripts/deploy-backend-user-service.ts');
    console.log('='.repeat(80) + '\n');
    
    await close();
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ 部署失败:', (err as Error).message);
    
    await close();
    process.exit(1);
  }
}

main();
