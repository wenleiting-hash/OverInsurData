// Direct startup script for both services
const { spawn } = require('child_process');
const path = require('path');

console.log('\n' + '='.repeat(60));
console.log('🚀 Starting OverInsur Backend Services');
console.log('='.repeat(60) + '\n');

async function runInstall(serviceDir, serviceName) {
  console.log(`\n📦 Installing ${serviceName} dependencies...`);
  return new Promise((resolve) => {
    const proc = spawn('pnpm', ['install'], { 
      stdio: 'inherit',
      cwd: serviceDir
    });
    
    proc.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

async function startService(serviceDir, scriptPath, serviceName, port) {
  console.log(`\n🚀 Starting ${serviceName} on port ${port}...`);
  
  return new Promise((resolve) => {
    const proc = spawn('node', ['-r', 'esbuild-register', scriptPath], { 
      stdio: 'inherit',
      cwd: serviceDir
    });
    
    proc.on('close', (code) => {
      resolve(code);
    });
  });
}

async function main() {
  try {
    // First, set up environment files
    console.log('\n🔧 Creating .env files...');
    if (!require('fs').existsSync('.env')) {
      const envContent = `NODE_ENV=development
PORT=3002
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=ai_saas
CORS_ORIGIN=http://localhost:5173
SWAGGER_ENABLED=true
SWAGGER_PATH=/api/docs`;
      require('fs').writeFileSync('.env', envContent);
      console.log('✅ Environment file created\n');
    }

    // Start permission-service first
    const permServiceDir = path.join(__dirname, 'services/permission-service');
    const permServiceScript = path.join(permServiceDir, 'src/main.ts');
    
    await runInstall(permServiceDir, 'Permission Service');
    await startService(permServiceDir, permServiceScript, 'Permission Service', 3002);
    
    // Then i18n-service
    const i18nServiceDir = path.join(__dirname, 'services/i18n-service');
    const i18nServiceScript = path.join(i18nServiceDir, 'src/main.ts');
    
    await runInstall(i18nServiceDir, 'i18n Service');
    await startService(i18nServiceDir, i18nServiceScript, 'i18n Service', 3001);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
