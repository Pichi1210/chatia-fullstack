$ErrorActionPreference = "Continue"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$LogPath = Join-Path $ProjectRoot "docker-setup.log"

Start-Transcript -Path $LogPath -Force

Write-Host "== Docker Desktop setup started =="
Write-Host "User: $(whoami)"
Write-Host "Is elevated: $(([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))"

Write-Host "== Enabling Windows features =="
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

Write-Host "== WSL status before Docker install =="
wsl.exe --status
wsl.exe --set-default-version 2

Write-Host "== Repairing winget sources =="
winget source reset --force
winget source update
winget source list

$InstallerCandidates = @(
    "C:\Users\Trabajo\AppData\Local\Temp\WinGet\Docker.DockerDesktop.4.71.0\Docker%20Desktop%20Installer.exe",
    (Join-Path $env:LOCALAPPDATA "Temp\WinGet\Docker.DockerDesktop.4.71.0\Docker%20Desktop%20Installer.exe")
)
$Installer = $InstallerCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $Installer) {
    Write-Host "Installer not found in winget cache. Trying winget install."
    winget install -e --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
} else {
    Write-Host "Using cached installer: $Installer"
    & $Installer install --quiet --accept-license --backend=wsl-2
    Write-Host "Installer exit code: $LASTEXITCODE"
}

Write-Host "== Docker checks =="
Test-Path "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Get-Service *docker* -ErrorAction SilentlyContinue | Select-Object Name, Status, StartType
Get-Command docker -ErrorAction SilentlyContinue

Write-Host "== Docker Desktop setup finished =="
Stop-Transcript
