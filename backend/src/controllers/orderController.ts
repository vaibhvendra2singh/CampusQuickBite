import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import jwt from 'jsonwebtoken';
import { createCanvas } from 'canvas';
import { notifyOrderUpdate } from '../services/socketService';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { outletId, items } = req.body;

        if (!userId || !outletId) {
            res.status(400).json({ error: 'User ID and Outlet ID are required' });
            return;
        }

        // Check if user is frozen or banned
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('is_frozen, is_banned')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            res.status(401).json({ error: 'User verification failed' });
            return;
        }

        if (user.is_banned) {
            res.status(403).json({ error: 'ACCOUNT_BANNED' });
            return;
        }

        if (user.is_frozen) {
            res.status(403).json({ error: 'ACCOUNT_FROZEN' });
            return;
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ error: 'Order must contain at least one item' });
            return;
        }

        // Call the secure PostgreSQL function for atomic transaction
        // Handles: Stock check, Price calculation, Order creation, Stock decrement, Cart clearing
        const { data: orderData, error: rpcError } = await supabase.rpc('create_order_v2', {
            p_user_id: userId,
            p_outlet_id: outletId,
            p_items: items.map(i => ({ menu_item_id: i.menuItemId, quantity: parseInt(i.quantity as any) }))
        });

        if (rpcError) {
            console.error('RPC Order Error:', rpcError);
            const status = rpcError.message.includes('Insufficient stock') ? 400 : 500;
            res.status(status).json({ error: rpcError.message });
            return;
        }

        // Fetch and format the newly created order for the response
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

        res.status(201).json(formatOrderWithItems(order));

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const formatOrderWithItems = (orderData: any) => {
    // Only include items that have a resolvable name.
    // item_name is the snapshot saved at order time; menu_items.name is the live fallback.
    // If neither exists (menu item deleted before migration ran), skip the item entirely.
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
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        const userId = req.user?.id;
        const userRole = req.user?.role;

        // Authorization logic:
        // 1. If student: must own the order
        // 2. If owner: order must belong to one of their outlets
        // 3. Admin: access all
        if (userRole === 'student') {
            if (data.user_id !== userId) {
                res.status(403).json({ error: 'Unauthorized to view this order' });
                return;
            }
        } else if (userRole === 'owner') {
            if ((data.outlets as any)?.owner_id !== userId) {
                res.status(403).json({ error: 'Unauthorized: This order belongs to a different outlet' });
                return;
            }
        }

        res.status(200).json(formatOrderWithItems(data));
    } catch (error) {
        console.error('Get order by id error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getOrdersByUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                outlets (id, name),
                user:users!user_id (id, name),
                order_items (
                    ${ORDER_ITEMS_SELECT}
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        res.status(200).json((data || []).map(formatOrderWithItems));
    } catch (error) {
        console.error('Get orders by user error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getOrdersByOutlet = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { outletId } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role;

        // Verify the owner/admin is authorized for this outlet
        if (userRole !== 'admin') {
            const { data: outlet, error: outletError } = await supabase
                .from('outlets')
                .select('id')
                .eq('id', outletId)
                .eq('owner_id', userId)
                .single();

            if (outletError || !outlet) {
                res.status(403).json({ error: 'You are not authorized to view orders for this outlet' });
                return;
            }
        }

        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                outlets (id, name),
                user:users!user_id (id, name),
                order_items (
                    ${ORDER_ITEMS_SELECT}
                )
            `)
            .eq('outlet_id', outletId)
            .order('created_at', { ascending: false });

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        res.status(200).json((data || []).map(formatOrderWithItems));
    } catch (error) {
        console.error('Get orders by outlet error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status: newStatus } = req.body;
        const requestedStatus = newStatus?.toLowerCase();

        console.log(`[OrderUpdate] Attempting to update order #${id} to ${requestedStatus} by user ${req.user?.id}`);

        if (!requestedStatus) {
            res.status(400).json({ error: 'Status is required' });
            return;
        }

        // 1. Fetch current order with outlet info for security check
        const { data: currentOrder, error: fetchError } = await supabase
            .from('orders')
            .select(`
                status, 
                payment_status,
                user_id, 
                outlet_id, 
                outlets!outlet_id (owner_id)
            `)
            .eq('id', id)
            .single();

        if (fetchError || !currentOrder) {
            console.error('[OrderUpdate] Order not found or fetch error:', fetchError);
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        const currentStatus = currentOrder.status.toLowerCase();

        // Robust owner check: Handle cases where Supabase returns outlets as an object OR an array
        let outletData = (currentOrder as any).outlets;
        if (Array.isArray(outletData)) outletData = outletData[0];
        const outletOwnerId = outletData?.owner_id;

        console.log(`[OrderUpdate] Current status: ${currentStatus}, Outlet owner: ${outletOwnerId}`);

        if (req.user.role === 'owner' && String(outletOwnerId).toLowerCase() !== String(req.user.id).toLowerCase()) {
            console.warn(`[OrderUpdate] Unauthorized attempt! User ${req.user.id} tried to update order owned by ${outletOwnerId}`);
            res.status(403).json({ error: 'Unauthorized: This order belongs to a different outlet' });
            return;
        }

        // 2. Define allowed transitions
        const allowedTransitions: Record<string, string[]> = {
            'pending': ['preparing', 'cancelled'],
            'placed': ['preparing', 'cancelled'],
            'preparing': ['ready', 'cancelled'],
            'ready': ['completed', 'cancelled'],
            'completed': [],
            'cancelled': []
        };

        if (currentStatus === requestedStatus) {
            res.status(200).json(currentOrder);
            return;
        }

        if (!allowedTransitions[currentStatus]?.includes(requestedStatus)) {
            console.error(`[OrderUpdate] Invalid transition from ${currentStatus} to ${requestedStatus}`);
            res.status(400).json({ error: 'Invalid state transition' });
            return;
        }

        // 3. SECURITY: Payment Verification
        // Do not allow preparing or completing orders that haven't been paid
        if (['preparing', 'ready', 'completed'].includes(requestedStatus)) {
            if (currentOrder.payment_status !== 'paid') {
                res.status(400).json({ error: 'Cannot process unpaid orders' });
                return;
            }
        }

        // 3. Perform the update
        const updatePayload: any = { status: requestedStatus };
        if (requestedStatus === 'completed') {
            updatePayload.delivered_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
            .from('orders')
            .update(updatePayload)
            .eq('id', id);

        if (updateError) {
            console.error('[OrderUpdate] Database update failed:', updateError);
            res.status(500).json({ error: 'Failed to update order status' });
            return;
        }

        // 4. Re-fetch the full order with nicely aliased fields for the frontend
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
            res.status(200).json({ message: 'Status updated', status: requestedStatus }); // Minimal success response
            return;
        }

        // Notify user via Socket.io
        notifyOrderUpdate(updatedOrder.user_id, updatedOrder.id, updatedOrder.status);

        console.log(`[OrderUpdate] Successfully updated order #${id}`);
        res.status(200).json(formatOrderWithItems(updatedOrder));
    } catch (error) {
        console.error('[OrderUpdate] Critical error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const ownerId = req.user?.id;

        // Fetch order and ownership details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, status, payment_status, outlets!inner(owner_id)')
            .eq('id', id)
            .single();

        if (orderError || !order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        // Only owner of that outlet can cancel
        if ((order.outlets as any)?.owner_id !== ownerId) {
            res.status(403).json({ error: 'Unauthorized: You can only cancel orders for your own outlet' });
            return;
        }

        // Only allow cancel if status is pending or preparing
        const currentStatus = order.status?.toLowerCase();
        if (currentStatus !== 'pending' && currentStatus !== 'preparing' && currentStatus !== 'placed') {
            res.status(400).json({ error: `Cannot cancel an order that is already ${currentStatus}` });
            return;
        }

        // Update the order status to cancelled
        const updateData: any = {
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', id);

        if (updateError) {
            // Fallback if `cancelled_at` column does not exist natively yet
            if (updateError.message?.includes('cancelled_at') || updateError.code === 'PGRST204' || updateError.code === '42703') {
                const { error: fallbackError } = await supabase
                    .from('orders')
                    .update({ status: 'cancelled' })
                    .eq('id', id);

                if (fallbackError) {
                    console.error('Failed to cancel order:', fallbackError);
                    res.status(500).json({ error: 'Database update failed' });
                    return;
                }
            } else {
                console.error('Failed to cancel order:', updateError);
                res.status(500).json({ error: 'Database update failed' });
                return;
            }
        }

        // Ideally add cancelled_at to the database schemas if not already

        res.status(200).json({ message: 'Order cancelled successfully', orderId: id, previous_status: currentStatus });

    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        if (order.status.toLowerCase() !== 'ready') {
            res.status(400).json({ error: 'Order is not ready for pickup' });
            return;
        }

        const token = jwt.sign(
            { orderId: order.id },
            JWT_SECRET!,
            { expiresIn: '30m' } // Increased to 30m for better UX
        );

        res.status(200).json({ token });
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
            decoded = jwt.verify(token, JWT_SECRET!);
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

        // AUTO-COMPLETE: After successful token verification, COMPLETE the order
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

        // Grant XP for verified delivery
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
        res.status(500).json({ error: 'Verification system error' });
    }
};


export const markOrderAsDelivered = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { orderId } = req.params;
        const operatorId = req.user?.id;
        const userRole = req.user?.role;

        // EMERGENCY OVERRIDE ONLY: Restrict to Admins to prevent owner-level verification bypass
        if (userRole !== 'admin') {
            res.status(403).json({ error: 'Security: Manual completion is restricted to administrators' });
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

        // Grant XP & Update Tier
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
        res.status(500).json({ error: 'An internal error occurred' });
    }
};
export const getOwnerOrderHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { page = '0', size = '10', studentName, status, startDate, endDate } = req.query as any;

        // 1. Get outlet for this owner
        const { data: outlet, error: outletError } = await supabase
            .from('outlets')
            .select('id')
            .eq('owner_id', userId)
            .single();

        if (outletError || !outlet) {
            res.status(404).json({ error: 'No outlet found for this owner' });
            return;
        }

        // 2. Build Query
        let query = supabase
            .from('orders')
            .select(`
                id, status, payment_status, total_amount, created_at, delivered_at,
                user:users!user_id(name, email),
                order_items (id, quantity, price, item_name, menu_items(name))
            `, { count: 'exact' })
            .eq('outlet_id', outlet.id)
            .order('created_at', { ascending: false });

        // Filters
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

        // Pagination
        const from = parseInt(page || '0') * parseInt(size || '10');
        const to = from + parseInt(size || '10') - 1;
        query = query.range(from, to);

        const { data: orders, error: orderError, count } = await query;
        if (orderError) throw orderError;

        // 3. Map to DTO-like format
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
        res.status(500).json({ error: error.message || 'Internal Server Error' });
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
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

export const getGlobalOrderStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { data: outlets, error: outletError } = await supabase.from('outlets').select('id, name');
        if (outletError) throw outletError;

        const { data: orders, error: orderError } = await supabase
            .from('orders')
            .select('outlet_id, status')
            .in('status', ['pending', 'placed', 'preparing', 'ready']);
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
        res.status(500).json({ error: error.message || 'Internal Server Error' });
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

        // Styles
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

        // Order status line
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

        // Faint CAMPUSBITE watermark
        ctx.globalAlpha = 0.07;
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 60px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CAMPUSBITE', width / 2, height - 30);
        ctx.globalAlpha = 1.0;

        // Big diagonal CANCELLED stamp
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

            // Red border around entire receipt
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
