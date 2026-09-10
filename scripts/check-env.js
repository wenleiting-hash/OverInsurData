/**
 * 环境自检脚本
 * 执行命令：node scripts/check-env.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  success: '\x1b[32m',
  error: '\x1b[31m',
  warning: '\x1b[33m',
  info: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(type, message) {
  const color = colors[type] || colors.info;
  console.log(`${color}[${type.toUpperCase()}]${colors.reset} ${message}`);
}

async function checkPostgreSQL() {
  try {
    execSync('psql -U postgres -c "SELECT version();" > /dev/null 2>&1', { stdio: 'pipe' });
    log('success', '✓ PostgreSQL 服务正常运行');
    return true;
  } catch (err) {
    log('error', '✗ PostgreSQL 未安装或未启动');
    log('warning', '  解决方法：在 Windows 服务管理器中启动 PostgreSQL');
    return false;
  }
}

async function checkDatabase() {
  try {
    execSync('psql -U postgres -d overinsur_db -c "SELECT 1;" > /dev/null 2>&1', { stdio: 'pipe' });
    log('success', '✓ 数据库 overinsur_db 可访问');
    
    // 检查是否已有 auth_user 表
    const result = execSync(
      'psql -U postgres -d overinsur_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name=\'auth_user\'"',
      { encoding: 'utf-8' }
    );
    
    const count = parseInt(result.trim()) || 0;
    if (count > 0) {
      log('info', 'ℹ 检测到已有 auth_user 表，后续操作会跳过已存在表');
    } else {
      log('warning', '⚠ auth_user 表不存在，将在部署时创建');
    }
    
    return true;
  } catch (err) {
    log('error', '✗ 数据库 overinsur_db 不存在或无法连接');
    log('warning', '  解决方法：运行 CREATE DATABASE overinsur_db;');
    return false;
  }
}

async function checkNodeModules() {
  const requiredPackages = [
    'tsx',
    '@nestjs/common',
    '@tanstack/react-query',
    'axios',
  ];
  
  let allExist = true;
  
  for (const pkg of requiredPackages) {
    try {
      execSync(`npm list ${pkg} > /dev/null 2>&1`, { 
        stdio: 'pipe',
        cwd: process.cwd(),
      });
      log('success', `✓ ${pkg} 已安装`);
    } catch (err) {
      log('warning', `⚠ ${pkg} 未全局安装，将使用本地依赖`);
    }
  }
  
  return allExist;
}

async function checkScriptsDirectory() {
  const scriptPath = path.join(process.cwd(), 'scripts');
  
  if (!fs.existsSync(scriptPath)) {
    log('warning', '⚠ scripts 目录不存在，将自动创建');
    fs.mkdirSync(scriptPath, { recursive: true });
    log('success', '✓ scripts 目录创建成功');
    return true;
  }
  
  log('success', '✓ scripts 目录存在');
  
  // 检查关键脚本
  const requiredScripts = [
    'check-env.js',
    'auto-deploy.js',
    'deploy-p0-database.ts',
  ];
  
  for (const script of requiredScripts) {
    const filePath = path.join(scriptPath, script);
    if (fs.existsSync(filePath)) {
      log('success', `✓ ${script} 文件存在`);
    } else {
      log('error', `✗ 缺少必要脚本：${script}`);
      return false;
    }
  }
  
  return true;
}

async function checkPortAvailability(port, serviceName) {
  // Windows 下简单检查
  try {
    execSync(`netstat -ano | findstr :${port}`, { 
      stdio: 'pipe',
      shell: 'powershell.exe',
    });
    log('warning', `⚠ 端口 ${port} 已被占用 (${serviceName})`);
    log('info', '  建议：修改 .env 中的端口配置');
    return false;
  } catch (err) {
    log('success', `✓ 端口 ${port} 可用 (${serviceName})`);
    return true;
  }
}

async function checkEnvironmentVariables() {
  const envFile = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envFile)) {
    log('warning', '⚠ .env 文件不存在，将使用默认值');
    return true;
  }
  
  const envContent = fs.readFileSync(envFile, 'utf-8');
  
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'VITE_API_BASE_URL',
  ];
  
  let allPresent = true;
  
  for (const varName of requiredVars) {
    if (envContent.includes(varName)) {
      log('success', `✓ ${varName} 已配置`);
    } else {
      log('warning', `⚠ ${varName} 未配置，将使用环境变量默认值`);
    }
  }
  
  return allPresent;
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log(colors.info + '🔍 自动化实施引擎 - 前置条件检查'.padEnd(70, colors.reset));
  console.log('='.repeat(70) + '\n' + colors.reset);
  
  const checks = [
    { name: 'PostgreSQL 服务', fn: checkPostgreSQL },
    { name: '数据库连接', fn: checkDatabase },
    { name: 'Node 依赖包', fn: checkNodeModules },
    { name: '脚本目录', fn: checkScriptsDirectory },
    { name: '端口可用性', fn: () => checkPortAvailability(3000, '后端') && checkPortAvailability(3001, '前端') },
    { name: '环境变量', fn: checkEnvironmentVariables },
  ];
  
  const results = [];
  
  for (const check of checks) {
    log('info', `\n正在检查：${check.name}...`);
    try {
      const result = await check.fn();
      results.push({ name: check.name, passed: result });
    } catch (err) {
      log('error', `检查失败：${err.message}`);
      results.push({ name: check.name, passed: false, error: err.message });
    }
  }
  
  console.log('\n' + '-'.repeat(70));
  const allPassed = results.every(r => r.passed);
  
  if (allPassed) {
    console.log('\n' + colors.success + '✅ 所有前置条件检查通过!\n' + colors.reset);
    console.log(colors.success + '状态汇总:\n' + colors.reset);
    
    for (const result of results) {
      const icon = result.passed ? '✅' : '❌';
      const status = result.passed ? '已就绪' : '不满足';
      console.log(`  ${icon} ${result.name.padEnd(20)} ${status}`);
    }
    
    console.log('\n' + colors.green + '🎯 下一步:' + colors.reset);
    console.log('  运行：node scripts/auto-deploy.js');
    console.log('  将自动执行 P0→P1→P2 全流程部署\n');
    
  } else {
    console.log('\n' + colors.error + '❌ 以下检查项未通过:\n' + colors.reset);
    
    for (const result of results) {
      if (!result.passed) {
        console.log(colors.error + `  ✗ ${result.name}: ${result.error || '未知错误'}\n` + colors.reset);
      }
    }
    
    console.log(colors.warning + '请修复上述问题后重新运行检查\n' + colors.reset);
    console.log(colors.info + '提示:\n' + colors.reset);
    console.log('  - PostgreSQL 问题：启动 Windows 服务管理器 → PostgreSQL*');
    console.log('  - 数据库缺失：psql -U postgres -c "CREATE DATABASE overinsur_db;"');
    console.log('  - 端口占用：修改 .env 中的 PORT 配置\n');
    
    process.exit(1);
  }
  
  console.log('-'.repeat(70) + '\n');
}

main().catch(err => {
  console.error(colors.error + '✗ 检查过程中出错:', err.message, colors.reset);
  process.exit(1);
});
