import { Router } from 'express';
import { updateUserProfile, getLeaderboard, getAllUsers, updateUserRole, toggleUserStatus, getUserById, resetAdminInsights, resetAllStudentXP, nukeDatabase, grantBadge, revokeAllBadges } from '../../controllers/usersController';
import { authenticateUser, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { 
    updateUserProfileSchema, 
    updateUserRoleSchema, 
    toggleUserStatusSchema 
} from '../../models/schemas';
import { z } from 'zod';

const router = Router();

router.get('/leaderboard', getLeaderboard as any);
router.get('/', authenticateUser as any, requireRole(['admin']) as any, validate(z.object({ 
    query: z.object({ 
        search: z.string().optional(),
        role: z.enum(['student', 'owner', 'admin']).optional()
    }) 
})), getAllUsers as any);
router.get('/:id', authenticateUser as any, validate(z.object({ params: z.object({ id: z.string().min(1) }) })), getUserById as any);
router.post('/admin/reset-insights', authenticateUser as any, requireRole(['admin']) as any, resetAdminInsights as any);
router.post('/admin/reset-xp', authenticateUser as any, requireRole(['admin']) as any, resetAllStudentXP as any);
router.post('/admin/nuke-database', authenticateUser as any, requireRole(['admin']) as any, nukeDatabase as any);
router.post('/badge', authenticateUser as any, grantBadge as any);
router.delete('/:id/badges', authenticateUser as any, requireRole(['admin']) as any, revokeAllBadges as any);

router.put('/:id/role', authenticateUser as any, requireRole(['admin']) as any, validate(z.object({ 
    params: z.object({ id: z.string().min(1) }),
    body: updateUserRoleSchema 
})), updateUserRole as any);
router.put('/:id/status', authenticateUser as any, requireRole(['admin']) as any, validate(z.object({ 
    params: z.object({ id: z.string().min(1) }),
    body: toggleUserStatusSchema 
})), toggleUserStatus as any);
router.put('/:id', authenticateUser as any, validate(z.object({ 
    params: z.object({ id: z.string().min(1) }),
    body: updateUserProfileSchema 
})), updateUserProfile as any);

export default router;
