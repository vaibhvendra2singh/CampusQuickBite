import { Router } from 'express';
import { submitRating, getMenuItemRatings, getOutletRatings, getAdminReviewFeed, toggleReviewVisibility } from '../../controllers/ratingController';
import { authenticateUser, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { submitRatingSchema } from '../../models/schemas';
import { z } from 'zod';

const router = Router();

router.post('/', authenticateUser as any, validate(z.object({ body: submitRatingSchema })), submitRating as any);

router.get('/item/:itemId', validate(z.object({ params: z.object({ itemId: z.string().min(1) }) })), getMenuItemRatings as any);
router.get('/outlet/:outletId', validate(z.object({ params: z.object({ outletId: z.string().min(1) }) })), getOutletRatings as any);

// Admin Routes
router.get('/admin/feed', authenticateUser as any, requireRole(['admin']) as any, getAdminReviewFeed as any);
router.put('/:id/visibility', authenticateUser as any, requireRole(['admin']) as any, validate(z.object({ 
    params: z.object({ id: z.coerce.number() }),
    body: z.object({ is_hidden: z.boolean() }) 
})), toggleReviewVisibility as any);

export default router;
