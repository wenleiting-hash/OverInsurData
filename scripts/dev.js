// 根目录并行启动器：同时启动内层工作区的后端与前端（零三方依赖，跨平台）。
// 真正的 pnpm workspace 在 insurance-platform/ 内；根项目仅作为启动入口。
const { spawn } = require('node:child_process');
const path = require('node:path');

const appsDir = path.join(__dirname, '..', 'insurance-platform', 'apps');
const services = [
  { name: 'backend', color: '\x1b[36m', dir: path.join(appsDir, 'carrier-service') },
  { name: 'frontend', color: '\x1b[35m', dir: path.join(appsDir, 'web-carrier-admin') },
];

const children = services.map((s) => {
  // 用 npm 而非 pnpm：内层各 app 依赖已安装完整，npm run 不触发 pnpm 11 的
  // 运行前自动 install（网络不稳时会卡死启动）。
  const child = spawn('npm run dev', { cwd: s.dir, stdio: ['ignore', 'pipe', 'pipe'], shell: true });
  const tag = `${s.color}[${s.name}]\x1b[0m `;
  const prefix = (data) =>
    data
      .toString()
      .split(/\r?\n/)
      .map((line) => (line ? tag + line : line))
      .join('\n');
  child.stdout.on('data', (d) => process.stdout.write(prefix(d)));
  child.stderr.on('data', (d) => process.stderr.write(prefix(d)));
  child.on('exit', (code) => {
    process.stderr.write(`${tag}exited with code ${code}\n`);
    shutdown(code ?? 0);
  });
  return child;
});

let shuttingDown = false;
function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.killed) continue;
    if (process.platform === 'win32') {
      // /T 连带杀死 pnpm -> nodemon/tsc/vite 整个进程树
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill('SIGTERM'); }
    }
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
