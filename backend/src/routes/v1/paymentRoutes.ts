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
let _razorpay: Razorpay | null = null;
const getRazorpayClient = () => {
    if (!_razorpay) {
        const key_id = process.env.RAZORPAY_KEY_ID;
        const key_secret = process.env.RAZORPAY_KEY_SECRET;
        
        if (!key_id || !key_secret) {
            console.error('[RAZORPAY_INIT_ERROR] Missing Razorpay credentials in process.env');
            // We'll throw an error here so it's caught by the request try-catch
            throw new Error('Razorpay configuration missing');
        }

        console.log(`[RAZORPAY_INIT] Initializing with Key ID starting with: ${key_id.substring(0, 8)}...`);
        _razorpay = new Razorpay({ key_id, key_secret });
    }
    return _razorpay;
};

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

    // Price Forgery Check with epsilon tolerance for float precision
    const dbAmount = parseFloat(order.total_amount);
    const diff = Math.abs(dbAmount - amount);
    if (diff > 0.05) { // Tolerate up to 5 paise difference
        console.warn(`[PAYMENT_FRAUD_CHECK] Mismatch! DB: ${dbAmount}, Sent: ${amount}, Diff: ${diff}`);
        return { error: `Payment amount mismatch: expected ₹${dbAmount.toFixed(2)} but received ₹${amount.toFixed(2)}`, status: 400 };
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

        console.log(`[RAZORPAY_ORDER_START] OrderID: ${orderId}, Amount: ${amount}, UserID: ${userId}`);

        if (!orderId || amount === undefined || !userId) {
            return res.status(400).json({ error: 'Order ID and Amount are required' });
        }

        // Verify with DB before creating Razorpay order!
        const validation = await validateOrderForPayment(orderId, parseFloat(amount.toString()), userId);
        if (validation.error) {
            console.warn('[RAZORPAY_VALIDATION_FAILED]', validation.error);
            return res.status(validation.status).json({ error: validation.error });
        }

        const options = {
            amount: Math.round(Number(amount) * 100), // Razorpay expects amount in paise
            currency: 'INR',
            receipt: `receipt_${orderId}`,
        };

        console.log('[RAZORPAY_CREATING_ORDER]', options);

        const rzpClient = getRazorpayClient();
        const razorpayOrder = await rzpClient.orders.create(options);
        console.log('[RAZORPAY_ORDER_CREATED]', razorpayOrder.id);

        res.status(200).json({
            success: true,
            data: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
            }
        });

    } catch (error: any) {
        const foundEnvKeys = Object.keys(process.env).filter(k => k.includes('RAZOR')).join(', ');
        console.error(' [RAZORPAY_FAILURE] Detailed Error:', {
            message: error.message,
            code: error.code,
            description: error.description,
            envKeysFound: foundEnvKeys,
            stack: error.stack
        });
        res.status(500).json({ 
            error: 'Failed to create Razorpay order', 
            details: error.message,
            suggestion: `Check if (.env) contains valid keys. Detected keys: [${foundEnvKeys || 'None'}]. Try restarting with "docker compose up -d --build" if on Docker.`
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
