// Simple install and run script for both services
const { execSync } = require('child_process');
const path = require('path');

async function runInstall(serviceDir, serviceName) {
  console.log(`\n📦 Installing ${serviceName} dependencies...`);
  try {
    execSync(`cd "${serviceDir}" && pnpm add dotenv @types/node`, { 
      stdio: 'inherit',
      cwd: serviceDir
    });
  } catch (error) {
    console.log('⚠️  Installation failed but continuing...');
  }
}

async function startService(serviceDir, scriptPath, serviceName, port) {
  console.log(`\n🚀 Starting ${serviceName} on port ${port}...`);
  const { execSync } = await import('child_process');
  try {
    execSync(`node -r esbuild-register "${scriptPath}"`, { 
      stdio: 'inherit',
      cwd: serviceDir
    });
  } catch (error) {
    console.error(`❌ Failed to start ${serviceName}`);
    process.exit(1);
  }
}

async function main() {
  const rootDir = process.cwd();
  
  // Check if env file exists
  const envFile = path.join(process.cwd(), '.env');
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 OverInsur Permission & i18n Services Starter');
  console.log('='.repeat(60));
  
  // Setup environment files first
  if (!require('fs').existsSync(envFile)) {
    console.log('\n🔧 Creating .env files...');
    const envTemplate = `# Server Configuration
NODE_ENV=development
PORT=3002

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=ai_saas

# CORS
CORS_ORIGIN=http://localhost:5173

# Swagger Documentation
SWAGGER_ENABLED=true
SWAGGER_PATH=/api/docs
`;
    require('fs').writeFileSync(envFile, envTemplate);
    console.log('✅ Environment file created');
  }

  // Start permission-service
  const permServiceDir = path.join(__dirname, 'permission-service');
  const permServiceScript = path.join(__dirname, 'services/permission-service/src/main.ts');
  
  try {
    await runInstall(permServiceDir, 'permission-service');
    
    await startService(permServiceDir, permServiceScript, 'Permission Service', 3002);
  } catch (error) {
    console.error('Failed to start permission-service. Will continue with i18n-service...');
  }
}

main().catch(console.error);
