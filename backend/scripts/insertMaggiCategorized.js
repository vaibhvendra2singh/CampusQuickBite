const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
if (!url) throw new Error('Missing SUPABASE_URL environment variable');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
const supabase = createClient(url, key);

async function run() {
    console.log('Fetching Maggi Hotspot outlet ID...');
    const { data: outlet, error: outletErr } = await supabase
        .from('outlets')
        .select('id')
        .ilike('name', '%Maggi Hotspot%')
        .single();

    if (outletErr || !outlet) {
        return console.error("Could not find outlet:", outletErr);
    }
    const outletId = outlet.id;

    await supabase.from('menu_items').delete().eq('outlet_id', outletId);

    const newItems = [
        // Veg Maggi
        { outlet_id: outletId, name: 'Original Maggi', price: 50, is_veg: true, description: 'Category: Maggi' },
        { outlet_id: outletId, name: 'Vegetable Soupy Maggi', price: 60, is_veg: true, description: 'Category: Maggi' },
        { outlet_id: outletId, name: 'Chilli Maggi', price: 60, is_veg: true, description: 'Category: Maggi' },
        { outlet_id: outletId, name: 'Tomato Chatpata Maggi', price: 60, is_veg: true, description: 'Category: Maggi' },
        { outlet_id: outletId, name: 'Double Masala Maggi', price: 60, is_veg: true, description: 'Category: Maggi' },
        { outlet_id: outletId, name: 'Biryani Maggi', price: 70, is_veg: true, description: 'Category: Maggi' },
        { outlet_id: outletId, name: 'Chilli Garlic Maggi', price: 70, is_veg: true, description: 'Category: Maggi' },
        { outlet_id: outletId, name: 'Oregano Maggi', price: 70, is_veg: true, description: 'Category: Maggi' },
        { outlet_id: outletId, name: 'Cheese Maggi', price: 70, is_veg: true, description: 'Category: Maggi' },
        { outlet_id: outletId, name: 'Butter Maggi', price: 70, is_veg: true, description: 'Category: Maggi' },
        { outlet_id: outletId, name: 'Peri peri Maggi', price: 70, is_veg: true, description: 'Category: Maggi' },
        { outlet_id: outletId, name: 'Corn Maggi', price: 80, is_veg: true, description: 'Category: Maggi' },
        { outlet_id: outletId, name: 'Paneer Maggi', price: 90, is_veg: true, description: 'Category: Maggi' },
        // Non-Veg Maggi (Contains Egg or Chicken)
        { outlet_id: outletId, name: 'Egg Maggi', price: 70, is_veg: false, description: 'Category: Non-Veg Maggi' },
        { outlet_id: outletId, name: 'Double Egg Maggi', price: 80, is_veg: false, description: 'Category: Non-Veg Maggi' },
        { outlet_id: outletId, name: 'Omlete Maggi', price: 90, is_veg: false, description: 'Category: Non-Veg Maggi' },
        { outlet_id: outletId, name: 'Chicken Maggi', price: 90, is_veg: false, description: 'Category: Non-Veg Maggi' },
        // Nutrilicious Healthier Maggi
        { outlet_id: outletId, name: 'Oats Maggi', price: 70, is_veg: true, description: 'Category: Nutrilicious Maggi' },
        { outlet_id: outletId, name: 'Atta Maggi', price: 70, is_veg: true, description: 'Category: Nutrilicious Maggi' },
        // Add ons
        { outlet_id: outletId, name: 'Extra Masala', price: 10, is_veg: true, description: 'Category: Add-ons' },
        { outlet_id: outletId, name: 'Extra Egg', price: 10, is_veg: false, description: 'Category: Add-ons' },
        { outlet_id: outletId, name: 'Extra Cheese', price: 20, is_veg: true, description: 'Category: Add-ons' },
        { outlet_id: outletId, name: 'Extra Chicken', price: 30, is_veg: false, description: 'Category: Add-ons' }
    ];

    const chunkSize = 50;
    for (let i = 0; i < newItems.length; i += chunkSize) {
        await supabase.from('menu_items').insert(newItems.slice(i, i + chunkSize));
    }
    console.log(`Successfully added categorized items for Maggi Hotspot`);
}

run();
