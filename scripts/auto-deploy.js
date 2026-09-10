/**
 * 一键启动全自动部署
 * 执行命令：pnpm deploy
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  RESET: '\x1b[0m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  RED: '\x1b[31m',
  BLUE: '\x1b[36m',
  MAGENTA: '\x1b[35m',
};

console.log('\n' + '='.repeat(80));
console.log(colors.MAGENTA + '🤖 全自动部署引擎 - 一键启动'.padEnd(80, colors.RESET));
console.log('='.repeat(80) + '\n' + colors.RESET);

async function runCommand(cmd, args, cwd, description) {
  return new Promise((resolve, reject) => {
    console.log(colors.BLUE + `▶ ${description}` + colors.RESET);
    
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      cwd: cwd || process.cwd(),
      shell: true,
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(colors.GREEN + `✅ ${description} 完成\n` + colors.RESET);
        resolve();
      } else {
        console.log(colors.RED + `❌ ${description} 失败 (退出码：${code})\n` + colors.RESET);
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    // Step 1: 环境检查
    console.log(colors.YELLOW + '阶段 1/4: 前置条件检查'.repeat(80) + colors.RESET);
    await runCommand('node', ['scripts/check-env.js'], null, '运行环境自检脚本');
    
    // Step 2: 数据库部署
    console.log('\n' + colors.YELLOW + '阶段 2/4: 数据库基础设施搭建'.repeat(80) + colors.RESET);
    await runCommand('tsx', ['scripts/deploy-p0-database.ts'], null, '执行数据库迁移脚本');
    
    // Step 3: 后端服务开发
    console.log('\n' + colors.YELLOW + '阶段 3/4: 前后端代码生成'.repeat(80) + colors.RESET);
    await runCommand('tsx', ['scripts/deploy-backend-user-service.ts'], null, '生成 UserService 完整实现');
    await runCommand('tsx', ['scripts/deploy-backend-controllers.ts'], null, '生成所有 Controller 类');
    await runCommand('tsx', ['scripts/deploy-frontend-modules.ts'], null, '生成前端 React 组件');
    
    // Step 4: 测试验证
    console.log('\n' + colors.YELLOW + '阶段 4/4: 自动化测试与验证'.repeat(80) + colors.RESET);
    await runCommand('node', ['scripts/test-e2e.js'], null, '运行端到端测试套件');
    
    // 最终总结
    console.log('\n' + '='.repeat(80));
    console.log(colors.GREEN + '🎉 全流程自动化部署成功!\n' + colors.RESET);
    console.log(colors.MAGENTA + '下一步操作:\n' + colors.RESET);
    console.log(colors.BLUE + '  1. 启动服务:' + colors.RESET);
    console.log('     pnpm dev-all\n\n');
    console.log(colors.BLUE + '  2. 浏览器访问:' + colors.RESET);
    console.log('     http://localhost:3001/user-management\n\n');
    console.log(colors.BLUE + '  3. 查看报告:' + colors.RESET);
    console.log('     cat deployment-report.json\n\n');
    console.log('='.repeat(80) + '\n');
    
    process.exit(0);
    
  } catch (err) {
    console.log('\n' + colors.RED + '❌ 部署过程中遇到错误:\n' + colors.RESET);
    console.log(colors.YELLOW + err.message + '\n' + colors.RESET);
    console.log(colors.BLUE + '提示:' + colors.RESET);
    console.log('  - 查看详细日志：tail -f deploy.log\n');
    console.log('  - 环境诊断：node scripts/check-env.js\n');
    console.log('  - 回滚操作：git reset --hard HEAD\n\n');
    
    process.exit(1);
  }
}

main();
