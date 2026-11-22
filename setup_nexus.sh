#!/usr/bin/env bash
# ==============================================================================
# NEXUS SENTINEL — Unix / macOS Automated Environment Provisioner
# ==============================================================================

set -e

echo ""
echo "===================================================================="
echo "  NEXUS SENTINEL — SYSTEM PROVISIONING & SETUP WIZARD (UNIX/MACOS)  "
echo "===================================================================="
echo ""

# 1. Audit Prerequisites
echo "[1/6] Auditing runtime prerequisites..."
command -v python3 >/dev/null 2>&1 || { echo >&2 "Python 3 is required. Aborting."; exit 1; }
command -v node >/dev/null 2>&1 || { echo >&2 "Node.js is required. Aborting."; exit 1; }
echo "  ✓ Python: $(python3 --version)"
echo "  ✓ Node: $(node --version)"

# 2. Virtual Environment
echo ""
echo "[2/6] Configuring Python Virtual Environment (venv)..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "  ✓ Created new virtual environment in ./venv"
else
    echo "  ✓ Existing ./venv detected."
fi

source venv/bin/activate || true

# 3. Backend Requirements
echo ""
echo "[3/6] Installing backend dependencies from requirements.txt..."
pip install --upgrade pip --quiet
pip install -r backend/requirements.txt
echo "  ✓ Python dependencies installed."

# 4. Playwright Browser
echo ""
echo "[4/6] Provisioning Playwright Chromium browser..."
python3 -m playwright install chromium || echo "Playwright notice: run 'playwright install chromium' if browser download failed."

# 5. Environment Template
echo ""
echo "[5/6] Verifying environment configuration files..."
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    echo "  ✓ Created .env from template."
fi

if [ ! -f "frontend/.env" ] && [ -f "frontend/.env.example" ]; then
    cp frontend/.env.example frontend/.env
    echo "  ✓ Created frontend/.env from template."
fi

# 6. Frontend Build
echo ""
echo "[6/6] Installing frontend packages & compiling production distribution..."
cd frontend
npm install --legacy-peer-deps --quiet
npm run build
cd ..

echo ""
echo "===================================================================="
echo "  ✓ NEXUS SENTINEL SETUP COMPLETED SUCCESSFULLY!                    "
echo "===================================================================="
echo "  To launch the unified platform, execute:"
echo "    ./start_nexus.sh"
echo ""
