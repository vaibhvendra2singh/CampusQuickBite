import { Router } from 'express';
import { updateUserProfile, getLeaderboard, getAllUsers, updateUserRole, toggleUserStatus, getUserById } from '../controllers/usersController';
import { authenticateUser, requireRole } from '../middleware/auth';

const router = Router();

router.get('/leaderboard', getLeaderboard as any);
router.get('/', authenticateUser as any, requireRole(['admin']) as any, getAllUsers as any);
router.get('/:id', authenticateUser as any, getUserById as any);
router.put('/:id/role', authenticateUser as any, requireRole(['admin']) as any, updateUserRole as any);
router.put('/:id/status', authenticateUser as any, requireRole(['admin']) as any, toggleUserStatus as any);
router.put('/:id', authenticateUser as any, updateUserProfile as any);

export default router;
