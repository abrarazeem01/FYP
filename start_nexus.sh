#!/usr/bin/env bash
# ==============================================================================
# NEXUS SENTINEL — Unix / macOS One-Click Unified Platform Launcher
# ==============================================================================

set -e

echo ""
echo "===================================================================="
echo "  NEXUS SENTINEL — ANTI-SMUGGLING & NCP VEHICLE INTELLIGENCE       "
echo "===================================================================="
echo ""

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "Creating .env from .env.example template..."
    cp .env.example .env
fi

if [ ! -f "frontend/dist/index.html" ]; then
    echo "Building frontend distribution..."
    cd frontend && npm run build && cd ..
fi

PYTHON_BIN="python3"
if [ -f "venv/bin/python" ]; then
    PYTHON_BIN="venv/bin/python"
    echo "✓ Using venv: $PYTHON_BIN"
fi

export PYTHONPATH="$(pwd)"

echo "Starting Unified Single-Port Server on http://localhost:8000 ..."
echo "- UI Dashboard: http://localhost:8000/"
echo "- REST API Docs: http://localhost:8000/docs"
echo ""

(sleep 2 && (xdg-open "http://localhost:8000" || open "http://localhost:8000" || true)) &

$PYTHON_BIN -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
