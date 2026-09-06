# ===================================================================
# Windows Build Tools Installation Script for bcrypt
# 海外保险数字化平台 - Node.js 原生模块编译脚本
# ===================================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Windows Build Tools 安装脚本" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 步骤 1: 检查 Python 版本
Write-Host "[步骤 1/4] 检查 Python 环境..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
Write-Host "   ✅ $pythonVersion" -ForegroundColor Green

# 设置 Python 环境变量（如果需要）
Set-Variable -Name "PYTHON_PATH" -Value "C:\Users\wlt\AppData\Local\Programs\Python\Python314"
Set-EnvironmentVariable -Name "PYTHONPATH" -Value "$env:PYTHON_PATH\lib\site-packages" -Scope User

# 步骤 2: 安装 Visual Studio Build Tools 组件（离线模式）
Write-Host "`n[步骤 2/4] 下载 Visual Studio Build Tools..." -ForegroundColor Yellow
$downloadUrl = "https://aka.ms/vs/17/release/vs_buildtools.exe"
$downloadPath = "$env:TEMP\vs_buildtools.exe"

try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath -UseBasicParsing
    Write-Host "   ✅ 下载完成：$downloadPath" -ForegroundColor Green
} catch {
    Write-Host "   ❌ 下载失败：$_" -ForegroundColor Red
    Write-Host "`n请手动下载安装程序：" -ForegroundColor Yellow
    Write-Host "   1. 访问：$downloadUrl" -ForegroundColor Gray
    Write-Host "   2. 运行安装包" -ForegroundColor Gray
    Write-Host "   3. 选择 'Desktop development with C++'" -ForegroundColor Gray
    exit 1
}

# 步骤 3: 静默安装 Build Tools
Write-Host "`n[步骤 3/4] 安装 C++ 构建工具（这将打开安装向导）..." -ForegroundColor Yellow
Write-Host "   ⚠️ 请按以下步骤操作：" -ForegroundColor Cyan
Write-Host "   1. 在'工作负载'中勾选'Desktop development with C++'" -ForegroundColor White
Write-Host "   2. 点击'安装'" -ForegroundColor White
Write-Host "   3. 等待安装完成（约 10-30 分钟）" -ForegroundColor White
Write-Host "   4. 完成后按任意键继续..." -ForegroundColor White

# 启动安装程序（用户交互）
Start-Process -FilePath $downloadPath -ArgumentList "--wait --quiet --norestart --channelId VS/17/release --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended" -Wait

# 步骤 4: 重新安装依赖
Write-Host "`n[步骤 4/4] 重新安装 bcrypt 和编译原生模块..." -ForegroundColor Yellow
Write-Host "   🔨 正在编译..." -ForegroundColor Cyan

cd e:\WorkProject\OverInsurData\insurance-platform

# 清除旧的二进制缓存
Remove-Item -Path ".pnpm-store" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue

# 使用 pnpm 重新安装（会自动编译原生模块）
pnpm install

if ($?) {
    Write-Host "`n✅ 安装成功！" -ForegroundColor Green
    Write-Host "`n现在可以启动后端服务了：" -ForegroundColor Cyan
    Write-Host "   cd apps/carrier-service" -ForegroundColor Gray
    Write-Host "   npm run dev" -ForegroundColor Gray
    
    Write-Host "`n验证 bcrypt 是否可用：" -ForegroundColor Cyan
    Write-Host "   node -e "require('bcrypt'); console.log('✓ bcrypt loaded successfully')" `" -ForegroundColor Gray
} else {
    Write-Host "`n❌ 安装失败！" -ForegroundColor Red
    Write-Host "`n错误原因：" -ForegroundColor Yellow
    Write-Host "   1. 可能未正确安装 C++ 构建工具" -ForegroundColor Gray
    Write-Host "   2. Python 版本不兼容（建议使用 Python 3.8-3.11）" -ForegroundColor Gray
    Write-Host "   3. Node.js 版本问题（建议使用 LTS 版本）" -ForegroundColor Gray
}

Read-Host "`n按 Enter 退出"
