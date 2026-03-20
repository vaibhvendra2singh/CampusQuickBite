import { Router, Request, Response } from 'express';
import { authenticateUser } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { paymentSchema } from '../../models/schemas';
import { z } from 'zod';

const router = Router();

// Mock Payment Endpoint
router.post('/', authenticateUser as any, validate(z.object({ body: paymentSchema })), async (req: any, res: Response): Promise<void> => {
    try {
        const { orderId, amount, paymentMethod } = req.body;
        const userId = req.user?.id;

        if (!orderId || !amount) {
            res.status(400).json({ error: 'Order ID and Amount are required for payment' });
            return;
        }

        const { supabase } = require('../../config/supabase');

        // Security Check 1: Verify order existence and fetch true total
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('user_id, total_amount, payment_status')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        // Security Check 2: Ownership verification (IDOR prevention)
        if (order.user_id !== userId) {
            res.status(403).json({ error: 'Unauthorized: You cannot pay for someone else\'s order' });
            return;
        }

        // Security Check 3: Prevent duplicate payments
        if (order.payment_status === 'paid') {
            res.status(400).json({ error: 'Order is already paid' });
            return;
        }

        // Security Check 4: CRITICAL - Verify amount matches DB total (Prevent Forgery)
        const expectedAmount = parseFloat(order.total_amount.toString());
        const providedAmount = parseFloat(amount.toString());

        if (Math.abs(expectedAmount - providedAmount) > 0.01) {
            console.error(`[PAYMENT_ALERT] Amount mismatch. Expected: ${expectedAmount}, Provided: ${providedAmount}. User: ${userId}`);
            res.status(400).json({ error: 'Payment amount mismatch. Order total has changed or been tampered with.' });
            return;
        }

        // Normally you'd connect to Stripe here
        console.log(`[PAYMENT] Processing ₹${amount} for Order ${orderId} via ${paymentMethod}`);

        // Mock logic: Update the database to reflect payment
        const { error: updateError } = await supabase
            .from('orders')
            .update({
                payment_status: 'paid',
            })
            .eq('id', orderId);

        if (updateError) {
            console.error('[DATABASE_ERROR] Failed to update payment status:', updateError);
            res.status(500).json({ error: 'Payment recorded on provider but failed to persist locally. Please contact support.' });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Payment verified and recorded',
            transactionId: `TXN-REM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        });

    } catch (error: any) {
        console.error('Payment processing error:', error);
        res.status(500).json({ error: error.message || 'Failed to process payment' });
    }
});

export default router;
