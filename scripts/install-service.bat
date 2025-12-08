@echo off
REM install-service.bat - Install Rembg web service using Task Scheduler
REM This batch version uses cmd.exe which has a stable path across Windows versions

setlocal enabledelayedexpansion

REM Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] This script requires administrator privileges. Please run as administrator.
    pause
    exit /b 1
)

REM Get the directory of this script
set "SCRIPT_DIR=%~dp0"
REM Remove trailing backslash
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

set "SERVICE_NAME=RembgWebService"
set "RUN_SCRIPT=%SCRIPT_DIR%\run-rembg-service.bat"

REM Verify the run script exists
if not exist "%RUN_SCRIPT%" (
    echo [ERROR] run-rembg-service.bat not found at %RUN_SCRIPT%
    pause
    exit /b 1
)

REM Get the current username for task principal
for /f "tokens=*" %%u in ('whoami') do set "CURRENT_USER=%%u"

REM Delete existing task if it exists (suppress errors)
schtasks /delete /tn "%SERVICE_NAME%" /f >nul 2>&1

REM Create the scheduled task
REM Using cmd.exe which has a stable path: C:\Windows\System32\cmd.exe
echo Installing service...
schtasks /create ^
    /tn "%SERVICE_NAME%" ^
    /tr "cmd.exe /c \"\"%RUN_SCRIPT%\"\"" ^
    /sc onstart ^
    /ru "%CURRENT_USER%" ^
    /rl highest ^
    /f

if %errorlevel% neq 0 (
    echo [ERROR] Failed to create scheduled task
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Service installed successfully!
echo.
echo The Rembg web interface will start automatically on system startup.
echo Access the service at: http://localhost:5000
echo.
echo You can also start/stop it manually from Task Scheduler.
echo.
pause
