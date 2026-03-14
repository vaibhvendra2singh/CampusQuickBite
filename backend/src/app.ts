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

app.use(helmet());

const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL, 'http://localhost:5173']
    : ['http://localhost:5173'];

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

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { error: 'Too many authentication attempts, please try again later.' },
});
app.use('/api/auth', authLimiter);

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
