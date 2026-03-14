const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(url, key);

async function run() {
    console.log('Fetching Southern Stories outlet ID...');
    const { data: outlet, error: outletErr } = await supabase
        .from('outlets')
        .select('id')
        .ilike('name', '%Southern Stories%')
        .single();

    if (outletErr || !outlet) {
        return console.error("Could not find outlet:", outletErr);
    }
    const outletId = outlet.id;

    await supabase.from('menu_items').delete().eq('outlet_id', outletId);

    const newItems = [
        // DOSAS
        { outlet_id: outletId, name: 'Plain Dosa', price: 85, is_veg: true, description: 'Category: Dosas' },
        { outlet_id: outletId, name: 'Masala Dosa', price: 95, is_veg: true, description: 'Category: Dosas' },
        { outlet_id: outletId, name: 'Mysore Masala Dosa', price: 130, is_veg: true, description: 'Category: Dosas' },
        { outlet_id: outletId, name: 'Rawa Dosa', price: 105, is_veg: true, description: 'Category: Dosas' },
        { outlet_id: outletId, name: 'Rawa Onion Dosa', price: 120, is_veg: true, description: 'Category: Dosas' },
        { outlet_id: outletId, name: 'Rawa Masala Dosa', price: 130, is_veg: true, description: 'Category: Dosas' },
        { outlet_id: outletId, name: 'Rawa Paneer Dosa', price: 175, is_veg: true, description: 'Category: Dosas' },
        { outlet_id: outletId, name: 'Podi Butter Masala Dosa', price: 120, is_veg: true, description: 'Category: Dosas' },
        { outlet_id: outletId, name: 'Paper Masala Dosa', price: 180, is_veg: true, description: 'Category: Dosas' },
        { outlet_id: outletId, name: 'Gee Roast Masala Dosa', price: 145, is_veg: true, description: 'Category: Dosas' },
        { outlet_id: outletId, name: 'Cheese Dosa', price: 145, is_veg: true, description: 'Category: Dosas' },
        { outlet_id: outletId, name: 'Paneer Dosa', price: 150, is_veg: true, description: 'Category: Dosas' },
        // UTTAPAM
        { outlet_id: outletId, name: 'Onion Uttapam', price: 95, is_veg: true, description: 'Category: Uttapam' },
        { outlet_id: outletId, name: 'Tomato Onion Uttapam', price: 110, is_veg: true, description: 'Category: Uttapam' },
        { outlet_id: outletId, name: 'Veg Uttapam', price: 120, is_veg: true, description: 'Category: Uttapam' },
        { outlet_id: outletId, name: 'Paneer Uttapam', price: 150, is_veg: true, description: 'Category: Uttapam' },
        { outlet_id: outletId, name: 'Mixed Uttapam', price: 155, is_veg: true, description: 'Category: Uttapam' },
        // FLAT BREADS
        { outlet_id: outletId, name: 'Aloo Payaaz Paratha (1pc)', price: 75, is_veg: true, description: 'Category: Flat Breads' },
        { outlet_id: outletId, name: 'Aloo Payaaz Paratha (2pcs)', price: 135, is_veg: true, description: 'Category: Flat Breads' },
        { outlet_id: outletId, name: 'Mixed Veg Paratha (1pc)', price: 80, is_veg: true, description: 'Category: Flat Breads' },
        { outlet_id: outletId, name: 'Mixed Veg Paratha (2pcs)', price: 145, is_veg: true, description: 'Category: Flat Breads' },
        { outlet_id: outletId, name: 'Gobhi Paratha (1pc)', price: 80, is_veg: true, description: 'Category: Flat Breads' },
        { outlet_id: outletId, name: 'Gobhi Paratha (2pcs)', price: 145, is_veg: true, description: 'Category: Flat Breads' },
        { outlet_id: outletId, name: 'Paneer Paratha (1pc)', price: 95, is_veg: true, description: 'Category: Flat Breads' },
        { outlet_id: outletId, name: 'Paneer Paratha (2pcs)', price: 175, is_veg: true, description: 'Category: Flat Breads' },
        { outlet_id: outletId, name: 'Paratha with Paneer Korma', price: 160, is_veg: true, description: 'Category: Flat Breads' },
        // SIDES
        { outlet_id: outletId, name: 'Idli Sambhar', price: 85, is_veg: true, description: 'Category: Sides' },
        { outlet_id: outletId, name: 'Vada Sambhar', price: 90, is_veg: true, description: 'Category: Sides' },
        { outlet_id: outletId, name: 'Upma', price: 85, is_veg: true, description: 'Category: Sides' },
        { outlet_id: outletId, name: 'Poha', price: 85, is_veg: true, description: 'Category: Sides' },
        { outlet_id: outletId, name: 'Pav Bhaji', price: 100, is_veg: true, description: 'Category: Sides' },
        { outlet_id: outletId, name: 'Channa Kulcha', price: 120, is_veg: true, description: 'Category: Sides' },
        { outlet_id: outletId, name: 'Poori Bhaji', price: 120, is_veg: true, description: 'Category: Sides' },
        { outlet_id: outletId, name: 'Choole Bhature', price: 150, is_veg: true, description: 'Category: Sides' },
        { outlet_id: outletId, name: 'Rajma Rice Bowl', price: 145, is_veg: true, description: 'Category: Sides' },
        { outlet_id: outletId, name: 'Choole Rice Bowl', price: 145, is_veg: true, description: 'Category: Sides' },
        { outlet_id: outletId, name: 'Hyderabadi Veg Rice', price: 180, is_veg: true, description: 'Category: Sides' },
        // BEVERAGES
        { outlet_id: outletId, name: 'Filter Coffee', price: 40, is_veg: true, description: 'Category: Beverages' },
        { outlet_id: outletId, name: 'Lassi', price: 65, is_veg: true, description: 'Category: Beverages' },
        { outlet_id: outletId, name: 'Mango Shake', price: 85, is_veg: true, description: 'Category: Beverages' },
        { outlet_id: outletId, name: 'Classic Cold Coffee', price: 85, is_veg: true, description: 'Category: Beverages' },
        { outlet_id: outletId, name: 'Hazelnut Cold Coffee', price: 90, is_veg: true, description: 'Category: Beverages' },
        { outlet_id: outletId, name: 'Irish Cold Coffee', price: 90, is_veg: true, description: 'Category: Beverages' },
        { outlet_id: outletId, name: 'Caramel Cold Coffee', price: 90, is_veg: true, description: 'Category: Beverages' },
        { outlet_id: outletId, name: 'KitKat Coffee Shake', price: 90, is_veg: true, description: 'Category: Beverages' },
        { outlet_id: outletId, name: 'Oreo Coffee Shake', price: 90, is_veg: true, description: 'Category: Beverages' }
    ];

    const chunkSize = 50;
    for (let i = 0; i < newItems.length; i += chunkSize) {
        await supabase.from('menu_items').insert(newItems.slice(i, i + chunkSize));
    }
    console.log(`Successfully added categorized items for Southern Stories`);
}

run();
