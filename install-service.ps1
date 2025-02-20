$ErrorActionPreference = "Stop"

# Get the directory of this script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$serviceName = "RembgWebService"
$scriptFullPath = Join-Path $scriptPath "run-rembg-service.ps1"

# Create the task action
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
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
    -Description "Runs the Rembg web interface on system startup" `
    -Force

Write-Host "Service installed successfully. The Rembg web interface will start automatically on system startup."
Write-Host "You can also start it manually from Task Scheduler."
