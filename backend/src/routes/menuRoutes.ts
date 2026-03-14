import { Router } from 'express';
import { getAllMenu, getMenuByOutlet, deleteMenuItem, addMenuItem, updateMenuItem } from '../controllers/menuController';
import { authenticateUser, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { menuItemSchema, menuItemUpdateSchema } from '../models/schemas';
import { z } from 'zod';

const router = Router();

// Public routes
router.get('/', getAllMenu);
router.get('/outlet/:outletId', getMenuByOutlet);
router.get('/:outletId', getMenuByOutlet);

// Protected routes - Owner/Admin only
router.use(authenticateUser as any);
router.use(requireRole(['owner', 'admin']) as any);

router.post('/', validate(z.object({ body: menuItemSchema })), addMenuItem);
router.put('/:id', validate(z.object({ body: menuItemUpdateSchema, params: z.object({ id: z.union([z.string(), z.number()]).transform(String) }) })), updateMenuItem);
router.delete('/:id', validate(z.object({ params: z.object({ id: z.union([z.string(), z.number()]).transform(String) }) })), deleteMenuItem);

export default router;
