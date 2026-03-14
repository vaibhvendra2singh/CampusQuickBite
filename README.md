<p align="center">
  <strong>🍔 CampusBite</strong><br/>
  <em>Skip the queue. Order ahead. Eat on time.</em>
</p>

---

# CampusBite — Campus Food Ordering Platform

A full-stack food ordering system designed for university campuses. Students browse vendor menus, place orders online, and pick up with a QR code — no waiting in line. Shop owners manage menus, track orders in real-time, and view sales analytics. Admins have full platform oversight.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · TypeScript · Tailwind CSS v4 · Vite |
| **Backend** | Node.js · Express 5 · TypeScript |
| **Database** | PostgreSQL (via Supabase) |
| **Real-time** | Socket.IO |
| **Auth** | JWT + bcrypt password hashing |
| **Charts** | Recharts |
| **QR Codes** | qrcode.react + html5-qrcode (scanner) |

## Features

### 🎓 Student Panel
- Browse campus food outlets and menus
- Advanced search & filtering (veg/non-veg, price, rating)
- Add to cart, schedule pickup, add order notes
- Real-time order tracking with live status updates
- QR code for verified pickup
- Downloadable receipt (PNG)
- Order history with ratings
- Gamification — XP, tiers, and leaderboard

### 🏪 Shop Owner Panel
- Real-time order dashboard with status management
- Menu CRUD (add, edit, delete, toggle availability)
- QR scanner for order verification at pickup
- Sales analytics with revenue charts
- Order history with filters

### 🛡️ Admin Panel
- Platform-wide user and outlet management
- Global analytics and monitoring

## Project Structure

```
CampusBite/
├── frontend/                 # React + Vite SPA
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── hooks/            # Custom hooks + React contexts
│       ├── pages/            # Route-level page components
│       │   ├── student/      # Student views
│       │   ├── owner/        # Shop owner views
│       │   └── admin/        # Admin views
│       └── services/         # API client (Axios)
├── backend/                  # Express API server
│   └── src/
│       ├── config/           # Supabase client config
│       ├── controllers/      # Route handlers
│       ├── middleware/        # Auth, validation, errors
│       ├── models/           # Zod schemas
│       ├── routes/           # Express route definitions
│       └── services/         # Socket.IO, logger, cron jobs
├── database/                 # SQL migrations & seed data
└── start.sh                  # One-command dev launcher
```

## Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- A [Supabase](https://supabase.com) project with PostgreSQL

### 1. Clone the repository
```bash
git clone https://github.com/your-username/CampusBite.git
cd CampusBite
```

### 2. Set up environment variables
```bash
cp backend/.env.example backend/.env
# Edit .env with your Supabase URL, service role key, and JWT secret
```

### 3. Install dependencies
```bash
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 4. Initialize the database
Run `database/migrations/init.sql` and subsequent migration scripts from `database/migrations/`.

### 5. Start development servers
```bash
./start.sh
```
This launches:
- **Backend** → `http://localhost:5001`
- **Frontend** → `http://localhost:5173`

## Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `PORT` | Backend server port (default: `5001`) |

## API Routes Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/outlets` | List all outlets |
| GET | `/api/menu/:outletId` | Get menu for outlet |
| POST | `/api/orders` | Place a new order |
| PUT | `/api/orders/:id/status` | Update order status |
| POST | `/api/payments` | Process payment |
| POST | `/api/ratings` | Submit item rating |
| GET | `/api/analytics/:outletId` | Owner analytics |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (frontend or backend) |
| `npm run build` | Production build |
| `npm run lint` | ESLint check (frontend) |
| `./start.sh` | Launch full stack in dev mode |

## License

MIT
