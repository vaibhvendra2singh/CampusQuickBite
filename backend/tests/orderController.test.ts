/**
 * Unit Tests: orderController
 * 
 * Tests the core order lifecycle:
 * - createOrder (happy path, banned user, empty items)
 * - updateOrderStatus (valid transition, invalid transition, unauthorized)
 * - cancelOrder (happy path, wrong owner, wrong status)
 * - generateOrderToken (not ready, happy path)
 */

import { Response } from 'express';
import { AuthRequest } from '../src/middleware/auth';

// ─── Mocks ───────────────────────────────────────────────────────────────────
const mockSingle = jest.fn();
const mockMaybeSingle = jest.fn();
const mockRpc = jest.fn();

// A flexible from() mock that supports the full Supabase chaining API
const mockFrom = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
}));

jest.mock('../src/config/supabase', () => ({
    supabase: {
        from: mockFrom,
        rpc: mockRpc,
    },
}));

jest.mock('../src/services/socketService', () => ({
    notifyOrderUpdate: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock-order-token'),
    verify: jest.fn(),
}));

jest.mock('../src/services/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Stub canvas (native module not needed in tests)
jest.mock('canvas', () => ({
    createCanvas: jest.fn(() => ({
        getContext: jest.fn(() => ({ fillRect: jest.fn(), fillText: jest.fn(), measureText: jest.fn(() => ({ width: 0 })) })),
        toBuffer: jest.fn(() => Buffer.from('')),
    })),
}));

process.env.JWT_SECRET = 'test-secret-at-least-32-chars-long';

import {
    createOrder,
    updateOrderStatus,
    cancelOrder,
    generateOrderToken,
} from '../src/controllers/orderController';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const buildRes = (): Partial<Response> => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
    send: jest.fn(),
});

const buildReq = (body: object, params: object = {}, user: object = {}): Partial<AuthRequest> => ({
    body,
    params: params as any,
    query: {},
    user: { id: 'user-1', role: 'student', ...user } as any,
    ip: '127.0.0.1',
});

// ─── createOrder() ────────────────────────────────────────────────────────────
const resetMocks = () => {
    jest.clearAllMocks();
    // Clear queued mockResolvedValueOnce values
    mockSingle.mockReset();
    mockMaybeSingle.mockReset();
    mockRpc.mockReset();
    // Re-apply factory implementation
    mockFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: mockSingle,
        maybeSingle: mockMaybeSingle,
    }));
};

describe('OrderController.createOrder', () => {
    beforeEach(() => resetMocks());

    test('returns 400 when outletId is missing', async () => {
        // User check
        mockSingle.mockResolvedValueOnce({ data: { is_frozen: false, is_banned: false }, error: null });

        const req = buildReq({ items: [{ menuItemId: '1', quantity: 2 }] }); // no outletId
        const res = buildRes();
        await createOrder(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 403 when user is banned', async () => {
        mockSingle.mockResolvedValueOnce({ data: { is_frozen: false, is_banned: true }, error: null });

        const req = buildReq({ outletId: 'outlet-1', items: [{ menuItemId: '1', quantity: 2 }] });
        const res = buildRes();
        await createOrder(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'ACCOUNT_BANNED' }));
    });

    test('returns 403 when user is frozen', async () => {
        mockSingle.mockResolvedValueOnce({ data: { is_frozen: true, is_banned: false }, error: null });

        const req = buildReq({ outletId: 'outlet-1', items: [{ menuItemId: '1', quantity: 2 }] });
        const res = buildRes();
        await createOrder(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'ACCOUNT_FROZEN' }));
    });

    test('returns 400 when items array is empty', async () => {
        mockSingle.mockResolvedValueOnce({ data: { is_frozen: false, is_banned: false }, error: null });

        const req = buildReq({ outletId: 'outlet-1', items: [] });
        const res = buildRes();
        await createOrder(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Order must contain at least one item' }));
    });

    test('returns 500 when RPC fails', async () => {
        mockSingle.mockResolvedValueOnce({ data: { is_frozen: false, is_banned: false }, error: null });
        mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'DB failure' } });

        const req = buildReq({ outletId: 'outlet-1', items: [{ menuItemId: '1', quantity: 1 }] });
        const res = buildRes();
        await createOrder(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// ─── updateOrderStatus() ─────────────────────────────────────────────────────
describe('OrderController.updateOrderStatus', () => {
    beforeEach(() => resetMocks());

    const buildOwnerReq = (status: string, currentStatus = 'pending') =>
        buildReq({ status }, { id: 'order-1' }, { id: 'owner-1', role: 'SHOP_OWNER' });

    test('returns 400 when status is missing', async () => {
        const req = buildReq({}, { id: 'order-1' }, { role: 'owner' });
        const res = buildRes();
        await updateOrderStatus(req as AuthRequest, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 404 when order not found', async () => {
        mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

        const req = buildOwnerReq('preparing');
        const res = buildRes();
        await updateOrderStatus(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 403 when owner tries to update another outlet order', async () => {
        mockSingle.mockResolvedValueOnce({
            data: {
                status: 'pending', payment_status: 'paid',
                user_id: 'student-1', outlet_id: 'outlet-1',
                outlets: { owner_id: 'different-owner' }, // NOT owner-1
            },
            error: null,
        });

        // Mock for the re-fetch (required even if it should fail early, for safety in other tests)
        mockSingle.mockResolvedValue({ data: {}, error: null });

        const req = buildOwnerReq('preparing');
        const res = buildRes();
        await updateOrderStatus(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('returns 400 on invalid state transition', async () => {
        mockSingle.mockResolvedValueOnce({
            data: {
                status: 'completed', payment_status: 'paid',
                user_id: 'student-1', outlet_id: 'outlet-1',
                outlets: { owner_id: 'owner-1' },
            },
            error: null,
        });

        const req = buildOwnerReq('pending'); // can't go from completed -> pending
        const res = buildRes();
        await updateOrderStatus(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid state transition' }));
    });

    test('returns 400 when order is unpaid and trying to prepare', async () => {
        mockSingle.mockResolvedValueOnce({
            data: {
                status: 'pending', payment_status: 'unpaid',
                user_id: 'student-1', outlet_id: 'outlet-1',
                outlets: { owner_id: 'owner-1' },
            },
            error: null,
        });

        const req = buildOwnerReq('preparing');
        const res = buildRes();
        await updateOrderStatus(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Cannot process unpaid orders' }));
    });
});

// ─── cancelOrder() ───────────────────────────────────────────────────────────
describe('OrderController.cancelOrder', () => {
    beforeEach(() => resetMocks());

    test('returns 404 when order does not exist', async () => {
        mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

        const req = buildReq({}, { id: 'order-1' }, { id: 'owner-1', role: 'owner' });
        const res = buildRes();
        await cancelOrder(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 403 when owner does not own the outlet', async () => {
        mockSingle.mockResolvedValueOnce({
            data: { id: 'order-1', status: 'pending', payment_status: 'paid', outlets: { owner_id: 'other-owner' } },
            error: null,
        });

        const req = buildReq({}, { id: 'order-1' }, { id: 'owner-1', role: 'owner' });
        const res = buildRes();
        await cancelOrder(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('returns 400 when order is already completed', async () => {
        mockSingle.mockResolvedValueOnce({
            data: { id: 'order-1', status: 'completed', payment_status: 'paid', outlets: { owner_id: 'owner-1' } },
            error: null,
        });

        const req = buildReq({}, { id: 'order-1' }, { id: 'owner-1', role: 'owner' });
        const res = buildRes();
        await cancelOrder(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect((res.json as jest.Mock).mock.calls[0][0].error).toMatch(/cannot cancel/i);
    });
});

// ─── generateOrderToken() ─────────────────────────────────────────────────────
describe('OrderController.generateOrderToken', () => {
    beforeEach(() => resetMocks());

    test('returns 404 when order is not found', async () => {
        mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

        const req = buildReq({}, { id: 'order-1' }, { id: 'student-1', role: 'student' });
        const res = buildRes();
        await generateOrderToken(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 400 when order is not ready', async () => {
        mockSingle.mockResolvedValueOnce({ data: { id: 'order-1', status: 'preparing', user_id: 'student-1' }, error: null });

        const req = buildReq({}, { id: 'order-1' }, { id: 'student-1', role: 'student' });
        const res = buildRes();
        await generateOrderToken(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Order is not ready for pickup' }));
    });

    test('returns 200 with a JWT token when order is ready', async () => {
        mockSingle.mockResolvedValueOnce({ data: { id: 'order-1', status: 'ready', user_id: 'student-1' }, error: null });

        const req = buildReq({}, { id: 'order-1' }, { id: 'student-1', role: 'student' });
        const res = buildRes();
        await generateOrderToken(req as AuthRequest, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        // Match the wrapper: { data: { token: ... } }
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
            data: expect.objectContaining({ token: 'mock-order-token' }) 
        }));
    });
});
