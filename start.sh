#!/bin/bash

# ==============================================
#  CampusQuickBite — One-Click Startup Script
# ==============================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Get the directory of this script so it works from anywhere
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo -e "${BLUE}${BOLD}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}║       🚀 CampusQuickBite Launcher v4.0        ║${NC}"
echo -e "${BLUE}${BOLD}╚═══════════════════════════════════════════════╝${NC}"
echo ""

# ---------------------------
# Step 1: Kill any old processes on ports 5001 / 5173
# ---------------------------
echo -e "${YELLOW}[1/3]${NC} Cleaning up old processes..."
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
echo -e "${GREEN}✓ Ports 5001 & 5173 are free${NC}"

# ---------------------------
# Step 2: Start Backend (Node.js)
# ---------------------------
echo -e "${YELLOW}[2/3]${NC} Starting Node.js Backend..."

cd "$SCRIPT_DIR/backend"
npm install --silent > /dev/null 2>&1

# Start backend in background
npm run dev &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend starting (PID: $BACKEND_PID)${NC}"

# Wait for backend to be ready
echo -ne "        ⏳ Waiting for backend"
MAX_WAIT=30
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
    if curl -s http://localhost:5001/health > /dev/null 2>&1; then
        break
    fi
    sleep 2
    ELAPSED=$((ELAPSED + 2))
    echo -ne "."
done
echo ""

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo -e "${RED}✗ Backend did not start in time. Check backend logs.${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi
echo -e "${GREEN}✓ Backend ready at http://localhost:5001${NC}"

# ---------------------------
# Step 3: Start Frontend
# ---------------------------
echo -e "${YELLOW}[3/3]${NC} Starting Frontend..."
cd "$SCRIPT_DIR/frontend"
npm install --silent > /dev/null 2>&1

echo ""
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  ✅ CampusQuickBite is LIVE!${NC}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 Frontend  →  ${BOLD}http://localhost:5173${NC}"
echo -e "  🔧 Backend   →  ${BOLD}http://localhost:5001/api${NC}"
echo -e "  ☁️  Database  →  ${BOLD}Supabase via Cloudflare Proxy ✅${NC}"
echo -e "  🔗 Proxy     →  ${BOLD}https://supabase-proxy.campusquickbite.workers.dev${NC}"
echo ""
echo -e "  ⚠️  ${YELLOW}If you were logged in before, please log out and log back in.${NC}"
echo -e "  Press ${RED}Ctrl+C${NC} to stop everything."
echo ""

# Trap Ctrl+C to also kill the backend
trap "echo ''; echo -e '${RED}Shutting down...${NC}'; kill $BACKEND_PID 2>/dev/null || true; exit" INT

npm run dev -- --host 0.0.0.0 "$@"
