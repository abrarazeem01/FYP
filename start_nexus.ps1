<#
.SYNOPSIS
    Nexus Sentinel — One-Click Unified Platform Launcher
.DESCRIPTION
    Validates configuration, starts the FastAPI unified server on port 8000
    (serving both API endpoints and the compiled React frontend), and launches the browser.
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Red
Write-Host "  NEXUS SENTINEL — ANTI-SMUGGLING & NCP VEHICLE INTELLIGENCE       " -ForegroundColor White
Write-Host "====================================================================" -ForegroundColor Red
Write-Host ""

# 1. Check Root .env
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "  Notice: .env not found. Creating from .env.example template..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
    } else {
        Write-Host "  Warning: Neither .env nor .env.example found. Ensure config is set." -ForegroundColor Yellow
    }
}

# 2. Check Frontend Production Build
if (-not (Test-Path "frontend\dist\index.html")) {
    Write-Host "  Building frontend production distribution..." -ForegroundColor Cyan
    Push-Location frontend
    & npm run build
    Pop-Location
}

# 3. Locate Python Executable (venv or system)
$pythonExe = "python"
if (Test-Path "venv\Scripts\python.exe") {
    $pythonExe = Join-Path (Get-Location) "venv\Scripts\python.exe"
    Write-Host "  ✓ Utilizing Python venv: $pythonExe" -ForegroundColor Green
} else {
    Write-Host "  ✓ Utilizing System Python: $(Get-Command python | Select-Object -ExpandProperty Source)" -ForegroundColor Yellow
}

# Set PYTHONPATH to project root for clean package imports
$env:PYTHONPATH = (Get-Location).Path

Write-Host "`n  Starting Unified Single-Port Server on http://localhost:8000 ..." -ForegroundColor Cyan
Write-Host "  - UI Dashboard: http://localhost:8000/" -ForegroundColor White
Write-Host "  - REST API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  - Live Forensics Engine: Ready" -ForegroundColor White
Write-Host "`n  Press Ctrl+C to terminate server.`n" -ForegroundColor DarkGray

# Launch browser after brief pause
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:8000"
} | Out-Null

# Launch Uvicorn
& $pythonExe -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
