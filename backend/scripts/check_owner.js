const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = (() => { if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing credentials'); return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); })();

async function run() {
    try {
        const { data: order } = await supabase.from('orders').select('*, outlets(name, id, owner_id)').eq('id', 21).single();
        console.log("Order 21 Outlet:", order.outlets);
        
        const { data: users } = await supabase.from('users').select('id, name').eq('role', 'owner');
        console.log("Owners:", users);
    } catch (e) {
        console.error(e);
    }
}
run();
