import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import logger from './services/logger';
import { errorHandler } from './middleware/errorHandler';
import { initFCM } from './services/fcmService';

initFCM();

import authRoutes from './routes/v1/authRoutes';
import menuRoutes from './routes/v1/menuRoutes';
import cartRoutes from './routes/v1/cartRoutes';
import orderRoutes from './routes/v1/orderRoutes';
import outletRoutes from './routes/v1/outletRoutes';
import paymentRoutes from './routes/v1/paymentRoutes';
import ratingRoutes from './routes/v1/ratingRoutes';
import analyticsRoutes from './routes/v1/analyticsRoutes';
import usersRoutes from './routes/v1/usersRoutes';
import ownerRoutes from './routes/v1/ownerRoutes';
import announcementRoutes from './routes/v1/announcementRoutes';
import pushRoutes from './routes/v1/pushRoutes';

import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

const app = express();
app.use(morgan('dev')); // Added for request logging
console.log('--- CAMPUS BITE BACKEND HEARTBEAT ---');

const allowedOrigins = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
        logger.info('[CORS] Allowing request with no origin');
        return callback(null, true);
    }
    
    // Allow common local development origins and common loopback IPs
    const allowed = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://127.0.2.2:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ];
    
    if (allowed.includes(origin)) {
        logger.info(`[CORS] Allowing specific origin: ${origin}`);
        return callback(null, true);
    }
    
    // BUG-006 FIX: Local-IP regex is only active in non-production environments.
    // In production, only explicit env-var origins are trusted.
    if (process.env.NODE_ENV !== 'production') {
        const isLocalIP = origin.match(/^https?:\/\/(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/);
        if (isLocalIP) {
            logger.info(`[CORS] Allowing local IP (dev only): ${origin}`);
            return callback(null, true);
        }
    }

    const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
    const corsOrigin = process.env.CORS_ORIGIN?.replace(/\/$/, '');
    const cleanOrigin = origin.replace(/\/$/, '');

    if ((frontendUrl && cleanOrigin === frontendUrl) || (corsOrigin && cleanOrigin === corsOrigin)) {
        logger.info(`[CORS] Allowing env-defined origin: ${origin}`);
        return callback(null, true);
    }
    
    logger.warn(`[CORS] Rejected origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
};

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // allow cookies
}));

if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
            new ProfilingIntegration(),
        ],
        tracesSampleRate: 1.0,
        profilesSampleRate: 1.0,
    });
    app.use(Sentry.Handlers.requestHandler() as any);
}

app.set('trust proxy', 1); // For rate-limiting behind proxies

if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        // Skip redirect for OPTIONS (CORS preflight) or if protocol is already https
        if (req.method === 'OPTIONS' || req.header('x-forwarded-proto') === 'https') {
            next();
        } else {
            res.redirect(`https://${req.header('host')}${req.url}`);
        }
    });
}

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "https:", "http:"],
        },
    },
    referrerPolicy: { policy: 'same-origin' }
}));

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // Relaxed for dev
    message: { error: 'Too many authentication attempts, please try again later.' },
});
app.use('/api/auth', authLimiter);

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // Relaxed from 5 to prevent developer lockout
    message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
});
app.use('/api/auth/login', loginLimiter);

// BUG-001 FIX: Key the limiter on the registrant's email (from request body),
// falling back to IP only if email is absent. This prevents shared campus NAT
// from blocking legitimate new users when the 3-per-hour cap is hit.
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5, // 5 registrations per unique email per hour
    keyGenerator: (req) => req.body?.email?.toLowerCase()?.trim() || req.ip || 'unknown',
    message: { error: 'Account creation limit reached. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth/register', registerLimiter);

const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { error: 'Too many password reset requests. Please check your email or try again later.' },
});
app.use('/api/auth/forgot-password', passwordResetLimiter);

const heavyApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Resource usage limit reached. Please try again in 15 minutes.' },
});
app.use('/api/orders/:id/receipt-image', heavyApiLimiter);
app.use('/api/analytics', heavyApiLimiter);

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const v1Router = express.Router();

v1Router.use('/auth', authRoutes);
v1Router.use('/outlets', outletRoutes);
v1Router.use('/menu', menuRoutes);
v1Router.use('/cart', cartRoutes);
v1Router.use('/orders', orderRoutes);
v1Router.use('/payments', paymentRoutes);
v1Router.use('/ratings', ratingRoutes);
v1Router.use('/analytics', analyticsRoutes);
v1Router.use('/users', usersRoutes);
v1Router.use('/owner', ownerRoutes);
v1Router.use('/announcements', announcementRoutes);
v1Router.use('/push', pushRoutes);

app.use('/api/v1', v1Router);

app.use('/api', v1Router);

if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler() as any);
}

app.use(errorHandler);

export default app;
