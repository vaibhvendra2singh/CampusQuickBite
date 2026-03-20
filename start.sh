#!/bin/bash

# ============================================================
# CampusQuickBite — One-Click Startup Script (v5.1)
# ============================================================

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Get the ROOT directory (where the script is located)
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

clear
echo -e "${BLUE}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}║           🚀 CampusQuickBite Instant Starter             ║${NC}"
echo -e "${BLUE}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# 🛠️ Step 1: Cleanup Ports
# ------------------------------------------------------------
echo -ne "${YELLOW}[1/3]${NC} Cleaning up existing processes... "
lsof -ti:5001,3000,5173 | xargs kill -9 2>/dev/null || true
echo -e "${GREEN}✓ Done${NC}"

# 🛠️ Step 2: Environment Setup
# ------------------------------------------------------------
echo -ne "${YELLOW}[2/3]${NC} checking configuration... "
cd "$PROJECT_ROOT"
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
fi
if [ ! -f "backend/.env" ]; then
    cp .env backend/.env 2>/dev/null || true
fi
echo -e "${GREEN}✓ Ready${NC}"

# 🛠️ Step 3: Run (Auto-detect Mode)
# ------------------------------------------------------------
echo -e "${YELLOW}[3/3]${NC} Starting Services..."

# Check if Docker is available and running
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    echo -e "${BLUE}🐳 Docker detected! Launching containerized environment...${NC}"
    echo ""
    cd "$PROJECT_ROOT"
    docker compose up --build --remove-orphans
else
    echo -e "${YELLOW}⚠️ Docker not detected or not running.${NC}"
    echo -e "${BLUE}💻 Falling back to Local Node.js servers...${NC}"
    echo ""

    # Start Backend in background (using a subshell so we don't lose our place)
    echo -e "   → Starting Backend..."
    (cd "$PROJECT_ROOT/backend" && npm install --silent && npm run dev) &
    BACKEND_PID=$!

    # Start Frontend in foreground
    echo -e "   → Starting Frontend..."
    cd "$PROJECT_ROOT/frontend"
    npm install --silent
    
    # Final info message
    echo ""
    echo -e "${GREEN}${BOLD}✅ Project is launching!${NC}"
    echo -e "   🏠 http://localhost:5173"
    echo ""

    # Trap Ctrl+C to kill the backend too
    trap "echo ''; echo -e '${RED}Stopping...${NC}'; kill $BACKEND_PID 2>/dev/null; exit" INT
    
    npm run dev -- --host 0.0.0.0
fi
