#!/bin/bash

# ============================================================
# CampusQuickBite — Universal Setup & Launch Script
# ============================================================

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

clear
echo -e "${BLUE}${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}║           📦 CampusQuickBite Universal Setup             ║${NC}"
echo -e "${BLUE}${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# 🛠️ Step 1: Check Environment Files
# ------------------------------------------------------------
echo -e "${YELLOW}[1/4]${NC} Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}  ⚠ No .env file found in root.${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}  ✓ Created .env from .env.example${NC}"
    fi
fi

if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}  ✓ Created backend/.env from example${NC}"
    else
        # Copy root .env to backend if it exists
        cp .env backend/.env 2>/dev/null
    fi
fi
echo -e "${GREEN}✓ Environment configuration ready.${NC}"

# 🛠️ Step 2: Check Requirements
# ------------------------------------------------------------
echo -e "${YELLOW}[2/4]${NC} checking dependencies..."
HAS_DOCKER=false
HAS_NODE=false

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    HAS_DOCKER=true
    echo -e "${GREEN}  ✓ Docker is installed and running.${NC}"
else
    echo -e "${RED}  ✗ Docker is not running or not installed.${NC}"
fi

if command -v node >/dev/null 2>&1; then
    HAS_NODE=true
    NODE_VER=$(node -v)
    echo -e "${GREEN}  ✓ Node.js is installed ($NODE_VER).${NC}"
else
    echo -e "${RED}  ✗ Node.js is not installed.${NC}"
fi

# 🛠️ Step 3: Choose Launch Mode
# ------------------------------------------------------------
echo ""
echo -e "${BLUE}${BOLD}HOW DO YOU WANT TO RUN THE PROJECT?${NC}"
echo "------------------------------------------------------------"

if [ "$HAS_DOCKER" = true ]; then
    echo -e "${BOLD}1) Docker Mode (Recommended) —${NC} Runs everything in containers."
    echo "   (Includes database proxy, Redis cache, and pre-configured Nginx)"
fi

if [ "$HAS_NODE" = true ]; then
    echo -e "${BOLD}2) Local Mode —${NC} Runs directly on your laptop using Node.js."
    echo "   (requires manual Redis installation for full features)"
fi

echo -e "3) Install Node.js (via Homebrew)"
echo "4) Exit"
echo ""

read -p "Enter your choice (1-4): " CHOICE

case $CHOICE in
    1)
        if [ "$HAS_DOCKER" = false ]; then
            echo -e "${RED}Error: Docker is required for this mode.${NC}"
            exit 1
        fi
        echo -e "${BLUE}Launching with Docker Compose...${NC}"
        docker compose up --build
        ;;
    2)
        if [ "$HAS_NODE" = false ]; then
            echo -e "${RED}Error: Node.js is required for this mode.${NC}"
            exit 1
        fi
        echo -e "${BLUE}Launching Local Dev Servers...${NC}"
        ./start.sh
        ;;
    3)
        echo -e "${YELLOW}Installing Node.js...${NC}"
        if command -v brew >/dev/null 2>&1; then
            brew install node
        else
            echo -e "${RED}Please install Homebrew first from https://brew.sh${NC}"
        fi
        ;;
    *)
        echo "Exiting..."
        exit 0
        ;;
esac
