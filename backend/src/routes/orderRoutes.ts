import { Router } from 'express';
import {
    createOrder, getOrderById, getOrdersByUser, getOrdersByOutlet,
    updateOrderStatus, generateOrderToken, verifyOrder,
    markOrderAsDelivered, generateReceiptImage, cancelOrder,
    getOwnerOrderHistory, getAllOrders, getGlobalOrderStats
} from '../controllers/orderController';
import { authenticateUser, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from '../models/schemas';
import { z } from 'zod';

const router = Router();

router.use(authenticateUser as any);

// Student & Common Routes
router.post('/', validate(z.object({ body: createOrderSchema })), createOrder as any);
router.get('/user/:userId', getOrdersByUser as any);
router.get('/:id', validate(z.object({ params: z.object({ id: z.string() }) })), getOrderById as any);
router.get('/:id/receipt-image', generateReceiptImage as any);
router.get('/:id/token', requireRole(['student', 'admin']) as any, generateOrderToken as any);

// Owner & Admin Routes
router.get('/outlet/:outletId', requireRole(['owner', 'admin']) as any, getOrdersByOutlet as any);
router.get('/owner/history', requireRole(['owner', 'admin']) as any, getOwnerOrderHistory as any);
router.put('/:id/status', requireRole(['owner', 'admin']) as any, validate(z.object({ body: updateOrderStatusSchema })), updateOrderStatus as any);
router.post('/verify', requireRole(['owner', 'admin']) as any, verifyOrder as any);
router.put('/owner/mark-delivered/:orderId', requireRole(['owner', 'admin']) as any, markOrderAsDelivered as any);
router.put('/:id/cancel', requireRole(['owner', 'admin']) as any, cancelOrder as any);

// Global Admin "Command Center" Routes
router.get('/', requireRole(['admin']) as any, getAllOrders as any);
router.get('/admin/stats/heatmap', requireRole(['admin']) as any, getGlobalOrderStats as any);

export default router;
