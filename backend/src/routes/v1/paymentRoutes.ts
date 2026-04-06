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
        console.error(' [RAZORPAY_FAILURE] Failed to create order:', {
            message: error.message,
            description: error.description,
            error: error.error, // Razorpay might return an 'error' object inside the error
            stack: error.stack
        });
        res.status(500).json({ 
            error: 'Failed to create Razorpay order', 
            details: error.message 
        });
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

            // ─── CLEAR CART ONLY ON SUCCESS ─────────────────────────────────
            const userId = req.user?.id;
            if (userId) {
                await supabase.from('cart_items').delete().eq('user_id', userId);
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

export default router;
