import { Router } from 'express';
import { addToCart, getCart, updateCartItem, removeFromCart, clearCart } from '../controllers/cartController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.use(authenticateUser as any); // Apply middleware to all cart routes

router.get('/', getCart as any);
router.post('/add', addToCart as any);
router.put('/update', updateCartItem as any);
router.delete('/remove/:menuItemId', removeFromCart as any);
router.delete('/clear', clearCart as any);

export default router;
