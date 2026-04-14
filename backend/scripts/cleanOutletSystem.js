const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
if (!url) throw new Error('Missing SUPABASE_URL environment variable');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
const supabase = createClient(url, key);

async function cleanDatabase() {
    console.log('🚀 Starting deep database cleanup...');

    try {
        // 1. Clear Ratings
        console.log('Cleaning ratings...');
        await supabase.from('ratings').delete().neq('id', 0);

        // 2. Clear Payments
        console.log('Cleaning payments...');
        await supabase.from('payments').delete().neq('id', 0);

        // 3. Clear Order Items
        console.log('Cleaning order_items...');
        await supabase.from('order_items').delete().neq('id', 0);

        // 4. Clear Orders
        console.log('Cleaning orders...');
        await supabase.from('orders').delete().neq('id', 0);

        // 5. Clear Menu Tags
        console.log('Cleaning menu_item_tags...');
        // Note: some schemas use composite keys, but delete with a broad filter usually works in Supabase
        await supabase.from('menu_item_tags').delete().neq('tag', '___NON_EXISTENT___');

        // 6. Clear Menu Items
        console.log('Cleaning menu_items...');
        await supabase.from('menu_items').delete().neq('id', 0);

        // 7. Clear Cart Items
        console.log('Cleaning cart_items...');
        await supabase.from('cart_items').delete().neq('id', 0);

        // 8. Clear Outlets
        console.log('Cleaning outlets...');
        await supabase.from('outlets').delete().neq('id', 0);

        console.log('\n✅ Cleanup complete. All outlet-related records removed.');
        console.log('⚠️  Note: Users/Auth accounts preserved as requested.');

    } catch (err) {
        console.error('CRITICAL ERROR DURING CLEANUP:', err);
    }
}

cleanDatabase();
