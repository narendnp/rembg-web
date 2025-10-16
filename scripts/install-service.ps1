$ErrorActionPreference = "Stop"

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "This script requires administrator privileges. Please run as administrator." -ForegroundColor Red
    exit 1
}

# Get the directory of this script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$serviceName = "RembgWebService"
$scriptFullPath = Join-Path $scriptPath "run-rembg-service.ps1"

# Verify the run script exists
if (-not (Test-Path $scriptFullPath)) {
    Write-Host "Error: run-rembg-service.ps1 not found at $scriptFullPath" -ForegroundColor Red
    exit 1
}

# Determine which PowerShell to use (prefer pwsh if available, fallback to powershell)
$pwshCommand = Get-Command pwsh -ErrorAction SilentlyContinue
if ($pwshCommand) {
    $psPath = $pwshCommand.Source
} else {
    $psPath = "powershell.exe"
}

# Create the task action
$action = New-ScheduledTaskAction `
    -Execute $psPath `
    -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptFullPath`""

# Create the task trigger (at system startup)
$trigger = New-ScheduledTaskTrigger -AtStartup

# Set the task settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable

# Get the current user for task principal
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

# Create the task principal
$principal = New-ScheduledTaskPrincipal `
    -UserId $currentUser `
    -LogonType S4U `
    -RunLevel Highest

# Register the task
Register-ScheduledTask `
    -TaskName $serviceName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Runs the Rembg web interface on system startup (localhost:5000)" `
    -Force

Write-Host "Service installed successfully. The Rembg web interface will start automatically on system startup." -ForegroundColor Green
Write-Host "Access the service at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "You can also start/stop it manually from Task Scheduler." -ForegroundColor Gray
