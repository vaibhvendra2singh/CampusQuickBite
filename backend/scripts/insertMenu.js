const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(url, key);

async function run() {
    console.log('Fetching House of Chow outlet ID...');
    const { data: outlet, error: outletErr } = await supabase
        .from('outlets')
        .select('id')
        .ilike('name', '%House of Chow%')
        .single();

    if (outletErr || !outlet) {
        return console.error("Could not find outlet:", outletErr);
    }

    const outletId = outlet.id;
    console.log(`Found House of Chow ID: ${outletId}`);

    const newItems = [
        // Shakes & Beverages
        { outlet_id: outletId, name: 'Biscoff Shake', price: 149, is_veg: true },
        { outlet_id: outletId, name: 'Oreo Shake', price: 149, is_veg: true },
        { outlet_id: outletId, name: 'Cold Coffee', price: 149, is_veg: true },
        { outlet_id: outletId, name: 'Lemon Iced Tea', price: 89, is_veg: true },
        { outlet_id: outletId, name: 'Peach Iced Tea', price: 89, is_veg: true },
        { outlet_id: outletId, name: 'Fresh Lime', price: 99, is_veg: true },
        { outlet_id: outletId, name: 'Fruit Beer Non-Alc', price: 99, is_veg: true },

        // Appetizers
        { outlet_id: outletId, name: 'Crispy Chilli Potatoes', price: 169, is_veg: true },
        { outlet_id: outletId, name: 'Veg Spring Rolls (5 Pcs)', price: 209, is_veg: true },
        { outlet_id: outletId, name: 'Chilli Paneer', price: 249, is_veg: true },
        { outlet_id: outletId, name: 'Chicken Drumsticks', price: 249, is_veg: false },
        { outlet_id: outletId, name: 'Chicken Spring Rolls (5 Pcs)', price: 249, is_veg: false },
        { outlet_id: outletId, name: 'Chilli Chicken Dry', price: 249, is_veg: false },

        // Soups
        { outlet_id: outletId, name: 'Veg Hot n Sour Soup', price: 149, is_veg: true },
        { outlet_id: outletId, name: 'Veg Manchow Soup', price: 149, is_veg: true },
        { outlet_id: outletId, name: 'Chicken Hot n Sour Soup', price: 169, is_veg: false },
        { outlet_id: outletId, name: 'Chicken Manchow Soup', price: 169, is_veg: false },

        // Momos
        { outlet_id: outletId, name: 'Veg Steamed Momos', price: 199, is_veg: true },
        { outlet_id: outletId, name: 'Chicken Steamed Momos', price: 219, is_veg: false },
        { outlet_id: outletId, name: 'Veg Kurkure Momos', price: 219, is_veg: true },
        { outlet_id: outletId, name: 'Chicken Kurkure Momos', price: 239, is_veg: false },

        // Meals & Boxes
        { outlet_id: outletId, name: 'Veg Chow Box', price: 199, is_veg: true },
        { outlet_id: outletId, name: 'Paneer Chow Box', price: 229, is_veg: true },
        { outlet_id: outletId, name: 'Chicken Chow Box', price: 249, is_veg: false },
        { outlet_id: outletId, name: 'Veg Bento Box', price: 299, is_veg: true },
        { outlet_id: outletId, name: 'Chicken Bento Box', price: 349, is_veg: false },

        // Burgers, Sandwiches, Wraps
        { outlet_id: outletId, name: 'Chinese Veg Burger', price: 68, is_veg: true },
        { outlet_id: outletId, name: 'Chilli Paneer Burger', price: 84, is_veg: true },
        { outlet_id: outletId, name: 'Chilli Chicken Burger', price: 95, is_veg: false },
        { outlet_id: outletId, name: 'Veggie Wrap', price: 70, is_veg: true },
        { outlet_id: outletId, name: 'Paneer Wrap', price: 90, is_veg: true },
        { outlet_id: outletId, name: 'Chilli Chicken Wrap', price: 140, is_veg: false },
        { outlet_id: outletId, name: 'Veg Sandwich', price: 74, is_veg: true },
        { outlet_id: outletId, name: 'Chilli Chicken Sandwich', price: 147, is_veg: false },

        // Rice & Noodles (Full Portions)
        { outlet_id: outletId, name: 'Chilli Garlic Noodle (Full)', price: 120, is_veg: true },
        { outlet_id: outletId, name: 'Chicken Hakka Noodles (Full)', price: 200, is_veg: false },
        { outlet_id: outletId, name: 'Veg Fried Rice (Full)', price: 140, is_veg: true },
        { outlet_id: outletId, name: 'Chicken Fried Rice (Full)', price: 220, is_veg: false }
    ];

    // Bulk insert with upsert checking on name + outlet_id might be tricky without unique constraints,
    // so we'll just check existence manually or just insert (assuming clean db)

    let insertedCount = 0;
    for (const item of newItems) {
        const { data: existing } = await supabase
            .from('menu_items')
            .select('id')
            .eq('outlet_id', outletId)
            .eq('name', item.name)
            .single();

        if (!existing) {
            const { error } = await supabase.from('menu_items').insert([item]);
            if (!error) insertedCount++;
        }
    }

    console.log(`Successfully added ${insertedCount} new items from the menu images!`);
}

run();
