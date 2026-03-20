import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import logger from './services/logger';
import { errorHandler } from './middleware/errorHandler';

// Route modules
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

import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

const app = express();

if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
            new ProfilingIntegration(),
        ],
        tracesSampleRate: 1.0,
        profilesSampleRate: 1.0,
    });
    // Sentry request handler must be the first middleware
    app.use(Sentry.Handlers.requestHandler() as any);
}

app.set('trust proxy', 1); // For rate-limiting behind proxies

// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
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

const allowedOrigins = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    // Allow localhost and local network IPs (10.x.x.x, 192.168.x.x, 172.x.x.x)
    const isLocalIP = origin.match(/^https?:\/\/(127\.0\.0\.1|localhost|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/);
    
    if (isLocalIP) {
        return callback(null, true);
    }
    // Allow explicitly set FRONTEND_URL
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
        return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
};

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // allow cookies
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

// General auth limiter (verification, tokens, etc.)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // Relaxed for dev
    message: { error: 'Too many authentication attempts, please try again later.' },
});
app.use('/api/auth', authLimiter);

// Strictest limit for login to prevent brute force
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // Relaxed from 5 to prevent developer lockout
    message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
});
app.use('/api/auth/login', loginLimiter);

// Specific limiter for registration to prevent bot account creation
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 3, // Only 3 registrations per hour per IP
    message: { error: 'Account creation limit reached. Please try again later.' },
});
app.use('/api/auth/register', registerLimiter);

// Specific limiter for password resets
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { error: 'Too many password reset requests. Please check your email or try again later.' },
});
app.use('/api/auth/forgot-password', passwordResetLimiter);

// Heavy API limiter for resource-intensive operations (Receipts, Analytics)
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

// Swagger Docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount API routes (Versioned v1)
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

app.use('/api/v1', v1Router);

// Fallback for v0 (to avoid breaking old clients immediately)
app.use('/api', v1Router);

// Sentry error handler must be before any other error middleware
if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler() as any);
}

app.use(errorHandler);

export default app;
