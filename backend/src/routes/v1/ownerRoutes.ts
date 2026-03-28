import { Router } from 'express';
import { getOwnerOrderHistory } from '../../controllers/orderController';
import { resetInsights, getOrderHistory, getOrderHistoryStats } from '../../controllers/ownerController';
import { authenticateUser, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticateUser as any);
router.use(requireRole(['SHOP_OWNER', 'ADMIN', 'owner', 'admin']) as any);

router.get('/orders/history', getOwnerOrderHistory as any);
router.get('/orders/history/filter', getOwnerOrderHistory as any);

router.get('/order-history', getOrderHistory as any);
router.get('/order-history/stats', getOrderHistoryStats as any);

router.post('/reset-insights', resetInsights as any);

export default router;
