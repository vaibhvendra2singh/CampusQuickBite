import path from 'path';
require('dotenv').config({ path: path.join(__dirname, '../.env') });
import { supabase } from '../src/config/supabase';

async function test() {
    // 1. Get an outlet ID
    const { data: outlets } = await supabase.from('outlets').select('id, owner_id');
    const outlet = outlets?.[0];
    if (!outlet) return console.log('No outlet');
    
    console.log('Testing outlet:', outlet.id);
    
    // 2. Mock what the analytics controller does
    let query = supabase
        .from('orders')
        .select('id, total_amount, created_at, status')
        .eq('outlet_id', outlet.id)
        .eq('status', 'completed');
        
    const { data } = await query.order('created_at', { ascending: true });
    console.log('Orders found:', data?.length);

    const { data: authUser } = await supabase.auth.admin.getUserById(outlet.owner_id);
    console.log("Owner existence:", !!authUser);

    console.log("Test completed.");
}

test();
