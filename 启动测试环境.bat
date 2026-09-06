@echo off
chcp 65001 >nul
title InsureOS - Test Environment Starter

echo =====================================
echo   InsureOS 测试环境启动器 v1.0
echo =====================================
echo.

:: Check PowerShell execution policy
powershell -Command "Get-ExecutionPolicy -List | Select-String 'CurrentUser'" >nul 2>&1
if %errorlevel%==0 (
    powershell -Command "& { . '.\scripts\start-test-env.ps1' }"
) else (
    echo [Warning] PowerShell execution policy may restrict script execution
    echo          Running in bypass mode...
    echo.
    powershell -ExecutionPolicy Bypass -File "%~dp0\scripts\start-test-env.ps1"
)

echo.
echo =====================================
pause
