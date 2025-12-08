@echo off
REM uninstall-service.bat - Uninstall Rembg web service from Task Scheduler

setlocal

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script requires administrator privileges. Please run as administrator.
    pause
    exit /b 1
)

set "SERVICE_NAME=RembgWebService"

echo Uninstalling service...
schtasks /delete /tn "%SERVICE_NAME%" /f

if %errorlevel% neq 0 (
    echo [ERROR] Failed to uninstall service. The service may not exist.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Service uninstalled successfully!
echo.
pause
