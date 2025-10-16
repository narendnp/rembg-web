$ErrorActionPreference = "Stop"

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Split-Path -Parent $scriptPath)

try {
    $null = Get-Command python -ErrorAction Stop
    pythonw app.py
}
catch {
    Write-Host "Python is unavailable on PATH. Please install Python and add it to your PATH." -ForegroundColor Red
    exit 1
}
