# ============================================================================
# Environment Verification Tool for InsureOS Platform
# Version: 1.0.0
# Date: 2026-09-04
# ============================================================================

#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  InsureOS Environment Verifier" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$issuesFound = $false

# [1/7] Check Node.js
Write-Host "[1/7] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = & node -v 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Node.js failed to respond" -ForegroundColor Red
        $issuesFound = $true
    }
} catch {
    Write-Host "  ✗ Node.js not found" -ForegroundColor Red
    $issuesFound = $true
}

# [2/7] Check pnpm
Write-Host "[2/7] Checking pnpm..." -ForegroundColor Yellow
try {
    $pnpmVersion = & pnpm -v 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ pnpm: v$pnpmVersion" -ForegroundColor Green
    } else {
        Write-Host "  ✗ pnpm failed to respond" -ForegroundColor Red
        $issuesFound = $true
    }
} catch {
    Write-Host "  ✗ pnpm not found" -ForegroundColor Red
    $issuesFound = $true
}

# [3/7] Check required ports
Write-Host "[3/7] Checking port availability..." -ForegroundColor Yellow

$ports = @(3001, 8080)
foreach ($port in $ports) {
    $listening = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($null -ne $listening) {
        Write-Host "  ⚠ Port $port is occupied (PID: $($listening.OwnerProcessId))" -ForegroundColor Yellow
    } else {
        Write-Host "  ✓ Port $port is available" -ForegroundColor Green
    }
}

# [4/7] Check project structure
Write-Host "[4/7] Checking project structure..." -ForegroundColor Yellow
$projectRoot = Split-Path $PSScriptParent
$requiredDirs = @("insurance-platform", "services")

foreach ($dir in $requiredDirs) {
    $path = Join-Path $projectRoot $dir
    if (Test-Path $path) {
        Write-Host "  ✓ $dir/ exists" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Missing directory: $dir/" -ForegroundColor Red
        $issuesFound = $true
    }
}

# [5/7] Check node_modules
Write-Host "[5/7] Checking dependencies..." -ForegroundColor Yellow
$platformDir = Join-Path $projectRoot "insurance-platform"
if (Test-Path (Join-Path $platformDir "node_modules")) {
    $moduleCount = (Get-ChildItem (Join-Path $platformDir "node_modules") -Force).Count
    Write-Host "  ✓ Dependencies installed ($_modules packages)" -ForegroundColor Green
} else {
    Write-Host "  ✗ node_modules not found" -ForegroundColor Red
    Write-Host "    Run 'cd insurance-platform && pnpm install' first" -ForegroundColor Gray
    $issuesFound = $true
}

# [6/7] Check backend build artifacts
Write-Host "[6/7] Checking backend build..." -ForegroundColor Yellow
$carrierDist = Join-Path $projectRoot "insurance-platform\services\carrier-service\dist"
if (Test-Path (Join-Path $carrierDist "main.js")) {
    Write-Host "  ✓ Carrier Service built successfully" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Backend dist folder missing" -ForegroundColor Yellow
    Write-Host "    Run 'cd insurance-platform/services/carrier-service && pnpm run build'" -ForegroundColor Gray
}

# [7/7] Check network connectivity
Write-Host "[7/7] Testing local network..." -ForegroundColor Yellow
try {
    $testResult = Test-NetConnection -ComputerName localhost -Port 8080 -InformationLevel Quiet -ErrorAction SilentlyContinue
    if ($testResult) {
        Write-Host "  ✓ Localhost network accessible" -ForegroundColor Green
    } else {
        # This is expected when service is not running
        Write-Host "  ℹ Backend service not running (expected)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ℹ Network test skipped" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan

if (-not $issuesFound) {
    Write-Host "  ✅ All checks passed!" -ForegroundColor Green
    Write-Host "  Ready to start the test environment." -ForegroundColor Gray
    Write-Host ""
    
    $action = Read-Host "Do you want to start the environment now? (y/n)"
    if ($action.ToLower() -eq 'y') {
        Write-Host ""
        Write-Host "Starting services..." -ForegroundColor Yellow
        & "$PSScriptRoot\start-test-env.ps1" -SkipCheck:$false
    }
} else {
    Write-Host "  ❌ Issues detected - please fix before starting" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor Yellow
    Write-Host "  • Install Node.js from https://nodejs.org/" -ForegroundColor Gray
    Write-Host "  • Install pnpm: npm install -g pnpm" -ForegroundColor Gray
    Write-Host "  • Free up occupied ports (netstat -ano | findstr :PORT)" -ForegroundColor Gray
    Write-Host "  • Install dependencies: cd insurance-platform; pnpm install" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
