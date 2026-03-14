import { Router } from 'express';
import { submitRating, getMenuItemRatings, getOutletRatings, getAdminReviewFeed, toggleReviewVisibility } from '../controllers/ratingController';
import { authenticateUser, requireRole } from '../middleware/auth';

const router = Router();

router.post('/', authenticateUser as any, submitRating as any);
router.get('/item/:itemId', getMenuItemRatings as any);
router.get('/outlet/:outletId', getOutletRatings as any);

// Admin Routes
router.get('/admin/feed', authenticateUser as any, requireRole(['admin']) as any, getAdminReviewFeed as any);
router.put('/:id/visibility', authenticateUser as any, requireRole(['admin']) as any, toggleReviewVisibility as any);

export default router;
