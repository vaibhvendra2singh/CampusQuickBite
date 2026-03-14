import { Router } from 'express';
import { register, login, forgotPassword, verifyToken, resetPassword, changePassword } from '../controllers/authController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-token', verifyToken);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticateUser, changePassword);

export default router;
