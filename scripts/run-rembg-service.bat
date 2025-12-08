@echo off
REM run-rembg-service.bat - Run the Rembg web application
REM This script changes to the project root and starts the Flask app

setlocal

REM Get the script directory and navigate to project root (one level up)
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%.."

REM Check if Python is available
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is unavailable on PATH. Please install Python and add it to your PATH.
    exit /b 1
)

REM Use pythonw to run without console window (blocking)
REM If pythonw is not available, fall back to python
where pythonw >nul 2>&1
if %errorlevel% equ 0 (
    pythonw app.py
) else (
    python app.py
)

exit /b 0
