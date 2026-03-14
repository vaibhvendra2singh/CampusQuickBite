const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
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
    console.log(`Found Maggi Hotspot ID: ${outletId}`);

    // DELETE all existing items for Maggi Hotspot to ensure a clean slate matching exactly the image
    const { error: deleteErr } = await supabase.from('menu_items').delete().eq('outlet_id', outletId);
    if (deleteErr) {
        console.error("Failed to delete existing items:", deleteErr);
    } else {
        console.log("Cleared existing Maggi Hotspot menu items.");
    }

    // The items from the SINGLE provided image
    const newItems = [
        // Veg Maggi
        { outlet_id: outletId, name: 'Original Maggi', price: 50, is_veg: true },
        { outlet_id: outletId, name: 'Vegetable Soupy Maggi', price: 60, is_veg: true },
        { outlet_id: outletId, name: 'Chilli Maggi', price: 60, is_veg: true },
        { outlet_id: outletId, name: 'Tomato Chatpata Maggi', price: 60, is_veg: true },
        { outlet_id: outletId, name: 'Double Masala Maggi', price: 60, is_veg: true },
        { outlet_id: outletId, name: 'Biryani Maggi', price: 70, is_veg: true },
        { outlet_id: outletId, name: 'Chilli Garlic Maggi', price: 70, is_veg: true },
        { outlet_id: outletId, name: 'Oregano Maggi', price: 70, is_veg: true },
        { outlet_id: outletId, name: 'Cheese Maggi', price: 70, is_veg: true },
        { outlet_id: outletId, name: 'Butter Maggi', price: 70, is_veg: true },
        { outlet_id: outletId, name: 'Peri peri Maggi', price: 70, is_veg: true },
        { outlet_id: outletId, name: 'Corn Maggi', price: 80, is_veg: true },
        { outlet_id: outletId, name: 'Paneer Maggi', price: 90, is_veg: true },

        // Non-Veg Maggi (Contains Egg or Chicken)
        { outlet_id: outletId, name: 'Egg Maggi', price: 70, is_veg: false },
        { outlet_id: outletId, name: 'Double Egg Maggi', price: 80, is_veg: false },
        { outlet_id: outletId, name: 'Omlete Maggi', price: 90, is_veg: false },
        { outlet_id: outletId, name: 'Chicken Maggi', price: 90, is_veg: false },

        // Nutrilicious Healthier Maggi
        { outlet_id: outletId, name: 'Oats Maggi', price: 70, is_veg: true },
        { outlet_id: outletId, name: 'Atta Maggi', price: 70, is_veg: true },

        // Add ons
        { outlet_id: outletId, name: 'Extra Masala (Add-on)', price: 10, is_veg: true },
        { outlet_id: outletId, name: 'Extra Egg (Add-on)', price: 10, is_veg: false },
        { outlet_id: outletId, name: 'Extra Cheese (Add-on)', price: 20, is_veg: true },
        { outlet_id: outletId, name: 'Extra Chicken (Add-on)', price: 30, is_veg: false }
    ];

    console.log(`Inserting ${newItems.length} items...`);

    const { error } = await supabase.from('menu_items').insert(newItems);
    if (error) {
        console.error("Error inserting items:", error);
    } else {
        console.log(`Successfully added all identical items to Maggi Hotspot from the requested image.`);
    }
}

run();
