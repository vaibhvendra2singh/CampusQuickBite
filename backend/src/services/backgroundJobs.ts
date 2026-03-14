import cron from 'node-cron';
import { supabase } from '../config/supabase';
import logger from './logger';

// Job to clean up stale orders (e.g., Pending orders older than 2 hours)
export const initBackgroundJobs = () => {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        logger.info('🧹 Running background job: Stale Order Cleanup');

        try {
            const twoHoursAgo = new Date();
            twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

            // Find pending orders older than 2 hours
            const { data: staleOrders, error: fetchError } = await supabase
                .from('orders')
                .select('id')
                .eq('status', 'pending')
                .lt('created_at', twoHoursAgo.toISOString());

            if (fetchError) throw fetchError;

            if (staleOrders && staleOrders.length > 0) {
                const ids = staleOrders.map(o => o.id);
                const { error: updateError } = await supabase
                    .from('orders')
                    .update({ status: 'cancelled' })
                    .in('id', ids);

                if (updateError) throw updateError;
                logger.info(`✅ Automatically cancelled ${ids.length} stale orders: ${ids.join(', ')}`);
            } else {
                logger.info('✨ No stale orders found.');
            }
        } catch (error) {
            logger.error('❌ Background Job Error (Stale Order Cleanup):', error);
        }
    });

    logger.info('⏲️  Background cleanup jobs initialized.');
};
