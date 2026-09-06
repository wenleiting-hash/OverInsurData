#!/usr/bin/env pwsh
# ============================================================================
# Test Environment Starter for InsureOS Platform
# Version: 1.0.0
# Date: 2026-09-04
# Author: AI Development Assistant
# Description: Automated startup script for local test environment
# ============================================================================

[CmdletBinding()]
param(
    [Switch]$SkipCheck = $false,
    [Switch]$Quiet = $false,
    [int]$BackendDelay = 8
)

# Configuration
$ErrorActionPreference = "Stop"
$PSDefaultParameterValues['Out-Host:ViewMode'] = 'Text'

# Colors for output
$COLORS = @{
    Success = 'Green'
    Error = 'Red'
    Warning = 'Yellow'
    Info = 'Blue'
    Step = 'Cyan'
}

# Helper functions
function Write-Banner {
    param([string]$Message)
    $padding = [Math]::Max(20, ($Message.Length + 4))
    $border = "=" * $padding
    Write-Host ""
    Write-Host $border -ForegroundColor $($COLORS.Info)
    Write-Host "  $Message" -ForegroundColor $($COLORS.Info)
    Write-Host $border -ForegroundColor $($COLORS.Info)
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-Host "[Step]" -NoNewline -ForegroundColor Gray
    Write-Host " $Message" -ForegroundColor $($COLORS.Step)
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $($COLORS.Success)
}

function Write-ErrorDetail {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $($COLORS.Error)
}

function Write-Warn {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $($COLORS.Warning)
}

function Check-CommandExists {
    param([string]$Command)
    return $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Get-PortUsage {
    param([int]$Port)
    return Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
           Select-Object -ExpandProperty OwnerProcessId -First 1
}

# Main execution
try {
    # Show version info
    if (-not $Quiet) {
        Write-Banner "InsureOS 测试环境启动脚本 v1.0"
        
        Write-Host "项目路径：$PSScriptRoot/.." -ForegroundColor Gray
        Write-Host "运行时间：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
        Write-Host ""
    }

    if (-not $SkipCheck) {
        # ===== Step 1: Environment Check =====
        Write-Step "Checking system requirements..."
        
        # Check Node.js
        if (-not (Check-CommandExists "node")) {
            throw "❌ Node.js is not installed! Please install Node.js 18+ first."
        }
        $nodeVersion = & node -v
        Write-Success "Node.js detected: $nodeVersion"
        
        # Check pnpm
        if (-not (Check-CommandExists "pnpm")) {
            Write-Warn "pnpm not found, attempting to install globally..."
            npm install -g pnpm --quiet
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to install pnpm. Please install manually: npm install -g pnpm"
            }
            Write-Success "pnpm installed successfully"
        } else {
            $pnpmVersion = & pnpm -v
            Write-Success "pnpm detected: v$pnpmVersion"
        }
        
        # Check port availability
        Write-Step "Checking port availability..."
        $frontendPid = Get-PortUsage -Port 3001
        if ($frontendPid) {
            Write-Warn "Port 3001 is in use by PID: $frontendPid"
            $confirm = Read-Host "Do you want to terminate it? (y/n)"
            if ($confirm.ToLower() -eq 'y') {
                Stop-Process -Id $frontendPid -Force
                Write-Success "Process terminated"
            } else {
                throw "Port 3001 is still occupied. Please free the port and try again."
            }
        } else {
            Write-Success "Port 3001 is available"
        }
        
        $backendPid = Get-PortUsage -Port 8080
        if ($backendPid) {
            Write-Warn "Port 8080 is in use by PID: $backendPid"
            $confirm = Read-Host "Do you want to terminate it? (y/n)"
            if ($confirm.ToLower() -eq 'y') {
                Stop-Process -Id $backendPid -Force
                Write-Success "Process terminated"
            } else {
                throw "Port 8080 is still occupied. Please free the port and try again."
            }
        } else {
            Write-Success "Port 8080 is available"
        }
        
        Write-Success "System requirements checked"
        Write-Host ""
    }
    
    # ===== Step 2: Install Dependencies =====
    Write-Step "Installing project dependencies..."
    
    $platformDir = Join-Path $PSScriptRoot "..\insurance-platform"
    Set-Location $platformDir
    
    if (-not (Test-Path "node_modules") -or (Test-Path "node_modules" -Exclude .modules.txt)) {
        if ((Get-ChildItem "node_modules" | Measure-Object).Count -eq 0) {
            Write-Host "Running: pnpm install" -ForegroundColor Gray
            pnpm install
            
            if ($LASTEXITCODE -ne 0) {
                throw "Dependency installation failed. Please check network connection or try with mirror: pnpm config set registry https://registry.npmmirror.com"
            }
            Write-Success "Dependencies installed successfully"
        } else {
            Write-Success "Node modules already exist, skipping installation"
        }
    } else {
        Write-Success "Monorepo structure ready"
    }
    
    # ===== Step 3: Build Backend Service =====
    Write-Step "Building backend services..."
    
    $carrierServiceDir = Join-Path $platformDir "services\carrier-service"
    Set-Location $carrierServiceDir
    
    if (-not (Test-Path "dist") -or (Test-Path "dist" -Exclude main.js)) {
        Write-Host "Running: pnpm run build" -ForegroundColor Gray
        pnpm run build
        
        if ($LASTEXITCODE -ne 0) {
            throw "Backend build failed. Please check TypeScript errors."
        }
        Write-Success "Carrier Service compiled successfully"
    } else {
        Write-Success "Dist folder exists, skipping build"
    }
    
    # ===== Step 4: Start Services =====
    Write-Step "Starting development servers..."
    Write-Host ""
    
    # Prepare backend start command
    $backendArgs = @("-NoExit", "-Command", "cd '$carrierServiceDir'; Write-Host ''; Write-Host 'Backend Console - Carrier Service' -ForegroundColor Cyan; Write-Host 'Press Ctrl+C to stop service' -ForegroundColor Yellow; pnpm run dev")
    
    $backendProcess = Start-Process powershell -ArgumentList $backendArgs -PassThru -WindowStyle Normal
    
    if (-not $Quiet) {
        Write-Host "Backend process ID: $($backendProcess.Id)" -ForegroundColor Gray
        Write-Success "Carrier Service starting on http://localhost:8080"
        Write-Host ""
        Write-Host "Waiting for backend initialization (this may take ~$($BackendDelay)s)..." -ForegroundColor Gray
    }
    
    Start-Sleep -Seconds $BackendDelay
    
    # Prepare frontend start command
    $frontEndAdminDir = Join-Path $platformDir "apps\web-carrier-admin"
    $frontendArgs = @("-NoExit", "-Command", "cd '$frontEndAdminDir'; Write-Host '' ; Write-Host 'Frontend Console - web-carrier-admin' -ForegroundColor Cyan; Write-Host 'Press Ctrl+C to stop service' -ForegroundColor Yellow; pnpm run dev")
    
    $frontendProcess = Start-Process powershell -ArgumentList $frontendArgs -PassThru -WindowStyle Normal
    
    if (-not $Quiet) {
        Write-Host "Frontend process ID: $($frontendProcess.Id)" -ForegroundColor Gray
        Write-Success "Web admin panel starting on http://localhost:3001"
    }
    
    # ===== Step 5: Verification =====
    Write-Host ""
    Write-Step "Verifying service health..."
    
    $maxRetries = 10
    $retryCount = 0
    $backendReady = $false
    $frontendReady = $false
    
    while ($retryCount -lt $maxRetries -and (-not $backendReady -or -not $frontendReady)) {
        $retryCount++
        
        # Check backend
        if (-not $backendReady) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:8080/api/carrier" -TimeoutSec 3 -ErrorAction Stop
                $backendReady = $true
                Write-Success "Backend API responding (attempt $($retryCount))"
            } catch {
                Write-Host "." -NoNewline -ForegroundColor Gray
            }
        }
        
        # Check frontend (basic port check)
        if (-not $frontendReady) {
            $portStatus = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
            if ($portStatus) {
                $frontendReady = $true
                Write-Success "Frontend server started"
            }
        }
        
        Start-Sleep -Milliseconds 500
    }
    
    if (-not $backendReady) {
        Write-Warn "Backend may need more time to fully initialize"
    }
    
    if (-not $frontendReady) {
        throw "Frontend failed to start within timeout period"
    }
    
    # ===== Final Summary =====
    Write-Banner "✅ Test Environment Ready!"
    
    Write-Host "Access URLs:" -ForegroundColor Cyan
    Write-Host "  🌐 Frontend Application" -ForegroundColor White
    Write-Host "     → http://localhost:3001" -ForegroundColor Green
    Write-Host ""
    Write-Host "  🔧 Backend API" -ForegroundColor White
    Write-Host "     → http://localhost:8080" -ForegroundColor Green
    Write-Host ""
    Write-Host "Default Credentials:" -ForegroundColor Cyan
    Write-Host "  👤 Username: admin" -ForegroundColor White
    Write-Host "  🔑 Password: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "Processes Running:" -ForegroundColor Cyan
    Write-Host "  ✓ Backend Process ID: $($backendProcess.Id)" -ForegroundColor Gray
    Write-Host "  ✓ Frontend Process ID: $($frontendProcess.Id)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Management Commands:" -ForegroundColor Cyan
    Write-Host "  • Close all windows to stop services" -ForegroundColor Gray
    Write-Host "  • Or manually terminate processes via Task Manager" -ForegroundColor Gray
    Write-Host ""
    
    # Open browser automatically
    if (-not $Quiet) {
        Start-Process "http://localhost:3001"
        Write-Success "Browser opened automatically"
        Write-Host ""
    }
    
    Write-Host "=====================================" -ForegroundColor Gray
    Write-Host "Enjoy your development session! ☕" -ForegroundColor Gray
    Write-Host "=====================================" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Banner "❌ Startup Failed"
    
    $errorMsg = $_.Exception.Message
    Write-ErrorDetail $errorMsg
    
    Write-Host ""
    Write-Host "Troubleshooting suggestions:" -ForegroundColor Yellow
    Write-Host "  1. Verify Node.js and pnpm are installed correctly" -ForegroundColor Gray
    Write-Host "  2. Ensure ports 3001 and 8080 are not occupied" -ForegroundColor Gray
    Write-Host "  3. Try manual dependency installation: pnpm install" -ForegroundColor Gray
    Write-Host "  4. Check this document for detailed steps" -ForegroundColor Gray
    Write-Host ""
    
    exit 1
}
