import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Mock Payment Endpoint
router.post('/', authenticateUser as any, async (req: any, res: Response): Promise<void> => {
    try {
        const { orderId, amount, paymentMethod } = req.body;
        const userId = req.user?.id;

        if (!orderId || !amount) {
            res.status(400).json({ error: 'Order ID and Amount are required for payment' });
            return;
        }

        const { supabase } = require('../config/supabase');

        // Security Check: Verify order belongs to the requester
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('user_id')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        if (order.user_id !== userId) {
            res.status(403).json({ error: 'Unauthorized: You cannot pay for someone else\'s order' });
            return;
        }

        // Normally you'd connect to Stripe here
        console.log(`[MOCK PAYMENT] Received payment of ${amount} for Order ${orderId} via ${paymentMethod}`);

        // Mock logic: Update the database to reflect payment
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                payment_status: 'paid',
            })
            .eq('id', orderId);

        if (updateError) {
            console.error('Failed to update payment status in DB:', updateError);
            throw new Error('Database update failed');
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified and recorded',
            transactionId: `TXN-REAL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        });

    } catch (error: any) {
        console.error('Payment processing error:', error);
        res.status(500).json({ error: error.message || 'Failed to process payment' });
    }
});

export default router;
