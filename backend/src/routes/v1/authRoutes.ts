import { Router } from 'express';
import { 
    register, login, forgotPassword, verifyToken, resetPassword, 
    changePassword, verifyEmail, verifyOtp, resendOtp,
    refreshAccessToken, logout
} from '../../controllers/authController';
import { authenticateUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { 
    registerSchema, 
    loginSchema, 
    forgotPasswordSchema, 
    verifyTokenSchema, 
    resetPasswordSchema, 
    changePasswordSchema 
} from '../../models/schemas';
import { z } from 'zod';

const router = Router();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new student
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post('/register', validate(z.object({ body: registerSchema })), register);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: JWT issues
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post('/login', validate(z.object({ body: loginSchema })), login);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     description: Reads refresh token from HttpOnly cookie and issues a new access token.
 *     responses:
 *       200:
 *         description: New access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post('/refresh', refreshAccessToken);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     description: Clears the refresh token cookie.
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.post('/logout', logout);
router.post('/verify-email', validate(z.object({ body: z.object({ token: z.string().uuid() }) })), verifyEmail);
router.post('/forgot-password', validate(z.object({ body: forgotPasswordSchema })), forgotPassword);
router.post('/verify-token', validate(z.object({ body: verifyTokenSchema })), verifyToken);
router.post('/reset-password', validate(z.object({ body: resetPasswordSchema })), resetPassword);
router.post('/change-password', authenticateUser, validate(z.object({ body: changePasswordSchema })), changePassword);

router.post('/verify-otp', validate(z.object({ body: z.object({ email: z.string().email(), otp: z.string().length(6) }) })), verifyOtp);
router.post('/resend-otp', validate(z.object({ body: z.object({ email: z.string().email() }) })), resendOtp);

export default router;
