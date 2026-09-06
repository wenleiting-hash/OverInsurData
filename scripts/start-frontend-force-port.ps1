# ============================================
# InsureOS 前端服务启动脚本（强制端口 3001）
# ============================================

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "InsureOS 前端服务启动脚本 V1.0" -ForegroundColor Cyan
Write-Host "==========================================`n" -ForegroundColor Cyan

# 1. 停止所有占用 3001 端口的进程
Write-Host "[步骤 1/4] 检查并停止占用 3001 端口的进程..." -ForegroundColor Yellow

$connection = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($connection) {
    $pid = $connection.OwningProcess
    Write-Host "  → 发现进程 PID=$pid 占用 3001 端口，正在终止..." -ForegroundColor Red
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# 2. 验证端口已释放
Write-Host "`n[步骤 2/4] 验证 3001 端口已释放..." -ForegroundColor Yellow
$check = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($check) {
    Write-Host "  ✗ 端口 3001 仍被占用！请手动检查进程。" -ForegroundColor Red
    exit 1
} else {
    Write-Host "  ✓ 端口 3001 已就绪" -ForegroundColor Green
}

# 3. 进入前端目录
Write-Host "`n[步骤 3/4] 切换到前端项目目录..." -ForegroundColor Yellow
$projectRoot = Split-Path $PSScriptRoot -Parent
cd "$projectRoot/insurance-platform/apps/web-carrier-admin"
Write-Host "  → 当前目录：$(Get-Location)" -ForegroundColor Gray

# 4. 启动 Vite 开发服务器
Write-Host "`n[步骤 4/4] 启动 Vite 开发服务器..." -ForegroundColor Yellow
Write-Host "  → 目标端口：3001 (固定)" -ForegroundColor Gray
Write-Host "  → API 后端：http://localhost:8080`n" -ForegroundColor Gray

pnpm run dev
