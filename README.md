<p align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/sandwich.svg" width="80" height="80" alt="CampusQuickBite Logo" />
</p>

<h1 align="center">🍔 CampusQuickBite</h1>

<p align="center">
  <strong>The Ultimate Campus Food Symphony.</strong><br/>
  <em>Skip the queue. Level up your appetite. Win the leaderboard.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind v4" />
  <img src="https://img.shields.io/badge/Node.js-5-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js 5" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Three.js-3D-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js" />
</p>

---

## 🚀 Overview

**CampusQuickBite** isn't just a food ordering app; it's a gamified ecosystem for university campuses. Built with a cutting-edge stack including **React 19**, **Tailwind v4**, and **Three.js**, it bridges the gap between hungry students and busy vendors with real-time sync, 3D immersion, and a deep secondary "hacker" meta-game.

## 🛠️ Cutting-Edge Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · TypeScript · Vite · **Tailwind CSS v4** |
| **3D & Animation** | **React Three Fiber** · Three.js · **Framer Motion** |
| **Backend** | Node.js · **Express 5** · TypeScript |
| **State & Real-time** | **Socket.IO** · React Context |
| **Infrastructure** | **Redis** · **Supabase (PostgreSQL)** · Docker |
| **Security & Monitoring** | **Sentry** (Profiling + Error Tracking) · Helmet · Rate Limiting |
| **DevOps & CI/CD** | **GitHub Actions** · **Playwright** (E2E) · Swagger (API Docs) · Winston |

---

## 🏗️ Robust Engineering

### CI/CD Pipeline
Every push to `main` triggers a comprehensive **GitHub Actions** workflow:
- **Backend**: TypeScript compile check + Jest unit tests.
- **Frontend**: Vite production build verification.
- **E2E**: Automated **Playwright** smoke tests to ensure critical paths (login/order) are never broken.

---

## 🎮 Features That Wow

### 🎓 Student Ecosystem
- **Instant Ordering**: Browse vibrant, high-performance menus with advanced filtering.
- **3D Immersion**: Interactive UI elements powered by Three.js for a premium feel.
- **Real-Time Tracking**: Live order status via Socket.IO — no page refreshes needed.
- **Push Notifications**: Stay updated even when the app is in the background.
- **QR Pickup**: Secure, verified pickup with generated QR codes & downloadable receipts.

### 🏆 The Gamification Engine
- **XP & Tier System**: Earn XP for every order. Rank up from **Bronze** to the legendary **Electric Blue**.
- **Elite Leaderboard**: Compete with fellow students to be the campus "Top Foodie".
- **Achievement Badges**: 
  - 👾 **Shadow Member**: Unlock the hidden hacker terminal.
  - ☕ **Caffeine Addict**: Find the secret link in the ToS.
  - 🌙 **Night Owl**: Order during the witching hours for rare rewards.

### 🕹️ The Game Hub (Mini-OS)
Need to kill time? While waiting for your order, open the **Multi-Tasking Game Hub**.
- Play **Snake**, **2048**, **Flappy Bird**, and more in movable, floating windows.
- Run multiple games simultaneously in a "Mini-OS" environment.

### 🏪 Shop Owner & Admin Suite
- **Live Dashboard**: Manage incoming orders with a zero-latency interface.
- **Menu Architect**: CRUD operations with instant availability toggles.
- **Revenue Analytics**: Deep-dive into sales data with interactive **Recharts**.
- **QR Scanner**: Integrated scanner for lightning-fast order verification.

---

## 🕵️ Hidden Layers (Easter Eggs)

CampusQuickBite hides a dark-themed secret world:
1. **The Hacker Terminal**: Type `/secret` in the URL or find the portal in the footer.
2. **Cyberpunk Mode**: A developer secret transforms the entire UI with glitch effects and synthesized audio.
3. **Area 51 Kitchen**: Search for "classified" to reveal the staff-only restricted menu.

---

## 🛠️ Project Structure

```bash
CampusQuickBite/
├── frontend/           # React 19 + Tailwind v4 + Three.js
├── backend/            # Express 5 + Socket.IO + Sentry
├── database/           # Supabase Migrations & Seed Data
├── certs/              # SSL certificates for dev
├── docker-compose.yml  # Full-stack container orchestration
├── start.sh            # The "Magic" launcher (cleans ports + gen secrets)
└── bootstrap.sh        # Initial environment setup
```

---

## 🚦 Getting Started

### 1. One-Step Launch
The easiest way to get started is our automated script:
```bash
sh ./start.sh
```
This script will:
- Check for Node.js & Docker.
- Automatically generate secure `JWT_SECRET` and `JWT_REFRESH_SECRET` if missing.
- Clear stale ports (5001, 5173, 3000).
- Launch both Backend and Frontend in parallel.

### 2. Manual Setup
Require manual control? 
- **Backend**: `cd backend && npm install && npm run dev`
- **Frontend**: `cd frontend && npm install && npm run dev`
- **API Docs**: Visit `http://localhost:5001/api/docs` once running.

---

## 🛡️ API & Security

| Service | Endpoint | Description |
|---|---|---|
| **Authenticaton** | `/api/v1/auth/*` | Secure JWT-based Login/Register |
| **API Docs** | `/api/docs` | Interactive Swagger/OpenAPI |
| **Health** | `/health` | Uptime & System monitoring |
| **Analytics** | `/api/v1/analytics` | Owner-only revenue insights |

**Security First:** 
- **Rate Limited**: Protects against brute-force (Login/Register/Heavy API).
- **Sentry Guarded**: Real-time error profiling and performance tracking.
- **CORS Restricted**: Locked down to authorized origins and local development IPs.

---

## 📜 License
MIT © CampusQuickBite Team
