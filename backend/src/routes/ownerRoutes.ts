import { Router } from 'express';
import { getOwnerOrderHistory } from '../controllers/orderController';
import { authenticateUser, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateUser as any);
router.use(requireRole(['SHOP_OWNER', 'ADMIN', 'owner', 'admin']) as any);

router.get('/orders/history', getOwnerOrderHistory as any);
router.get('/orders/history/filter', getOwnerOrderHistory as any); // Same controller handles both in my Node impl

export default router;
