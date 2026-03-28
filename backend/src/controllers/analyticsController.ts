import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const getOutletAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { outletId } = req.params;
        const userId = req.user?.id;

        let resetTimestamp: string | null = null;
        
        const { data: outlet, error: outletError } = await supabase
            .from('outlets')
            .select('owner_id, insights_reset_at')
            .eq('id', outletId)
            .single();

        if (outletError || !outlet) {
            res.status(404).json({ error: 'Outlet not found' });
            return;
        }

        if (req.user?.role !== 'admin' && outlet.owner_id !== userId) {
            res.status(403).json({ error: 'Unauthorized access to analytics' });
            return;
        }
        
        resetTimestamp = outlet.insights_reset_at;

        let query = supabase
            .from('orders')
            .select(`
                id,
                total_amount,
                created_at,
                status,
                order_items (
                    id,
                    item_name,
                    quantity,
                    price
                )
            `)
            .eq('outlet_id', outletId)
            .eq('status', 'completed');
            
        if (resetTimestamp) {
            query = query.gt('created_at', resetTimestamp);
        }

        const { data: orders, error: ordersError } = await query.order('created_at', { ascending: true });

        if (ordersError) throw ordersError;

        let totalRevenue = 0;
        const dailyStats: Record<string, { date: string, revenue: number, orders: number }> = {};
        const popularItems: Record<string, { name: string, quantity: number, revenue: number }> = {};
        const peakHours: Record<number, number> = {};

        for (let i = 0; i < 24; i++) peakHours[i] = 0;

        orders?.forEach(order => {
            totalRevenue += order.total_amount;

            const date = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            if (!dailyStats[date]) {
                dailyStats[date] = { date, revenue: 0, orders: 0 };
            }
            dailyStats[date].revenue += order.total_amount;
            dailyStats[date].orders += 1;

            const hour = new Date(order.created_at).getHours();
            peakHours[hour] += 1;

            order.order_items?.forEach((item: any) => {
                const name = item.item_name || 'Unknown Item';
                if (!popularItems[name]) {
                    popularItems[name] = { name, quantity: 0, revenue: 0 };
                }
                popularItems[name].quantity += item.quantity;
                popularItems[name].revenue += item.price * item.quantity;
            });
        });

        const analytics = {
            isReset: !!resetTimestamp,
            summary: {
                totalRevenue,
                totalOrders: orders?.length || 0,
                avgOrderValue: orders?.length ? (totalRevenue / orders.length) : 0
            },
            revenueTrend: Object.values(dailyStats),
            popularItems: Object.values(popularItems).sort((a, b) => b.quantity - a.quantity).slice(0, 5),
            peakHours: Object.entries(peakHours).map(([hour, count]) => ({
                hour: `${hour}:00`,
                orders: count
            }))
        };

        res.json(analytics);
    } catch (error: any) {
        console.error('Analytics Error:', error);
        res.status(500).json({ error: 'Failed to generate analytics report' });
    }
};

export const getPersonalRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { data: orders, error } = await supabase
            .from('orders')
            .select('order_items(menu_item_id, item_name, price)')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .limit(20); // Last 20 orders

        if (error) throw error;

        const itemFreq: Record<string, { id: number, name: string, price: number, count: number }> = {};
        orders?.forEach(order => {
            order.order_items?.forEach((item: any) => {
                if (!itemFreq[item.menu_item_id]) {
                    itemFreq[item.menu_item_id] = { id: item.menu_item_id, name: item.item_name, price: item.price, count: 0 };
                }
                itemFreq[item.menu_item_id].count += 1;
            });
        });

        const recommendations = Object.values(itemFreq)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5 favorite items

        res.json(recommendations);
    } catch (error) {
        console.error('Personal recommendations error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getUpsellRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { itemId } = req.params;

        const { data: orderItems, error: subsetError } = await supabase
            .from('order_items')
            .select('order_id')
            .eq('menu_item_id', itemId)
            .limit(50); // Get up to 50 recent orders with this item

        if (subsetError || !orderItems || orderItems.length === 0) {
            res.json([]);
            return;
        }

        const orderIds = orderItems.map(oi => oi.order_id);

        const { data: relatedItems, error: relatedError } = await supabase
            .from('order_items')
            .select('menu_item_id, item_name, price')
            .in('order_id', orderIds)
            .neq('menu_item_id', itemId); // Exclude the target item

        if (relatedError) throw relatedError;

        const freqMap: Record<number, { id: number, name: string, price: number, count: number }> = {};
        relatedItems?.forEach((item: any) => {
            if (!freqMap[item.menu_item_id]) {
                freqMap[item.menu_item_id] = { id: item.menu_item_id, name: item.item_name, price: item.price, count: 0 };
            }
            freqMap[item.menu_item_id].count += 1;
        });

        const upSells = Object.values(freqMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        res.json(upSells);
    } catch (error) {
        console.error('Upsell recommendations error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getDynamicTrending = async (req: Request, res: Response): Promise<void> => {
    try {
        const currentHour = new Date().getHours();

        const { data: rawItems, error } = await supabase
            .from('menu_items')
            .select('id, name, description, price, outlet_id, average_rating, rating_count, is_veg, outlets(name)')
            .order('average_rating', { ascending: false })
            .limit(30);

        if (error || !rawItems) throw error;

        const trendingScore = (item: any) => {
            let score = item.average_rating || 0;
            const name = item.name.toLowerCase();

            if (currentHour >= 7 && currentHour <= 11) {
                if (name.includes('coffee') || name.includes('tea') || name.includes('chai') || name.includes('dosa') || name.includes('paratha')) score *= 1.2;
            }
            else if (currentHour >= 12 && currentHour <= 15) {
                if (name.includes('rice') || name.includes('pizza') || name.includes('meal')) score *= 1.2;
            }
            else if (currentHour >= 22 || currentHour <= 3) {
                if (name.includes('maggi') || name.includes('roll') || name.includes('cake')) score *= 1.3;
            }

            return score;
        };

        const sortedItems = rawItems
            .map(item => ({
                id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                outletId: item.outlet_id,
                outletName: item.outlets && !Array.isArray(item.outlets) ? (item.outlets as any).name : 'Unknown',
                average_rating: item.average_rating,
                rating_count: item.rating_count,
                is_veg: item.is_veg,
                trendingScore: trendingScore(item)
            }))
            .sort((a, b) => b.trendingScore - a.trendingScore)
            .slice(0, 6); // Return top 6 dynamic trending 

        res.json(sortedItems);
    } catch (error) {
        console.error('Dynamic trending error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
