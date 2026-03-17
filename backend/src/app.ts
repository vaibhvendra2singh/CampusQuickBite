import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import logger from './services/logger';
import { errorHandler } from './middleware/errorHandler';

// Route modules
import authRoutes from './routes/authRoutes';
import menuRoutes from './routes/menuRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';
import outletRoutes from './routes/outletRoutes';
import paymentRoutes from './routes/paymentRoutes';
import ratingRoutes from './routes/ratingRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import usersRoutes from './routes/usersRoutes';

import ownerRoutes from './routes/ownerRoutes';
import announcementRoutes from './routes/announcementRoutes';

const app = express();

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
    if (
        origin.includes('localhost') ||
        origin.match(/^https?:\/\/(10|192\.168|172\.(1[6-9]|2\d|3[01]))\.\d+\.\d+/)
    ) {
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
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10kb' }));

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

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/outlets', outletRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/announcements', announcementRoutes);

app.use(errorHandler);

export default app;
