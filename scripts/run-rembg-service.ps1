$ErrorActionPreference = "Stop"

# Get the directory of this script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Change to the script directory
Set-Location $scriptPath

# Try to find Python in path
$pythonPath = Get-Command python -ErrorAction SilentlyContinue

if (-not $pythonPath) {
    # Get Python executable path from the registry
    $pythonPath = (Get-ItemProperty -Path 'HKLM:\SOFTWARE\Python\PythonCore\*\InstallPath' -ErrorAction SilentlyContinue).ExecutablePath
    if (-not $pythonPath) {
        $pythonPath = (Get-ItemProperty -Path 'HKCU:\SOFTWARE\Python\PythonCore\*\InstallPath' -ErrorAction SilentlyContinue).ExecutablePath
    }
}

if (-not $pythonPath) {
    Write-Error "Python is not found. Please install python and add it to PATH"
    exit 1
}

# Replace python.exe with pythonw.exe for no-console execution
$pythonwPath = $pythonPath.Source -replace "python\.exe$", "pythonw.exe"

# Start the Flask app
& $pythonwPath "app.py"
