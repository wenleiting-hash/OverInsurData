# PowerShell Process Management Script
# Use: .\manage-processes.ps1 -Action start|stop|status [-Port 8080]

param(
    [ValidateSet('start','stop','status')]
    [string]$Action = 'status',
    [int]$Port
)

$ErrorActionPreference = 'Stop'

function Show-Help {
    Write-Host "`n=== InsureOS Process Manager ===" -ForegroundColor Cyan
    Write-Host "Usage: .\manage-processes.ps1 -Action <start|stop|status>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Yellow
    Write-Host "  start   - Start all services (backend + frontend)" -ForegroundColor White
    Write-Host "  stop    - Stop all Node.js processes" -ForegroundColor White
    Write-Host "  status  - Show running processes and ports" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\manage-processes.ps1 -Action start" -ForegroundColor Gray
    Write-Host "  .\manage-processes.ps1 -Action stop" -ForegroundColor Gray
    Write-Host "  .\manage-processes.ps1 -Action status" -ForegroundColor Gray
}

function Get-ProcessStatus {
    Write-Host "`n=== Running Node Processes ===" -ForegroundColor Cyan
    $nodes = Get-Process node -ErrorAction SilentlyContinue
    
    if ($nodes.Count -eq 0) {
        Write-Host "No Node.js processes running." -ForegroundColor Green
    } else {
        $nodes | ForEach-Object {
            $pid = $_.Id
            $startTime = $_.StartTime
            Write-Host "PID: $pid | Started: $startTime" -ForegroundColor White
        }
    }
    
    if ($Port) {
        Write-Host "`n=== Port $Port Status ===" -ForegroundColor Cyan
        try {
            $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction Stop
            $processId = $connection.OwningProcess
            $proc = Get-Process -Id $processId -ErrorAction Stop
            Write-Host "Port $Port is IN USE by PID: $processId ($($proc.ProcessName))" -ForegroundColor Red
        } catch {
            Write-Host "Port $Port is FREE" -ForegroundColor Green
        }
    }
}

function Stop-AllServices {
    Write-Host "`n=== Stopping All Services ===" -ForegroundColor Yellow
    
    # Stop Node.js processes
    $nodes = Get-Process node -ErrorAction SilentlyContinue
    if ($nodes.Count -gt 0) {
        Write-Host "Found $($nodes.Count) Node.js process(es), stopping..." -ForegroundColor White
        $nodes | Stop-Process -Force
        
        # Wait for processes to terminate
        Start-Sleep -Seconds 3
        
        # Verify stopped
        $remaining = Get-Process node -ErrorAction SilentlyContinue
        if ($remaining.Count -gt 0) {
            Write-Host "Warning: $($remaining.Count) process(es) could not be stopped!" -ForegroundColor Red
        } else {
            Write-Host "All Node.js processes stopped successfully." -ForegroundColor Green
        }
    } else {
        Write-Host "No Node.js processes to stop." -ForegroundColor Gray
    }
}

function Start-AllServices {
    Write-Host "`n=== Starting Services ===" -ForegroundColor Yellow
    
    # Check if services are already running
    $existingNode = Get-Process node -ErrorAction SilentlyContinue
    if ($existingNode.Count -gt 0) {
        Write-Host "WARNING: Node.js processes are already running!" -ForegroundColor Red
        Write-Host "Please run 'stop' action first." -ForegroundColor Gray
        return
    }
    
    Write-Host "Starting backend service (Carrier Service on port 8080)..." -ForegroundColor Cyan
    $backendTask = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\insurance-platform\apps\carrier-service'; pnpm run dev" -PassThru
    
    Write-Host "Starting frontend service (Web Admin on port 3001)..." -ForegroundColor Cyan
    $frontendTask = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\insurance-platform\apps\web-carrier-admin'; pnpm run dev" -PassThru
    
    Write-Host "`n✅ Both services started in new terminal windows." -ForegroundColor Green
    Write-Host "Backend: http://localhost:8080" -ForegroundColor White
    Write-Host "Frontend: http://localhost:3001" -ForegroundColor White
}

# Main execution
switch ($Action) {
    'help' { Show-Help }
    'status' { Get-ProcessStatus }
    'stop' { Stop-AllServices }
    'start' { Start-AllServices }
}
