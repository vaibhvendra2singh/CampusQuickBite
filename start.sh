#!/bin/bash

# ─────────────────────────────────────────────────────────────
#  CampusQuickBite  ·  Start Script
# ─────────────────────────────────────────────────────────────

DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'
OK='\033[0;32m'
WARN='\033[0;33m'
ERR='\033[0;31m'
INFO='\033[0;37m'

step()  { echo -e "  ${BOLD}$1${NC}  ${DIM}$2${NC}"; }
ok()    { echo -e "  ${OK}✓${NC}  $1"; }
warn()  { echo -e "  ${WARN}!${NC}  $1"; }
fail()  { echo -e "  ${ERR}✗${NC}  $1"; }
sep()   { echo -e "${DIM}──────────────────────────────────────────${NC}"; }

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

clear

echo ""
echo -e "  ${BOLD}Campus Bites${NC}"
echo ""
sep
echo ""

# ── 1. Cleanup ───────────────────────────────────────────────
step "›" "Cleaning up stale processes on ports 5001, 3000, 5173..."
lsof -ti:5001,3000,5173 | xargs kill -9 2>/dev/null || true
ok "Ports cleared"

# ── 2. Environment ───────────────────────────────────────────
step "›" "Checking environment..."

cd "$PROJECT_ROOT"

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    ok ".env created from template"
fi

generate_token() {
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -hex 32
    else
        LC_ALL=C tr -dc 'a-f0-9' < /dev/urandom | head -c 64
    fi
}

if [ -f ".env" ]; then
    IS_DIRTY="your-refresh|change-me|your-secret"
    if ! grep -q "JWT_SECRET=" .env || grep -qE "JWT_SECRET=($IS_DIRTY)" .env; then
        sed -i.bak "/JWT_SECRET=/d" .env 2>/dev/null || sed -i "" "/JWT_SECRET=/d" .env
        echo "JWT_SECRET=$(generate_token)" >> .env
    fi
    if ! grep -q "JWT_REFRESH_SECRET=" .env || grep -qE "JWT_REFRESH_SECRET=($IS_DIRTY)" .env; then
        sed -i.bak "/JWT_REFRESH_SECRET=/d" .env 2>/dev/null || sed -i "" "/JWT_REFRESH_SECRET=/d" .env
        echo "JWT_REFRESH_SECRET=$(generate_token)" >> .env
    fi
    rm .env.bak 2>/dev/null
fi

cp .env backend/.env 2>/dev/null || true
ok "Secrets configured"

# ── 3. Runtime Check ─────────────────────────────────────────
step "›" "Checking runtime..."

HAS_DOCKER=false
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    HAS_DOCKER=true
    ok "Docker available"
else
    warn "Docker not available — running in local mode"
fi

if command -v node >/dev/null 2>&1; then
    ok "Node.js $(node -v)"
else
    fail "Node.js not found — please install it first"
    exit 1
fi

echo ""
sep
echo ""

# ── 4. Launch ────────────────────────────────────────────────
if [ "$HAS_DOCKER" = true ]; then
    step "›" "Starting with Docker Compose..."
    echo ""
    docker compose up --build --remove-orphans
else
    step "›" "Starting backend..."
    (cd "$PROJECT_ROOT/backend" && npm install --silent && npm run dev) &
    BACKEND_PID=$!

    echo -ne "  ${DIM}Waiting for backend${NC}"
    MAX_WAIT=30
    WAITED=0
    until lsof -i:5001 -sTCP:LISTEN -t >/dev/null 2>&1; do
        sleep 1
        WAITED=$((WAITED + 1))
        echo -ne "${DIM}.${NC}"
        if [ "$WAITED" -ge "$MAX_WAIT" ]; then
            echo ""
            fail "Backend did not start within ${MAX_WAIT}s — check logs above"
            kill $BACKEND_PID 2>/dev/null
            exit 1
        fi
    done
    echo -e " ${OK}ready${NC}"

    step "›" "Starting frontend..."
    cd "$PROJECT_ROOT/frontend"
    npm install --silent

    echo ""
    sep
    echo ""
    ok "App is running"
    echo ""
    echo -e "  ${DIM}Local     ${NC}${BOLD}http://localhost:5173${NC}"
    echo -e "  ${DIM}Network   ${NC}${BOLD}http://$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo 'your-ip'):5173${NC}"
    echo -e "  ${DIM}Stop      ${NC}${BOLD}Ctrl+C${NC}"
    echo ""

    trap "echo ''; sep; echo ''; warn 'Shutting down...'; kill $BACKEND_PID 2>/dev/null; echo ''; exit" INT

    npm run dev -- --host 0.0.0.0
fi
