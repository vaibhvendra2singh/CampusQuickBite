import { Router } from 'express';
import { getOutletAnalytics, getPersonalRecommendations, getUpsellRecommendations, getDynamicTrending } from '../controllers/analyticsController';
import { authenticateUser, requireRole } from '../middleware/auth';

const router = Router();

router.get('/:outletId',
    authenticateUser as any,
    requireRole(['owner', 'admin']) as any,
    getOutletAnalytics as any
);

// Smart Menu Endpoints
router.get('/recommendations/personal', authenticateUser as any, getPersonalRecommendations as any);
router.get('/recommendations/upsell/:itemId', authenticateUser as any, getUpsellRecommendations as any);
router.get('/trending', getDynamicTrending as any);

export default router;
