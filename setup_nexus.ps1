<#
.SYNOPSIS
    Nexus Sentinel — Windows PowerShell Automated Environment Provisioner
.DESCRIPTION
    Creates Python venv, installs requirements, provisions Playwright Chromium,
    installs frontend dependencies, and compiles the production distribution.
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Red
Write-Host "  NEXUS SENTINEL — SYSTEM PROVISIONING & SETUP WIZARD (WINDOWS)    " -ForegroundColor White
Write-Host "====================================================================" -ForegroundColor Red
Write-Host ""

# 1. Verify Prerequisites (Python & Node.js)
Write-Host "[1/6] Auditing runtime prerequisites..." -ForegroundColor Cyan
try {
    $pyVer = & python --version 2>&1
    Write-Host "  ✓ Found Python: $pyVer" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Python not found! Please install Python 3.10+ and add to PATH." -ForegroundColor Red
    exit 1
}

try {
    $nodeVer = & node --version 2>&1
    $npmVer = & npm --version 2>&1
    Write-Host "  ✓ Found Node.js: $nodeVer (npm $npmVer)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Node.js/npm not found! Please install Node.js 18+ and add to PATH." -ForegroundColor Red
    exit 1
}

# 2. Setup Python Virtual Environment
Write-Host "`n[2/6] Configuring Python Virtual Environment (venv)..." -ForegroundColor Cyan
if (-not (Test-Path "venv")) {
    Write-Host "  Creating new virtual environment in ./venv..." -ForegroundColor Yellow
    & python -m venv venv
} else {
    Write-Host "  Existing ./venv detected." -ForegroundColor Green
}

# Resolve venv python and pip executables
$venvPython = Join-Path (Get-Location) "venv\Scripts\python.exe"
$venvPip = Join-Path (Get-Location) "venv\Scripts\pip.exe"

if (-not (Test-Path $venvPython)) {
    # Fallback if standard venv structure differs
    $venvPython = "python"
    $venvPip = "pip"
}

# 3. Install Python Dependencies
Write-Host "`n[3/6] Installing backend dependencies from requirements.txt..." -ForegroundColor Cyan
& $venvPip install --upgrade pip --quiet
& $venvPip install -r backend/requirements.txt
Write-Host "  ✓ Python dependencies successfully installed." -ForegroundColor Green

# 4. Install Playwright Chromium Browser
Write-Host "`n[4/6] Provisioning Playwright Chromium headless/persistent browser..." -ForegroundColor Cyan
try {
    & $venvPython -m playwright install chromium
    Write-Host "  ✓ Playwright Chromium browser installed." -ForegroundColor Green
} catch {
    Write-Host "  ! Playwright browser installation warning: $_" -ForegroundColor Yellow
}

# 5. Environment Template Check
Write-Host "`n[5/6] Verifying environment configuration files..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "  ✓ Initialized .env from template. (Remember to add API keys!)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✓ Root .env file verified." -ForegroundColor Green
}

if (-not (Test-Path "frontend\.env")) {
    if (Test-Path "frontend\.env.example") {
        Copy-Item "frontend\.env.example" "frontend\.env"
        Write-Host "  ✓ Initialized frontend/.env from template." -ForegroundColor Green
    }
}

# 6. Install Frontend Dependencies & Compile Production Build
Write-Host "`n[6/6] Installing frontend packages & compiling production distribution..." -ForegroundColor Cyan
Push-Location frontend
try {
    & npm install --legacy-peer-deps --quiet
    & npm run build
    Write-Host "  ✓ Frontend compiled successfully into ./frontend/dist" -ForegroundColor Green
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Green
Write-Host "  ✓ NEXUS SENTINEL SETUP COMPLETED SUCCESSFULLY!                    " -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Green
Write-Host "  To launch the unified platform, execute:" -ForegroundColor White
Write-Host "    .\start_nexus.ps1" -ForegroundColor Yellow
Write-Host ""
