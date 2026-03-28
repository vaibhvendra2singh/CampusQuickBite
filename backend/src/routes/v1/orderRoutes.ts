import { Router } from 'express';
import {
    createOrder, getOrderById, getOrdersByUser, getOrdersByOutlet,
    updateOrderStatus, generateOrderToken, verifyOrder,
    markOrderAsDelivered, generateReceiptImage, cancelOrder,
    getOwnerOrderHistory, getAllOrders, getGlobalOrderStats
} from '../../controllers/orderController';
import { authenticateUser, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from '../../models/schemas';
import { z } from 'zod';

const router = Router();

router.use(authenticateUser as any);

/**
 * @openapi
 * /api/v1/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Orders]
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: size
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of all orders
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.post('/', validate(z.object({ body: createOrderSchema })), createOrder as any);

/**
 * @openapi
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get order details by ID
 *     tags: [Orders]
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/:id', validate(z.object({ params: z.object({ id: z.string() }) })), getOrderById as any);
router.get('/:id/receipt-image', generateReceiptImage as any);
router.get('/:id/token', requireRole(['student', 'admin']) as any, generateOrderToken as any);

router.get('/outlet/:outletId', requireRole(['owner', 'admin']) as any, getOrdersByOutlet as any);
router.get('/owner/history', requireRole(['owner', 'admin']) as any, getOwnerOrderHistory as any);
/**
 * @openapi
 * /api/v1/orders/{id}/status:
 *   put:
 *     summary: Update order status (Owner/Admin)
 *     tags: [Orders]
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderStatusUpdate'
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.put('/:id/status', requireRole(['owner', 'admin']) as any, validate(z.object({ body: updateOrderStatusSchema })), updateOrderStatus as any);
router.post('/verify', requireRole(['owner', 'admin']) as any, verifyOrder as any);
router.put('/owner/mark-delivered/:orderId', requireRole(['owner', 'admin']) as any, markOrderAsDelivered as any);
router.put('/:id/cancel', requireRole(['owner', 'admin']) as any, cancelOrder as any);

router.get('/', requireRole(['admin']) as any, getAllOrders as any);
router.get('/admin/stats/heatmap', requireRole(['admin']) as any, getGlobalOrderStats as any);

export default router;
