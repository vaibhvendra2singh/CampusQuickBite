import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import jwt from 'jsonwebtoken';
import { createCanvas } from 'canvas';
import { notifyOrderUpdate, notifyWalletUpdate } from '../services/socketService';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { auditLog } from '../utils/auditLog';

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not defined in environment variables');
    return secret;
};

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { outletId, items, notes, scheduledTime, paymentMethod } = req.body;

        if (!userId || !outletId) {
            sendError(res, 'User ID and Outlet ID are required', 400);
            return;
        }
        
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('is_frozen, is_banned')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            sendError(res, 'User verification failed', 401);
            return;
        }

        if (user.is_banned) {
            sendError(res, 'ACCOUNT_BANNED', 403);
            return;
        }

        if (user.is_frozen) {
            sendError(res, 'ACCOUNT_FROZEN', 403);
            return;
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            sendError(res, 'Order must contain at least one item', 400);
            return;
        }

        const { data: orderData, error: rpcError } = await supabase.rpc('create_order_v2', {
            p_user_id: userId,
            p_outlet_id: outletId,
            p_items: items.map((i: any) => ({ menu_item_id: i.menuItemId, quantity: parseInt(i.quantity as any) })),
            p_notes: notes || null,
            p_scheduled_at: scheduledTime || null,
            p_payment_method: paymentMethod || 'cash'
        });

        if (rpcError) {
            console.error('RPC Order Error:', rpcError);
            const status = rpcError.message.includes('Insufficient stock') ? 400 : 500;
            sendError(res, rpcError.message, status);
            return;
        }

        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select(`
                *,
                outlets (id, name),
                user:users!user_id (id, name),
                order_items (
                    ${ORDER_ITEMS_SELECT}
                )
            `)
            .eq('id', orderData.id)
            .single();

        if (fetchError || !order) {
            throw fetchError || new Error('Order verification failed after creation');
        }

        sendSuccess(res, formatOrderWithItems(order), 'Order created successfully', 201);

    } catch (error: any) {
        console.error('Create order error:', error);
        sendError(res, error?.message || 'Internal Server Error');
    }
};


const formatOrderWithItems = (orderData: any) => {
    const formattedItems = (orderData.order_items || [])
        .map((oi: any) => {
            const resolvedName = oi.item_name || oi.menu_items?.name;
            if (!resolvedName) return null; // deleted item with no snapshot — exclude
            return {
                id: oi.id,
                quantity: oi.quantity,
                price: parseFloat(oi.price),
                menuItem: {
                    id: oi.menu_items?.id || null,
                    name: resolvedName,
                    price: parseFloat(oi.menu_items?.price || oi.price || '0')
                }
            };
        })
        .filter(Boolean); // remove nulls

    return {
        ...orderData,
        items: formattedItems,
        totalAmount: parseFloat(orderData.total_amount),
        notes: orderData.notes,
        scheduledAt: orderData.scheduled_at,
        preparingAt: orderData.preparing_at,
        readyAt: orderData.ready_at,
        createdAt: orderData.created_at,
        status: orderData.status,
        payment_status: orderData.payment_status,
        paymentStatus: orderData.payment_status,
        outlet: {
            id: orderData.outlets?.id,
            name: orderData.outlets?.name
        },
        user: orderData.user || orderData.users
    };
};

const ORDER_ITEMS_SELECT = `
    id, quantity, price, item_name,
    menu_items (id, name, price)
`;

export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                outlets (id, name, owner_id),
                user:users!user_id (id, name),
                order_items (
                    ${ORDER_ITEMS_SELECT}
                )
            `)
            .eq('id', id)
            .single();

        if (error || !data) {
            sendError(res, 'Order not found', 404);
            return;
        }

        const userId = req.user?.id;
        const userRole = req.user?.role;

        if (userRole === 'STUDENT') {
            if (data.user_id !== userId) {
                sendError(res, 'Unauthorized to view this order', 403);
                return;
            }
        } else if (userRole === 'SHOP_OWNER') {
            if ((data.outlets as any)?.owner_id !== userId) {
                sendError(res, 'Unauthorized: This order belongs to a different outlet', 403);
                return;
            }
        }

        sendSuccess(res, formatOrderWithItems(data), 'Order fetched successfully');
    } catch (error) {
        console.error('Get order by id error:', error);
        sendError(res, 'Internal Server Error');
    }
};

export const getOrdersByUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const page = parseInt(req.query.page as string) || 0;
        const size = parseInt(req.query.size as string) || 10;
        const from = page * size;
        const to = from + size - 1;

        const { data, error, count } = await supabase
            .from('orders')
            .select(`
                *,
                outlets (id, name),
                user:users!user_id (id, name),
                order_items (
                    ${ORDER_ITEMS_SELECT}
                )
            `, { count: 'exact' })
            .eq('user_id', userId)
            .or(`payment_status.eq.paid,payment_method.eq.CASH,payment_method.eq.cash`)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            sendError(res, error.message, 500);
            return;
        }

        const formattedOrders = (data || []).map(formatOrderWithItems);
        sendPaginated(res, formattedOrders, count || 0, page, size, 'User orders fetched successfully');
    } catch (error) {
        console.error('Get orders by user error:', error);
        sendError(res, 'Internal Server Error');
    }
};

export const getOrdersByOutlet = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { outletId } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const page = parseInt(req.query.page as string) || 0;
        const size = parseInt(req.query.size as string) || 20;
        const from = page * size;
        const to = from + size - 1;

        if (userRole !== 'ADMIN') {
            const { data: outlet, error: outletError } = await supabase
                .from('outlets')
                .select('id')
                .eq('id', outletId)
                .eq('owner_id', userId)
                .single();

            if (outletError || !outlet) {
                sendError(res, 'You are not authorized to view orders for this outlet', 403);
                return;
            }
        }

        const { data, error, count } = await supabase
            .from('orders')
            .select(`
                *,
                outlets (id, name),
                user:users!user_id (id, name),
                order_items (
                    ${ORDER_ITEMS_SELECT}
                )
            `, { count: 'exact' })
            .eq('outlet_id', outletId)
            // AUTHORIZATION FILTER: Show if PAID or if it's a CASH order
            // (Note: Using .or for complex filtering since we want to avoid ghost online orders)
            .or(`payment_status.eq.paid,payment_method.eq.CASH,payment_method.eq.cash`)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            sendError(res, error.message, 500);
            return;
        }

        const formattedOrders = (data || []).map(formatOrderWithItems);
        sendPaginated(res, formattedOrders, count || 0, page, size, 'Outlet orders fetched successfully');
    } catch (error) {
        console.error('Get orders by outlet error:', error);
        sendError(res, 'Internal Server Error');
    }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status: newStatus } = req.body;
        const requestedStatus = newStatus?.toLowerCase();

        console.log(`[OrderUpdate] Attempting to update order #${id} to ${requestedStatus} by user ${req.user?.id}`);

        if (!requestedStatus) {
            sendError(res, 'Status is required', 400);
            return;
        }

        const { data: currentOrder, error: fetchError } = await supabase
            .from('orders')
            .select(`
                status, 
                payment_status,
                total_amount,
                user_id, 
                outlet_id, 
                outlets!outlet_id (owner_id)
            `)
            .eq('id', id)
            .single();

        if (fetchError || !currentOrder) {
            console.error('[OrderUpdate] Order not found or fetch error:', fetchError);
            sendError(res, 'Order not found', 404);
            return;
        }

        const currentStatus = currentOrder.status.toLowerCase();

        let outletData = (currentOrder as any).outlets;
        if (Array.isArray(outletData)) outletData = outletData[0];
        const outletOwnerId = outletData?.owner_id;

        console.log(`[OrderUpdate] Current status: ${currentStatus}, Outlet owner: ${outletOwnerId}`);

        if (req.user.role === 'SHOP_OWNER' && String(outletOwnerId).toLowerCase() !== String(req.user.id).toLowerCase()) {
            console.warn(`[OrderUpdate] Unauthorized attempt! User ${req.user.id} tried to update order owned by ${outletOwnerId}`);
            sendError(res, 'Unauthorized: This order belongs to a different outlet', 403);
            return;
        }

        const allowedTransitions: Record<string, string[]> = {
            'pending': ['preparing', 'cancelled'],
            'placed': ['preparing', 'cancelled'],
            'preparing': ['ready', 'cancelled'],
            'ready': ['completed', 'cancelled'],
            'completed': [],
            'cancelled': []
        };

        if (currentStatus === requestedStatus) {
            sendSuccess(res, formatOrderWithItems(currentOrder), 'Status is already ' + requestedStatus);
            return;
        }

        if (!allowedTransitions[currentStatus]?.includes(requestedStatus)) {
            if (req.user?.role !== 'ADMIN') {
                console.error(`[OrderUpdate] Invalid transition from ${currentStatus} to ${requestedStatus}`);
                sendError(res, 'Invalid state transition', 400);
                return;
            }
        }

        if (['preparing', 'ready', 'completed'].includes(requestedStatus)) {
            if (currentOrder.payment_status !== 'paid' && req.user?.role !== 'ADMIN') {
                sendError(res, 'Cannot process unpaid orders', 400);
                return;
            }
        }

        if (requestedStatus === 'cancelled') {
            const { data: rpcResult, error: rpcError } = await supabase.rpc('cancel_order_with_stock', {
                p_order_id: id,
                p_actor_id: req.user.id
            });

            if (rpcError) {
                console.error('[OrderUpdate] Cancellation RPC failed:', rpcError);
                sendError(res, 'Failed to cancel and restore stock');
                return;
            }
        } else {
            const updatePayload: any = { 
                status: requestedStatus,
                verified_by: req.user?.id 
            };
            if (requestedStatus === 'preparing') {
                updatePayload.preparing_at = new Date().toISOString();
            }
            if (requestedStatus === 'ready') {
                updatePayload.ready_at = new Date().toISOString();
            }
            if (requestedStatus === 'completed') {
                updatePayload.delivered_at = new Date().toISOString();
            }

            const { error: updateError } = await supabase
                .from('orders')
                .update(updatePayload)
                .eq('id', id);

            if (updateError) {
                console.error('[OrderUpdate] Database update failed:', updateError);
                sendError(res, 'Failed to update order status');
                return;
            }
        }

        const { data: updatedOrder, error: reFetchError } = await supabase
            .from('orders')
            .select(`
                *,
                outlets (id, name),
                user:users!user_id (id, name),
                order_items (
                    ${ORDER_ITEMS_SELECT}
                )
            `)
            .eq('id', id)
            .single();

        if (reFetchError || !updatedOrder) {
            console.warn('[OrderUpdate] Success but re-fetch failed:', reFetchError);
            sendSuccess(res, { id, status: requestedStatus }, 'Status updated (refresh for full details)');
            return;
        }

        // ─── Refund Logic: If order is PAID and status is now CANCELLED ──────────
        if (requestedStatus === 'cancelled' && currentOrder.payment_status === 'paid') {
            const amount = parseFloat(currentOrder.total_amount || '0');
            if (amount > 0) {
                console.log(`[Refund] Order #${id} is being cancelled. Refunding ₹${amount} to user ${currentOrder.user_id}`);
                
                await supabase.rpc('increment_wallet', { 
                    user_uuid: currentOrder.user_id, 
                    amount_to_add: amount 
                });

                const { data: userRecord } = await supabase.from('users').select('wallet_balance').eq('id', currentOrder.user_id).single();
                if (userRecord) {
                    notifyWalletUpdate(currentOrder.user_id, userRecord.wallet_balance, amount, 'REFUND');
                }

                await supabase.from('orders').update({ payment_status: 'refunded' }).eq('id', id);

                await auditLog({
                    action: 'PAYMENT_REFUND_ISSUED',
                    actorId: req.user.id,
                    actorRole: req.user.role,
                    targetId: String(updatedOrder.id),
                    targetType: 'order',
                    details: { userId: currentOrder.user_id, amount, reason: 'ORDER_CANCELLED_BY_OWNER' }
                });
            }
        }

        notifyOrderUpdate(updatedOrder.user_id, updatedOrder.id, updatedOrder.status);

        await auditLog({
            action: 'ORDER_STATUS_CHANGED',
            actorId: req.user.id,
            actorRole: req.user.role,
            targetId: id as string,
            targetType: 'order',
            details: { from: currentStatus, to: requestedStatus }
        });

        console.log(`[OrderUpdate] Successfully updated order #${id}`);
        sendSuccess(res, formatOrderWithItems(updatedOrder), `Order marked as ${requestedStatus}`);
    } catch (error) {
        console.error('Update order status error:', error);
        sendError(res, 'Internal Server Error');
    }
};

export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const actorId = req.user?.id;
        const userRole = req.user?.role;

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, user_id, status, payment_status, total_amount, outlets!inner(owner_id)')
            .eq('id', id)
            .single();

        if (orderError || !order) {
            sendError(res, 'Order not found', 404);
            return;
        }

        const outletOwnerId = (order.outlets as any)?.owner_id;
        if (userRole !== 'ADMIN' && outletOwnerId !== actorId) {
            sendError(res, 'Unauthorized: You can only cancel orders for your own outlet', 403);
            return;
        }

        const currentStatus = order.status?.toLowerCase();
        if (currentStatus !== 'pending' && currentStatus !== 'preparing' && currentStatus !== 'placed') {
            sendError(res, `Cannot cancel an order that is already ${currentStatus}`, 400);
            return;
        }

        const { data: rpcResult, error: rpcError } = await supabase.rpc('cancel_order_with_stock', {
            p_order_id: id,
            p_actor_id: actorId
        });

        if (rpcError) {
            console.error('Failed to cancel order with RPC:', rpcError);
            sendError(res, `Cancellation failed: ${rpcError.message}`);
            return;
        }

        // ─── Refund Logic: If order is PAID and status is now CANCELLED ──────────
        if (order.payment_status === 'paid') {
            const amount = parseFloat(order.total_amount || '0');
            const userId = order.user_id;

            if (amount > 0 && userId) {
                console.log(`[Refund] Order #${id} cancelled. Refunding ₹${amount} to user ${userId}`);
                
                // 1. Credit wallet
                const { error: walletError } = await supabase.rpc('increment_wallet', { 
                    user_uuid: userId, 
                    amount_to_add: amount 
                });

                if (walletError) {
                    const { data: user } = await supabase.from('users').select('wallet_balance').eq('id', userId).single();
                    if (user) {
                        const newBalance = (parseFloat(user.wallet_balance) || 0) + amount;
                        await supabase.from('users').update({ wallet_balance: newBalance }).eq('id', userId);
                    }
                }

                // 2. Mark as REFUNDED
                await supabase.from('orders').update({ payment_status: 'refunded' }).eq('id', id);

                const { data: userRec } = await supabase.from('users').select('wallet_balance').eq('id', userId).single();
                if (userRec) {
                    notifyWalletUpdate(userId, userRec.wallet_balance, amount, 'REFUND');
                }

                // 3. Log it
                await auditLog({
                    action: 'PAYMENT_REFUND_ISSUED',
                    actorId: req.user.id,
                    actorRole: req.user.role,
                    targetId: id as string,
                    targetType: 'order',
                    details: { userId, amount, reason: 'ORDER_CANCELLED_IN_DETAIL_VIEW' }
                });
            }
        }

        if (req.user) {
            await auditLog({
                action: 'ORDER_CANCELLED',
                actorId: req.user.id,
                actorRole: req.user.role,
                targetId: id as string,
                targetType: 'order',
                details: { from: currentStatus }
            });
        }

        sendSuccess(res, { orderId: id, previous_status: currentStatus }, 'Order cancelled successfully');

    } catch (error) {
        console.error('Cancel order error:', error);
        sendError(res, 'Internal Server Error');
    }
};

export const generateOrderToken = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error || !order) {
            sendError(res, 'Order not found', 404);
            return;
        }

        if (order.status.toLowerCase() !== 'ready') {
            sendError(res, 'Order is not ready for pickup', 400);
            return;
        }

        const token = jwt.sign(
            { orderId: order.id },
            getJwtSecret(),
            { expiresIn: '30m' } // Increased to 30m for better UX
        );

        sendSuccess(res, { token });
    } catch (error) {
        console.error('Generate order token error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const verifyOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { token } = req.body;
        const ownerId = req.user?.id;

        console.log('Received verification request from owner:', ownerId);

        if (!token) {
            console.log('Verification failed: Missing token');
            res.status(400).json({ error: 'Token is required' });
            return;
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, getJwtSecret());
            console.log('Token successfully decoded:', decoded);
        } catch (err) {
            console.error('Token verification failed:', err);
            res.status(400).json({ error: 'Invalid or expired QR token' }); // Use 400 to avoid triggering global logout
            return;
        }

        const { orderId } = decoded;

        console.log('Fetching order details for validation:', orderId);
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, outlets(owner_id)')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            console.error('Order not found or database error:', orderError);
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        console.log('Order found. Current status:', order.status);

        if (order.status.toLowerCase() !== 'ready') {
            res.status(400).json({ error: 'Order is not ready or already completed' });
            return;
        }

        const { data: outlet, error: outletError } = await supabase
            .from('outlets')
            .select('id')
            .eq('id', order.outlet_id)
            .eq('owner_id', ownerId)
            .single();

        if (outletError || !outlet) {
            res.status(403).json({ error: 'Unauthorized: Verification failed for this outlet' });
            return;
        }

        const { error: updateError } = await supabase
            .from('orders')
            .update({
                status: 'completed',
                delivered_at: new Date().toISOString(),
                verified_by: ownerId
            })
            .eq('id', orderId);

        if (updateError) {
            console.error('[DATABASE_ERROR] Order completion failed:', updateError);
            res.status(500).json({ error: 'Token valid but failed to update status. Please try again or contact support.' });
            return;
        }

        try {
            const { data: user } = await supabase.from('users').select('xp, tier').eq('id', order.user_id).single();
            if (user) {
                const newXp = (user.xp || 0) + 15;
                let newTier = user.tier || 'BRONZE';
                if (newXp >= 200) newTier = 'ELECTRIC_BLUE';
                else if (newXp >= 100) newTier = 'GOLD';
                else if (newXp >= 40) newTier = 'SILVER';
                await supabase.from('users').update({ xp: newXp, tier: newTier }).eq('id', order.user_id);
            }
        } catch (e) {
            console.warn('XP Grant failed', e);
        }

        console.log('Order verified and completed:', orderId);
        res.status(200).json({ message: 'Order verified and completed successfully', orderId });
    } catch (error: any) {
        console.error('Critical verification error:', error);
        sendError(res, 'Verification system error', 500);
    }
};


export const markOrderAsDelivered = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const operatorId = req.user?.id;
        const userRole = req.user?.role;

        if (userRole !== 'ADMIN') {
            sendError(res, 'Security: Manual completion is restricted to administrators', 403);
            return;
        }

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, user_id')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        const { error: updateError } = await supabase
            .from('orders')
            .update({
                status: 'completed',
                delivered_at: new Date().toISOString(),
                verified_by: operatorId
            })
            .eq('id', orderId);

        if (updateError) {
            console.error('[DATABASE_ERROR] Manual completion failed:', updateError);
            res.status(500).json({ error: 'Manual completion failed' });
            return;
        }

        try {
            const { data: user } = await supabase.from('users').select('xp, tier').eq('id', order.user_id).single();
            if (user && user.xp !== undefined) {
                const newXp = (user.xp || 0) + 15;
                let newTier = user.tier || 'BRONZE';
                if (newXp >= 200) newTier = 'ELECTRIC_BLUE';
                else if (newXp >= 100) newTier = 'GOLD';
                else if (newXp >= 40) newTier = 'SILVER';

                await supabase.from('users').update({ xp: newXp, tier: newTier }).eq('id', order.user_id);
            }
        } catch (e) {
            console.warn('Manual XP Grant failed', e);
        }

        res.status(200).json({ message: 'Order marked as delivered by Administrator' });
    } catch (error) {
        console.error('Mark as delivered error:', error);
        sendError(res, 'An internal error occurred', 500);
    }
};
export const getOwnerOrderHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { page = '0', size = '10', studentName, status, startDate, endDate } = req.query as any;

        const { data: outlet, error: outletError } = await supabase
            .from('outlets')
            .select('id')
            .eq('owner_id', userId)
            .single();

        if (outletError || !outlet) {
            res.status(404).json({ error: 'No outlet found for this owner' });
            return;
        }

        let query = supabase
            .from('orders')
            .select(`
                id, status, payment_status, total_amount, created_at, delivered_at, payment_method,
                user:users!user_id(name, email),
                order_items (id, quantity, price, item_name, menu_items(name))
            `, { count: 'exact' })
            .eq('outlet_id', outlet.id)
            .or(`payment_status.eq.paid,payment_method.eq.CASH,payment_method.eq.cash`)
            .order('created_at', { ascending: false });

        if (studentName) {
            query = query.ilike('users.name', `%${studentName}%`);
        }
        if (status) {
            query = query.eq('status', status.toLowerCase());
        }
        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        const from = parseInt(page || '0') * parseInt(size || '10');
        const to = from + parseInt(size || '10') - 1;
        query = query.range(from, to);

        const { data: orders, error: orderError, count } = await query;
        if (orderError) throw orderError;

        const content = (orders || []).map(order => {
            let status = (order.status || 'pending').toUpperCase();
            if (status === 'COMPLETED') status = 'DELIVERED';
            if (status === 'PLACED') status = 'PENDING';

            let paymentStatus = (order.payment_status || 'pending').toUpperCase();
            if (status === 'DELIVERED') paymentStatus = 'PAID';

            return {
                id: order.id,
                studentName: (order as any).user?.name || (order as any).users?.name || 'Unknown',
                studentEmail: (order as any).user?.email || (order as any).users?.email || '',
                totalAmount: parseFloat(order.total_amount || '0'),
                status: status,
                paymentStatus: paymentStatus,
                createdAt: order.created_at,
                deliveryTimestamp: order.delivered_at,
                items: ((order as any).order_items || []).map((oi: any) => ({
                    itemName: oi.item_name || oi.menu_items?.name || 'Unknown Item',
                    quantity: oi.quantity,
                    price: parseFloat(oi.price || '0')
                }))
            };
        });

        res.status(200).json({
            content,
            totalElements: count || 0,
            totalPages: Math.ceil((count || 0) / parseInt(size || '10')),
            size: parseInt(size || '10'),
            number: parseInt(page || '0')
        });
    } catch (error: any) {
        console.error('Fetch owner history error:', error);
        sendError(res, error.message || 'Internal Server Error', 500);
    }
};

export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, limit = '50' } = req.query as any;
        let query = supabase
            .from('orders')
            .select(`
                *,
                outlets (id, name),
                user:users!user_id (id, name, enrollment_number),
                order_items (
                    ${ORDER_ITEMS_SELECT}
                )
            `)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (status) query = query.eq('status', status.toLowerCase());

        const { data, error } = await query;
        if (error) throw error;
        res.status(200).json((data || []).map(formatOrderWithItems));
    } catch (error: any) {
        console.error('Get all orders error:', error);
        sendError(res, error.message || 'Internal Server Error', 500);
    }
};

export const getGlobalOrderStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { data: outlets, error: outletError } = await supabase.from('outlets').select('id, name');
        if (outletError) throw outletError;

        const { data: orders, error: orderError } = await supabase
            .from('orders')
            .select('outlet_id, status, payment_status, payment_method')
            .in('status', ['pending', 'placed', 'preparing', 'ready'])
            .or(`payment_status.eq.paid,payment_method.eq.CASH,payment_method.eq.cash`);
        if (orderError) throw orderError;

        const stats = (outlets || []).map(outlet => {
            const outletOrders = (orders || []).filter(o => o.outlet_id === outlet.id);
            return {
                outletId: outlet.id,
                name: outlet.name,
                activeCount: outletOrders.length,
                pending: outletOrders.filter(o => ['pending', 'placed'].includes(o.status)).length,
                preparing: outletOrders.filter(o => o.status === 'preparing').length,
                ready: outletOrders.filter(o => o.status === 'ready').length
            };
        });
        res.status(200).json(stats);
    } catch (error: any) {
        console.error('Get global order stats error:', error);
        sendError(res, error.message || 'Internal Server Error', 500);
    }
};

export const generateReceiptImage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { data: order, error } = await supabase
            .from('orders')
            .select(`
                *,
                outlets (id, name, location, owner_id),
                order_items (
                    id, quantity, price, item_name,
                    menu_items (id, name, price)
                ),
                user:users!user_id (name, email, phone_number)
            `)
            .eq('id', id)
            .single();

        if (error || !order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        if (order.user_id !== userId && order.outlets?.owner_id !== userId && req.user?.role !== 'admin') {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const width = 450;
        const height = 750;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        const brandColor = '#0070FF';
        const textColor = '#121212';
        const subduedColor = '#666666';

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = brandColor;
        ctx.fillRect(0, 0, width, 120);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('CAMPUSBITE', 30, 60);

        ctx.font = '14px sans-serif';
        ctx.fillText('ORDER AHEAD', 30, 85);

        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('RECEIPT', width - 30, 60);
        ctx.font = '12px sans-serif';
        ctx.fillText(`#${order.id}`, width - 30, 85);

        ctx.textAlign = 'left';
        ctx.fillStyle = textColor;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(order.outlets?.name?.toUpperCase() || 'OUTLET', 30, 160);

        ctx.font = '12px sans-serif';
        ctx.fillStyle = subduedColor;
        ctx.fillText(new Date(order.created_at).toLocaleString(), 30, 185);

        ctx.fillStyle = textColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('STUDENT:', 30, 210);
        ctx.font = '11px sans-serif';
        ctx.fillText(`${order.user?.name || 'N/A'}`, 100, 210);

        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('PHONE:', 30, 230);
        ctx.font = '11px sans-serif';
        ctx.fillText(`${order.user?.phone_number || 'N/A'}`, 100, 230);

        ctx.strokeStyle = '#EEEEEE';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(30, 250);
        ctx.lineTo(width - 30, 250);
        ctx.stroke();

        let y = 290;
        ctx.fillStyle = textColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('ITEM', 30, y);
        ctx.textAlign = 'right';
        ctx.fillText('QTY', width - 120, y);
        ctx.fillText('PRICE', width - 30, y);

        y += 30;
        ctx.font = '12px sans-serif';
        (order.order_items || []).forEach((item: any) => {
            const name = item.item_name || item.menu_items?.name || 'Unknown';
            ctx.textAlign = 'left';
            ctx.fillText(name, 30, y);
            ctx.textAlign = 'right';
            ctx.fillText(item.quantity.toString(), width - 120, y);
            ctx.fillText(`₹${(item.price * item.quantity).toFixed(2)}`, width - 30, y);
            y += 25;
        });

        y += 20;
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(width - 30, y);
        ctx.stroke();

        y += 40;
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('TOTAL AMOUNT', 30, y);
        ctx.textAlign = 'right';
        ctx.fillStyle = brandColor;
        ctx.fillText(`₹${order.total_amount}`, width - 30, y);

        const orderStatus = (order.status || '').toUpperCase();
        const isCancelled = orderStatus === 'CANCELLED';

        y += 28;
        ctx.textAlign = 'center';
        ctx.font = 'bold 11px sans-serif';
        if (isCancelled) {
            ctx.fillStyle = '#EF4444';
            ctx.fillText('STATUS: CANCELLED', width / 2, y);
        } else {
            ctx.fillStyle = '#10B981';
            ctx.fillText(`STATUS: ${orderStatus}`, width / 2, y);
        }

        y += 36;
        ctx.fillStyle = subduedColor;
        ctx.font = 'italic 12px sans-serif';
        ctx.textAlign = 'center';
        if (isCancelled) {
            ctx.fillText('This order was cancelled.', width / 2, y);
            y += 20;
            ctx.fillText('Contact support if you need help.', width / 2, y);
        } else {
            ctx.fillText('Thank you for ordering with CampusBite!', width / 2, y);
            y += 20;
            ctx.fillText('Skip the queue, pick up when ready.', width / 2, y);
        }

        ctx.globalAlpha = 0.07;
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 60px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CAMPUSBITE', width / 2, height - 30);
        ctx.globalAlpha = 1.0;

        if (isCancelled) {
            ctx.save();
            ctx.globalAlpha = 0.13;
            ctx.fillStyle = '#EF4444';
            ctx.font = 'bold 80px sans-serif';
            ctx.textAlign = 'center';
            ctx.translate(width / 2, height / 2);
            ctx.rotate(-Math.PI / 6);
            ctx.fillText('CANCELLED', 0, 0);
            ctx.restore();

            ctx.strokeStyle = '#EF4444';
            ctx.lineWidth = 6;
            ctx.strokeRect(3, 3, width - 6, height - 6);
        }

        const buffer = canvas.toBuffer('image/png');
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename=receipt_${order.id}.png`);
        res.send(buffer);
    } catch (error: any) {
        console.error('Generate receipt error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
