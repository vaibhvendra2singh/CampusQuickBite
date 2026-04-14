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
  <img src="https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express 5" />
  <img src="https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Three.js-3D-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
</p>

---

## 🚀 Overview

**CampusQuickBite** isn't just a food ordering app; it's a gamified ecosystem for university campuses. Built with a cutting-edge stack including **React 19**, **Tailwind v4**, and **Three.js**, it bridges the gap between hungry students and busy vendors with real-time sync, 3D immersion, and a deep secondary "hacker" meta-game.

---

## 🛠️ Cutting-Edge Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · TypeScript · Vite · **Tailwind CSS v4** |
| **3D & Animation** | **React Three Fiber** · Three.js · **Framer Motion** |
| **Backend** | Node.js · **Express 5** · TypeScript |
| **State & Real-time** | **Socket.IO** · React Context |
| **Cache** | **Redis** (circuit-breaker pattern, graceful fallback) |
| **Infrastructure** | **Supabase (PostgreSQL)** · Docker |
| **Push Notifications** | **Firebase Cloud Messaging** (FCM) · VAPID Web Push |
| **Security & Monitoring** | **Sentry** (Profiling + Error Tracking) · Helmet · Per-email Rate Limiting |
| **DevOps & CI/CD** | **GitHub Actions** · **Playwright** (E2E) · Swagger (API Docs) · Winston |

---

## 🏗️ Robust Engineering

### CI/CD Pipeline
Every push to `main` triggers a comprehensive **GitHub Actions** workflow:
- **Backend**: TypeScript compile check + Jest unit tests.
- **Frontend**: Vite production build verification.
- **E2E**: Automated **Playwright** smoke tests to ensure critical paths (login/order) are never broken.

### Reliability & Security Hardening (April 2026)
A comprehensive audit of the codebase resulted in the following hardening improvements:

| # | Area | Fix |
|---|---|---|
| 1 | **Rate Limiting** | Register limiter now keys on **email** (not shared IP) — campus NAT no longer blocks mass sign-ups |
| 2 | **CORS Policy** | Local-IP regex gated to `NODE_ENV !== 'production'` — internal IPs cannot bypass CORS in prod |
| 3 | **Transactional Integrity** | Outlet creation now **rolls back the owner account** if the outlet INSERT fails — no more orphaned users |
| 4 | **Cache Invalidation** | Outlet status updates use `cacheDelPattern('outlet:*')` — all derived keys invalidated atomically |
| 5 | **Admin UI** | Select-All checkbox correctly excludes the logged-in admin (self) from bulk-action count |
| 6 | **Performance** | Admin dashboard 30-second polling reduced from **O(2N) requests → O(1)** per tick (N+1 fix) |
| 7 | **Memory Safety** | Cyberpunk audio engine uses `useRef` for AudioContext/interval — eliminates stacked audio on re-render |
| 8 | **Secret Management** | Firebase credentials moved out of source code entirely; injected at **build-time** from `.env` via a custom Vite plugin |

---

## 🔐 Secret Management

Firebase configuration (API keys, sender IDs, app IDs) is **never stored in source code**.

- `frontend/public/firebase-messaging-sw.js` contains `__PLACEHOLDER__` tokens in the repo.
- A custom **`inject-sw-env` Vite plugin** (`vite.config.ts`) replaces them with real values from `.env` at:
  - **Dev time**: via a dev-server middleware intercept.
  - **Build time**: via a `closeBundle` hook post-processing `dist/firebase-messaging-sw.js`.

> **For local setup:** Copy `.env.example` → `.env` and fill in your `VITE_FIREBASE_*` values from your Firebase Console.

---

## 🎮 Features That Wow

### 🎓 Student Ecosystem
- **Instant Ordering**: Browse vibrant, high-performance menus with advanced filtering.
- **3D Immersion**: Interactive UI elements powered by Three.js for a premium feel.
- **Real-Time Tracking**: Live order status via Socket.IO — no page refreshes needed.
- **Push Notifications**: FCM-powered background notifications with VAPID web push.
- **QR Pickup**: Secure, verified pickup with generated QR codes & downloadable receipts.
- **PWA Ready**: Installable on mobile with full offline-banner support.

### 🏆 The Gamification Engine
- **XP & Tier System**: Earn XP for every order. Rank up from **Bronze** to the legendary **Electric Blue**.
- **Elite Leaderboard**: Compete with fellow students to be the campus "Top Foodie".
- **Achievement Badges**:
  - 👾 **Shadow Member**: Unlock the hidden hacker terminal.
  - ☕ **Caffeine Addict**: Find the secret link in the ToS.
  - 🌙 **Night Owl**: Order during the witching hours for rare rewards.
  - 🕹️ **Arcade King**: Click the hidden trigger in the footer.
  - 💻 **The Hacker**: Activate Cyberpunk Mode.

### 🕹️ The Game Hub (Mini-OS)
Need to kill time? While waiting for your order, open the **Multi-Tasking Game Hub**.
- Play **Snake**, **2048**, **Flappy Bird**, **Breakout**, **Memory Game**, and more in movable, floating windows.
- Run multiple games simultaneously in a "Mini-OS" environment.

### 🏪 Shop Owner & Admin Suite
- **Live Kitchen Display**: Manage incoming orders with a zero-latency interface.
- **Menu Architect**: CRUD operations with instant availability toggles.
- **Revenue Analytics**: Deep-dive into sales data with interactive **Recharts**.
- **QR Scanner**: Integrated scanner for lightning-fast order verification.
- **Admin Console**: Full user directory with bulk actions (ban/freeze), announcement broadcasts, review moderation, and DB nuke (with audio drama).

---

## 🕵️ Hidden Layers (Easter Eggs)

CampusQuickBite hides a dark-themed secret world:
1. **The Hacker Terminal**: Type `/secret` in the URL or find the portal in the footer.
2. **Cyberpunk Mode**: A developer secret transforms the entire UI with glitch effects and synthesized audio.
3. **Badge Hints**: Double-click your avatar or visit `/hints` for a cryptic guide to hidden achievements.

---

## 🛠️ Project Structure

```bash
CampusQuickBite/
├── frontend/                   # React 19 + Tailwind v4 + Three.js
│   ├── public/
│   │   └── firebase-messaging-sw.js   # SW template — secrets injected at build
│   └── src/
│       ├── pages/              # student / owner / admin / public views
│       ├── components/         # shared + game hub components
│       ├── hooks/              # context (Auth, Cart, Toast, Socket…)
│       └── firebase/           # FCM config (reads from .env)
├── backend/                    # Express 5 + Socket.IO + Sentry
│   └── src/
│       ├── controllers/        # auth, outlet, order, menu, users…
│       ├── services/           # cacheService (Redis), emailService, fcmService
│       ├── middleware/         # auth, errorHandler, rate limiters
│       └── routes/v1/          # versioned API routes
├── database/                   # Supabase Migrations & Seed Data
├── certs/                      # SSL certificates for dev HTTPS
├── docker-compose.yml          # Full-stack container orchestration
├── start.sh                    # Magic launcher (cleans ports + gen secrets)
└── bootstrap.sh                # Initial environment setup wizard
```

---

## 🚦 Getting Started

### 1. Configure Environment
```bash
cp .env.example .env
# Fill in your Supabase, Firebase, VAPID, and email credentials
```

### 2. One-Step Launch
```bash
sh ./start.sh
```
This script will:
- Check for Node.js & Docker.
- Automatically generate secure `JWT_SECRET` and `JWT_REFRESH_SECRET` if missing.
- Sync `.env` to both `frontend/` and `backend/`.
- Clear stale ports (5001, 5173, 3000).
- Launch both Backend and Frontend in parallel.

### 3. Manual Setup
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (in a separate terminal)
cd frontend && npm install && npm run dev
```
- **API Docs**: `http://localhost:5001/api/docs`
- **App**: `http://localhost:5173`

---

## 🛡️ API & Security

| Service | Endpoint | Description |
|---|---|---|
| **Authentication** | `/api/v1/auth/*` | JWT Login · Register · OTP · Google OAuth |
| **Outlets** | `/api/v1/outlets/*` | CRUD + status management (Owner/Admin) |
| **Menu** | `/api/v1/menu/*` | Menu items with Redis-cached responses |
| **Orders** | `/api/v1/orders/*` | Place · Track · Receipt · Admin ledger |
| **Analytics** | `/api/v1/analytics` | Owner-only revenue & heatmap insights |
| **Push** | `/api/v1/push/*` | FCM token registration & broadcast |
| **API Docs** | `/api/docs` | Interactive Swagger/OpenAPI |
| **Health** | `/health` | Uptime & system monitoring |

**Security First:**
- **Per-Email Rate Limiting**: Registration throttled per registrant, not per shared IP — campus NAT safe.
- **Production CORS**: Local-IP bypass only active in development mode.
- **Sentry Guarded**: Real-time error profiling and performance tracking.
- **Secrets via Env**: No credentials in source; Firebase config injected at build time.

---

## 📜 License
MIT © CampusQuickBite Team
