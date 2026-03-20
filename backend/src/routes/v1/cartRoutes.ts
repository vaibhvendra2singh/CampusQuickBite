import { Router } from 'express';
import { addToCart, getCart, updateCartItem, removeFromCart, clearCart } from '../../controllers/cartController';
import { authenticateUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { addToCartSchema, updateCartItemSchema } from '../../models/schemas';
import { z } from 'zod';

const router = Router();

router.use(authenticateUser as any); // Apply middleware to all cart routes

router.get('/', getCart as any);
router.post('/add', validate(z.object({ body: addToCartSchema })), addToCart as any);
router.put('/update', validate(z.object({ body: updateCartItemSchema })), updateCartItem as any);
router.delete('/remove/:menuItemId', validate(z.object({ params: z.object({ menuItemId: z.string().min(1) }) })), removeFromCart as any);
router.delete('/clear', clearCart as any);

export default router;
