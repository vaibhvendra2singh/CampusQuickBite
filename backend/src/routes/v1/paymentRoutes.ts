import { Router, Request, Response } from 'express';
import { authenticateUser, AuthRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { paymentSchema } from '../../models/schemas';
import { z } from 'zod';
import { supabase } from '../../config/supabase';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const router = Router();

// ─── Razorpay Configuration ──────────────────────────────────────────
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

// 1. Create a Razorpay Order
router.post('/razorpay/order', authenticateUser as any, async (req: AuthRequest, res: Response) => {
    try {
        const { orderId, amount } = req.body;

        if (!orderId || !amount) {
            return res.status(400).json({ error: 'Order ID and Amount are required' });
        }

        const options = {
            amount: Math.round(Number(amount) * 100), // Razorpay expects amount in paise (₹1 = 100 paise)
            currency: 'INR',
            receipt: `receipt_${orderId}`,
        };

        const razorpayOrder = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
        });

    } catch (error: any) {
        console.error('Razorpay Order Error:', error);
        res.status(500).json({ error: 'Failed to create Razorpay order' });
    }
});

// 2. Verify Razorpay Payment (the security check!)
router.post('/razorpay/verify', authenticateUser as any, async (req: AuthRequest, res: Response) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || '')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Payment is legit! Update the DB
            const { error: updateError } = await supabase
                .from('orders')
                .update({ payment_status: 'paid' })
                .eq('id', orderId);

            if (updateError) {
                console.error('[DATABASE_ERROR] Failed to update payment:', updateError);
                return res.status(500).json({ error: 'Payment verified but failed to save.' });
            }

            return res.status(200).json({ success: true, message: "Payment verified successfully" });
        } else {
            return res.status(400).json({ error: "Invalid payment signature" });
        }
    } catch (error: any) {
        console.error('Verification Error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});

// 3. Existing Cash Route (Old route converted to a specific path)
router.post('/cash', authenticateUser as any, validate(z.object({ body: paymentSchema })), async (req: AuthRequest, res: Response) => {
    try {
        const { orderId, amount } = req.body;
        const userId = req.user?.id;

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('user_id, total_amount, payment_status')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { error: updateError } = await supabase
            .from('orders')
            .update({ payment_status: 'paid' })
            .eq('id', orderId);

        if (updateError) return res.status(500).json({ error: 'Failed to update order status' });

        res.status(200).json({
            success: true,
            message: 'Payment recorded via cash',
            transactionId: `CASH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Payment failed' });
    }
});

export default router;
