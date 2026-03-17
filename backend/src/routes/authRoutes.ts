import { Router } from 'express';
import { register, login, forgotPassword, verifyToken, resetPassword, changePassword, verifyEmail } from '../controllers/authController';
import { authenticateUser } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { 
    registerSchema, 
    loginSchema, 
    forgotPasswordSchema, 
    verifyTokenSchema, 
    resetPasswordSchema, 
    changePasswordSchema 
} from '../models/schemas';
import { z } from 'zod';

const router = Router();

router.post('/register', validate(z.object({ body: registerSchema })), register);
router.post('/login', validate(z.object({ body: loginSchema })), login);
router.post('/verify-email', validate(z.object({ body: z.object({ token: z.string().uuid() }) })), verifyEmail);
router.post('/forgot-password', validate(z.object({ body: forgotPasswordSchema })), forgotPassword);
router.post('/verify-token', validate(z.object({ body: verifyTokenSchema })), verifyToken);
router.post('/reset-password', validate(z.object({ body: resetPasswordSchema })), resetPassword);
router.post('/change-password', authenticateUser, validate(z.object({ body: changePasswordSchema })), changePassword);

export default router;
