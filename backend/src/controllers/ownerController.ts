import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

// ─── Helper: get the owner's outlet ────────────────────────────────
const getOwnerOutlet = async (ownerId: string) => {
    const { data, error } = await supabase
        .from('outlets')
        .select('id, name')
        .eq('owner_id', ownerId)
        .maybeSingle();
    return { outlet: data, error };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/owner/reset-insights
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const resetInsights = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const { outlet, error: outletError } = await getOwnerOutlet(ownerId);
        if (outletError) {
            console.error('Reset insights — outlet lookup error:', outletError);
            res.status(500).json({ error: 'Failed to verify outlet ownership' }); return;
        }
        if (!outlet) { res.status(404).json({ error: 'No outlet linked to this account' }); return; }

        // Update the reset timestamp in the database
        const resetTime = new Date().toISOString();
        const { error: updateError } = await supabase
            .from('outlets')
            .update({ insights_reset_at: resetTime })
            .eq('id', outlet.id);

        if (updateError) {
            console.error('Failed to update insights_reset_at:', updateError);
            res.status(500).json({ error: 'Failed to apply reset.' }); return;
        }

        res.status(200).json({
            success: true,
            message: 'Insights data reset successfully',
            outletId: outlet.id,
            resetTime
        });
    } catch (error: any) {
        console.error('Reset insights error:', error);
        res.status(500).json({ error: 'Internal server error while resetting insights' });
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/owner/order-history
// Query params: ?status, ?startDate, ?endDate, ?studentName, ?page, ?size, ?date (shortcut)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getOrderHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        const {
            page = '0',
            size = '10',
            status,
            studentName,
            startDate,
            endDate,
            date, // shortcut: today, last7days, last30days, thisMonth
        } = req.query as any;

        // Build query from owner_order_history table
        let query = supabase
            .from('owner_order_history')
            .select('*', { count: 'exact' })
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false });

        // Status filter
        if (status) {
            query = query.eq('status', status.toLowerCase());
        }

        // Student name search (ILIKE on denormalized field)
        if (studentName) {
            query = query.ilike('student_name', `%${studentName}%`);
        }

        // Date shortcuts
        if (date) {
            const now = new Date();
            let fromDate: Date;

            switch (date) {
                case 'today':
                    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'last7days':
                    fromDate = new Date(now);
                    fromDate.setDate(fromDate.getDate() - 7);
                    break;
                case 'last30days':
                    fromDate = new Date(now);
                    fromDate.setDate(fromDate.getDate() - 30);
                    break;
                case 'thisMonth':
                    fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                default:
                    fromDate = new Date(0);
            }
            query = query.gte('created_at', fromDate.toISOString());
        }

        // Custom date range (overrides shortcut)
        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        // Pagination
        const pageNum = parseInt(page || '0');
        const pageSize = parseInt(size || '10');
        const from = pageNum * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data: orders, error, count } = await query;
        if (error) throw error;

        // Map to the DTO shape the frontend expects
        const content = (orders || []).map(row => {
            let displayStatus = (row.status || 'pending').toUpperCase();
            if (displayStatus === 'COMPLETED') displayStatus = 'DELIVERED';

            let paymentStatus = (row.payment_status || 'pending').toUpperCase();
            if (displayStatus === 'DELIVERED') paymentStatus = 'PAID';

            return {
                id: row.order_id,
                studentName: row.student_name || 'Unknown',
                studentEmail: row.student_email || '',
                items: (row.items || []).map((item: any) => ({
                    itemName: item.name || 'Unknown Item',
                    quantity: item.quantity,
                    price: parseFloat(item.price || '0'),
                })),
                totalAmount: parseFloat(row.total_amount || '0'),
                status: displayStatus,
                paymentStatus,
                createdAt: row.created_at,
                deliveryTimestamp: row.completed_at,
            };
        });

        res.status(200).json({
            content,
            totalElements: count || 0,
            totalPages: Math.ceil((count || 0) / pageSize),
            size: pageSize,
            number: pageNum,
        });
    } catch (error: any) {
        console.error('Owner order history error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch order history' });
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/owner/order-history/stats
// Aggregation endpoint — powers the summary card on the history page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const getOrderHistoryStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) { res.status(401).json({ error: 'Unauthorized' }); return; }

        // Fetch all history rows for this owner (minimal columns)
        const { data: rows, error } = await supabase
            .from('owner_order_history')
            .select('total_amount, status, items, created_at')
            .eq('owner_id', ownerId);

        if (error) throw error;

        const allRows = rows || [];
        const completed = allRows.filter(r => r.status === 'completed');
        const cancelled = allRows.filter(r => r.status === 'cancelled');

        const totalRevenue = completed.reduce((s, r) => s + parseFloat(r.total_amount || '0'), 0);
        const totalOrders = allRows.length;
        const avgOrderValue = completed.length ? totalRevenue / completed.length : 0;

        // Top items aggregation
        const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
        completed.forEach(row => {
            (row.items || []).forEach((item: any) => {
                const name = item.name || 'Unknown';
                const existing = itemMap.get(name) || { name, quantity: 0, revenue: 0 };
                existing.quantity += item.quantity || 0;
                existing.revenue += (item.price || 0) * (item.quantity || 0);
                itemMap.set(name, existing);
            });
        });
        const topItems = Array.from(itemMap.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        res.status(200).json({
            totalRevenue,
            totalOrders,
            completedOrders: completed.length,
            cancelledOrders: cancelled.length,
            avgOrderValue,
            topItems,
        });
    } catch (error: any) {
        console.error('Order history stats error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch history stats' });
    }
};
