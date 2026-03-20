import { Router } from 'express';
import { getOutletAnalytics, getPersonalRecommendations, getUpsellRecommendations, getDynamicTrending } from '../../controllers/analyticsController';
import { authenticateUser, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';

const router = Router();

router.get('/:outletId',
    authenticateUser as any,
    requireRole(['owner', 'admin']) as any,
    validate(z.object({ params: z.object({ outletId: z.string().min(1) }) })),
    getOutletAnalytics as any
);

// Smart Menu Endpoints
router.get('/recommendations/personal', authenticateUser as any, getPersonalRecommendations as any);
router.get('/recommendations/upsell/:itemId', authenticateUser as any, validate(z.object({ params: z.object({ itemId: z.string().min(1) }) })), getUpsellRecommendations as any);
router.get('/trending', getDynamicTrending as any);

export default router;
