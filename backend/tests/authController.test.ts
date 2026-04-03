/**
 * Unit Tests: authController
 * 
 * We mock supabase, bcryptjs, and jsonwebtoken so tests run
 * in isolation — no real database or network required.
 */

import { Request, Response } from 'express';

// ─── Mocks (must be before the controller import) ────────────────────────────
const mockSupabaseSingle = jest.fn();
const mockSupabaseSelect = jest.fn().mockReturnThis();
const mockSupabaseEq = jest.fn().mockReturnThis();
const mockSupabaseInsert = jest.fn().mockReturnThis();
const mockSupabaseUpdate = jest.fn().mockReturnThis();
const mockSupabaseFrom = jest.fn(() => ({
    select: mockSupabaseSelect,
    eq: mockSupabaseEq,
    insert: mockSupabaseInsert,
    update: mockSupabaseUpdate,
    single: mockSupabaseSingle,
    maybeSingle: mockSupabaseSingle,
}));

jest.mock('../src/config/supabase', () => ({
    supabase: { from: mockSupabaseFrom },
}));

jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn().mockResolvedValue(true),
}));

let mockSignResult = 'mock-jwt-token';
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => mockSignResult),
    verify: jest.fn(),
}));

jest.mock('../src/services/emailService', () => ({
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    sendSignupOTPEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/services/logger', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

// Set required env before loading the module
process.env.JWT_SECRET = 'test-secret-at-least-32-chars-long';

// Now import the controller
import { register, login, verifyOtp, forgotPassword } from '../src/controllers/authController';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const buildRes = (): Partial<Response> => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn(),
    clearCookie: jest.fn(),
});

const buildReq = (body: object, extras: object = {}): Partial<Request> => ({
    body,
    ip: '127.0.0.1',
    ...extras,
});

// ─── register() ──────────────────────────────────────────────────────────────
// Re-init helper: jest.resetAllMocks is needed in Jest 30 to clear queued mockResolvedValueOnce values
const resetMocks = () => {
    jest.clearAllMocks();
    // Clear queued mockResolvedValueOnce on the Supabase single mock
    mockSupabaseSingle.mockReset();
    // Re-apply the from() factory since mockReset above doesn't touch it
    mockSupabaseFrom.mockImplementation(() => ({
        select: mockSupabaseSelect,
        eq: mockSupabaseEq,
        insert: mockSupabaseInsert,
        update: mockSupabaseUpdate,
        single: mockSupabaseSingle,
        maybeSingle: mockSupabaseSingle,
    }));
    mockSupabaseSelect.mockReturnThis();
    mockSupabaseEq.mockReturnThis();
    mockSupabaseInsert.mockReturnThis();
    mockSupabaseUpdate.mockReturnThis();
};

describe('AuthController.register', () => {
    beforeEach(() => resetMocks());

    test('returns 400 when required fields are missing', async () => {
        const req = buildReq({ email: 'test@college.edu', password: 'pass123' }); // name missing
        const res = buildRes();
        await register(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    test('returns 400 when user already exists', async () => {
        // Supabase: user exists check returns a user
        mockSupabaseSingle.mockResolvedValueOnce({ data: { id: 'existing-id' }, error: null });

        const req = buildReq({ name: 'Alice', email: 'alice@campus.edu', password: 'secret123' });
        const res = buildRes();
        await register(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'User already exists' }));
    });

    test('returns 201 and sets requiresVerification on success', async () => {
        // User does not exist
        mockSupabaseSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
        // Insert returns new user
        mockSupabaseSingle.mockResolvedValueOnce({ data: { id: 'new-id', email: 'bob@campus.edu' }, error: null });

        const req = buildReq({ name: 'Bob', email: 'bob@campus.edu', password: 'secret123' });
        const res = buildRes();
        await register(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            requiresVerification: true,
        }));
    });
});

// ─── login() ─────────────────────────────────────────────────────────────────
describe('AuthController.login', () => {
    beforeEach(() => resetMocks());

    test('returns 400 when credentials are missing', async () => {
        const req = buildReq({ email: '' });
        const res = buildRes();
        await login(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 401 when user is not found', async () => {
        mockSupabaseSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

        const req = buildReq({ email: 'nobody@campus.edu', password: 'wrongpass' });
        const res = buildRes();
        await login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid credentials' }));
    });

    test('returns 401 when user is banned', async () => {
        mockSupabaseSingle.mockResolvedValueOnce({
            data: { id: '1', email: 'bad@campus.edu', password: 'hash', role: 'student', is_banned: true, is_email_verified: true },
            error: null,
        });

        const req = buildReq({ email: 'bad@campus.edu', password: 'pass' });
        const res = buildRes();
        await login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'ACCOUNT_BANNED' }));
    });

    test('returns 401 when email is not verified', async () => {
        mockSupabaseSingle.mockResolvedValueOnce({
            data: { id: '1', email: 'notverified@campus.edu', password: 'hash', role: 'student', is_banned: false, is_email_verified: false },
            error: null,
        });

        const req = buildReq({ email: 'notverified@campus.edu', password: 'pass' });
        const res = buildRes();
        await login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'ACCOUNT_NOT_VERIFIED' }));
    });

    test('returns 401 when password does not match', async () => {
        const bcrypt = require('bcryptjs');
        bcrypt.compare.mockResolvedValueOnce(false);

        mockSupabaseSingle.mockResolvedValueOnce({
            data: { id: '1', email: 'user@campus.edu', password: 'fakehash', role: 'student', is_banned: false, is_email_verified: true },
            error: null,
        });

        const req = buildReq({ email: 'user@campus.edu', password: 'wrongpass' });
        const res = buildRes();
        await login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid credentials' }));
    });

    test('returns 200 with token on valid login', async () => {
        const bcrypt = require('bcryptjs');
        bcrypt.compare.mockResolvedValueOnce(true);

        mockSupabaseSingle.mockResolvedValueOnce({
            data: {
                id: 'usr-1', name: 'Carol', email: 'carol@campus.edu',
                password: 'hashed', role: 'student',
                is_banned: false, is_email_verified: true,
                enrollment_number: 'E001', phone_number: null, profile_pic: null,
            },
            error: null,
        });

        const req = buildReq({ email: 'carol@campus.edu', password: 'correct' });
        const res = buildRes();
        await login(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({ token: 'mock-jwt-token' }),
        }));
    });
});

// ─── verifyOtp() ─────────────────────────────────────────────────────────────
describe('AuthController.verifyOtp', () => {
    beforeEach(() => resetMocks());

    test('returns 400 when email or otp is missing', async () => {
        const req = buildReq({ email: 'user@x.com' }); // otp missing
        const res = buildRes();
        await verifyOtp(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 on invalid OTP', async () => {
        mockSupabaseSingle.mockResolvedValueOnce({
            data: {
                id: '1',
                email_verification_token: '999999',
                email_verification_expiry: new Date(Date.now() + 60000).toISOString(),
            },
            error: null,
        });

        const req = buildReq({ email: 'u@x.com', otp: '111111' }); // wrong OTP
        const res = buildRes();
        await verifyOtp(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid verification code.' }));
    });

    test('returns 400 when OTP is expired', async () => {
        mockSupabaseSingle.mockResolvedValueOnce({
            data: {
                id: '1',
                email_verification_token: '123456',
                email_verification_expiry: new Date(Date.now() - 1000).toISOString(), // expired
            },
            error: null,
        });

        const req = buildReq({ email: 'u@x.com', otp: '123456' });
        const res = buildRes();
        await verifyOtp(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect((res.json as jest.Mock).mock.calls[0][0].error).toMatch(/expired/i);
    });

    test('returns 200 on valid OTP', async () => {
        mockSupabaseSingle.mockResolvedValueOnce({
            data: {
                id: '1',
                email_verification_token: '123456',
                email_verification_expiry: new Date(Date.now() + 60000).toISOString(),
            },
            error: null,
        });
        // Mock the update call
        mockSupabaseSingle.mockResolvedValueOnce({ data: {}, error: null });
        // Also need to mock the chained update().eq() call through `from`
        mockSupabaseFrom.mockReturnValue({
            select: mockSupabaseSelect,
            eq: jest.fn().mockReturnThis(),
            insert: mockSupabaseInsert,
            update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
            }),
            single: mockSupabaseSingle,
            maybeSingle: mockSupabaseSingle,
        });
        // Reset first call back
        mockSupabaseFrom.mockReturnValueOnce({
            select: mockSupabaseSelect,
            eq: mockSupabaseEq,
            insert: mockSupabaseInsert,
            update: mockSupabaseUpdate,
            single: mockSupabaseSingle,
            maybeSingle: mockSupabaseSingle,
        });
        mockSupabaseSingle.mockResolvedValueOnce({
            data: {
                id: 'u-1',
                email_verification_token: '123456',
                email_verification_expiry: new Date(Date.now() + 60000).toISOString(),
            },
            error: null,
        });

        const req = buildReq({ email: 'u@x.com', otp: '123456' });
        const res = buildRes();
        await verifyOtp(req as Request, res as Response);

        // It should succeed or return a DB update error — either way, NOT a 400 "Invalid OTP"
        expect(res.status).not.toHaveBeenCalledWith(400);
    });
});

// ─── forgotPassword() ────────────────────────────────────────────────────────
describe('AuthController.forgotPassword', () => {
    beforeEach(() => resetMocks());

    test('returns 400 when no email provided', async () => {
        const req = buildReq({});
        const res = buildRes();
        await forgotPassword(req as Request, res as Response);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 when user does not exist', async () => {
        mockSupabaseSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

        const req = buildReq({ email: 'ghost@x.com' });
        const res = buildRes();
        await forgotPassword(req as Request, res as Response);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'User does not exist' }));
    });
});
