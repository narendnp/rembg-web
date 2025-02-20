$ErrorActionPreference = "Stop"

# Get the directory of this script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Change to the script directory
Set-Location $scriptPath

# Get Python executable path from the registry
$pythonPath = (Get-ItemProperty -Path 'HKLM:\SOFTWARE\Python\PythonCore\*\InstallPath' -ErrorAction SilentlyContinue).ExecutablePath
if (-not $pythonPath) {
    $pythonPath = (Get-ItemProperty -Path 'HKCU:\SOFTWARE\Python\PythonCore\*\InstallPath' -ErrorAction SilentlyContinue).ExecutablePath
}

# Replace python.exe with pythonw.exe for no-console execution
$pythonwPath = $pythonPath -replace "python\.exe$", "pythonw.exe"

# Start the Flask app
& $pythonwPath "app.py"
