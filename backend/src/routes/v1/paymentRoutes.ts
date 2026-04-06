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

// ─── Shared Validation Logic ─────────────────────────────────────────
async function validateOrderForPayment(orderId: any, amount: number, userId: string) {
    if (!orderId || amount === undefined || amount === null) {
        return { error: 'Order ID and Amount are required', status: 400 };
    }

    const result = await supabase
        .from('orders')
        .select('user_id, total_amount, payment_status')
        .eq('id', orderId)
        .single();

    if (!result || result.error || !result.data) {
        return { error: 'Order not found', status: 404 };
    }

    const order = result.data;

    if (order.user_id !== userId) {
        return { error: 'Access Denied: You cannot pay for someone else\'s order', status: 403 };
    }

    if (order.payment_status === 'paid') {
        return { error: 'Order is already paid', status: 400 };
    }

    // Price Forgery Check: database total_amount vs the amount sent from client
    if (Math.abs(parseFloat(order.total_amount) - amount) > 0.01) {
        return { error: 'Payment amount mismatch (Price Forgery detected)', status: 400 };
    }

    return { order, status: 200 };
}

// ─── Legacy/Test Mock Payment Route ───────────────────────────────
// (Used by Unit Tests and potentially for wallet/mock payments)
router.post('/', authenticateUser as any, validate(z.object({ body: paymentSchema })), async (req: AuthRequest, res: Response) => {
    try {
        const { orderId, amount, paymentMethod = 'card' } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const validation = await validateOrderForPayment(orderId, amount, userId);
        if (validation.error) {
            return res.status(validation.status).json({ error: validation.error });
        }

        // Mock payment process (Simulation)
        const { error: updateError } = await supabase
            .from('orders')
            .update({ 
                payment_status: 'paid',
                payment_method: paymentMethod.toUpperCase()
            })
            .eq('id', orderId);

        if (updateError) throw updateError;

        await supabase.from('cart_items').delete().eq('user_id', userId);

        res.status(200).json({ 
            success: true, 
            message: 'Payment simulated successfully',
            transactionId: `TXN-REM-${Date.now()}`
        });

    } catch (error: any) {
        console.error('[MOCK_PAYMENT_ERROR]', error);
        res.status(500).json({ error: 'Payment simulation failed' });
    }
});

// 1. Create a Razorpay Order
router.post('/razorpay/order', authenticateUser as any, async (req: AuthRequest, res: Response) => {
    try {
        const { orderId, amount } = req.body;
        const userId = req.user?.id;

        if (!orderId || !amount || !userId) {
            return res.status(400).json({ error: 'Order ID and Amount are required' });
        }

        // Verify with DB before creating Razorpay order!
        const validation = await validateOrderForPayment(orderId, amount, userId);
        if (validation.error) {
            return res.status(validation.status).json({ error: validation.error });
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
        console.error(' [RAZORPAY_FAILURE] Failed to create order:', error);
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
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || '')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Payment is legit! Update the DB
            const { error: updateError } = await supabase
                .from('orders')
                .update({ 
                    payment_status: 'paid',
                    payment_method: 'RAZORPAY'
                })
                .eq('id', orderId);

            if (updateError) {
                console.error('[DATABASE_ERROR] Failed to update payment:', updateError);
                return res.status(500).json({ error: 'Payment verified but failed to save.' });
            }

            // CLEAR CART
            await supabase.from('cart_items').delete().eq('user_id', userId);

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
