/**
 * Unit Tests: Payment Route
 *
 * Tests the mock payment endpoint for:
 * - Missing fields
 * - IDOR (paying for someone else's order)
 * - Duplicate payment prevention
 * - Amount mismatch / price forgery
 * - Successful payment
 */

import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

// ─── Mocks ───────────────────────────────────────────────────────────────────
const mockSingle = jest.fn();
const mockFrom = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: mockSingle,
}));

jest.mock('../src/config/supabase', () => ({
    supabase: { from: mockFrom },
}));

jest.mock('../src/middleware/auth', () => ({
    authenticateUser: (req: Request, _res: Response, next: NextFunction) => {
        (req as any).user = { id: 'student-1', role: 'student' };
        next();
    },
    requireRole: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock('../src/models/schemas', () => ({
    paymentSchema: {
        safeParse: () => ({ success: true }),
    },
}));

jest.mock('../src/middleware/validate', () => ({
    validate: () => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

process.env.JWT_SECRET = 'test-secret-at-least-32-chars-long';

import paymentRoutes from '../src/routes/paymentRoutes';

// ─── Build Test App ───────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/api/v1/payments', paymentRoutes);

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Payment Route POST /api/v1/payments', () => {
    beforeEach(() => jest.clearAllMocks());

    test('returns 400 when orderId is missing', async () => {
        const res = await request(app)
            .post('/api/v1/payments')
            .send({ amount: 150, paymentMethod: 'card' });

        expect(res.status).toBe(400);
    });

    test('returns 404 when order does not exist', async () => {
        mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

        const res = await request(app)
            .post('/api/v1/payments')
            .send({ orderId: 99999, amount: 150, paymentMethod: 'card' });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Order not found');
    });

    test('returns 403 when paying for another user\'s order (IDOR)', async () => {
        mockSingle.mockResolvedValueOnce({
            data: { user_id: 'different-student', total_amount: '150.00', payment_status: 'pending' },
            error: null,
        });

        const res = await request(app)
            .post('/api/v1/payments')
            .send({ orderId: 1, amount: 150, paymentMethod: 'card' });

        expect(res.status).toBe(403);
        expect(res.body.error).toMatch(/cannot pay for someone else/i);
    });

    test('returns 400 when order is already paid', async () => {
        mockSingle.mockResolvedValueOnce({
            data: { user_id: 'student-1', total_amount: '150.00', payment_status: 'paid' },
            error: null,
        });

        const res = await request(app)
            .post('/api/v1/payments')
            .send({ orderId: 1, amount: 150, paymentMethod: 'card' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/already paid/i);
    });

    test('returns 400 when amount does not match DB total (price forgery)', async () => {
        mockSingle.mockResolvedValueOnce({
            data: { user_id: 'student-1', total_amount: '150.00', payment_status: 'pending' },
            error: null,
        });

        const res = await request(app)
            .post('/api/v1/payments')
            .send({ orderId: 1, amount: 1.00, paymentMethod: 'card' }); // forged lower amount

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/amount mismatch/i);
    });

    test('returns 200 on a successful payment', async () => {
        // order lookup
        mockSingle.mockResolvedValueOnce({
            data: { user_id: 'student-1', total_amount: '150.00', payment_status: 'pending' },
            error: null,
        });
        // update().eq() — return no error
        mockFrom.mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
            }),
            single: mockSingle,
        });

        const res = await request(app)
            .post('/api/v1/payments')
            .send({ orderId: 1, amount: 150, paymentMethod: 'cash' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.transactionId).toMatch(/^TXN-REM-/);
    });
});
