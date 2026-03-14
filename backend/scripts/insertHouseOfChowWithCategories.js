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

    // DELETE all existing items for House of Chow to ensure a clean slate matching exactly the image
    const { error: deleteErr } = await supabase.from('menu_items').delete().eq('outlet_id', outletId);
    if (deleteErr) {
        console.error("Failed to delete existing items:", deleteErr);
    } else {
        console.log("Cleared existing House of Chow menu items.");
    }

    // The items from the House of Chow image (First Image) with categories in description
    const newItems = [
        // Shakes
        { outlet_id: outletId, name: 'Biscoff Shake', price: 149, is_veg: true, description: 'Category: Shakes' },
        { outlet_id: outletId, name: 'Oreo Shake', price: 149, is_veg: true, description: 'Category: Shakes' },
        { outlet_id: outletId, name: 'Cold coffee', price: 149, is_veg: true, description: 'Category: Shakes' },
        { outlet_id: outletId, name: 'Vanilla Shake', price: 149, is_veg: true, description: 'Category: Shakes' },
        { outlet_id: outletId, name: 'Salted Caramel Shake', price: 149, is_veg: true, description: 'Category: Shakes' },

        // Iced Tea
        { outlet_id: outletId, name: 'Lemon Iced Tea', price: 89, is_veg: true, description: 'Category: Iced Tea' },
        { outlet_id: outletId, name: 'Peach Iced Tea', price: 89, is_veg: true, description: 'Category: Iced Tea' },
        { outlet_id: outletId, name: 'Berry Iced Tea', price: 89, is_veg: true, description: 'Category: Iced Tea' },

        // Sparkling
        { outlet_id: outletId, name: 'Fresh Lime', price: 99, is_veg: true, description: 'Category: Sparkling' },
        { outlet_id: outletId, name: 'Fruit Beer', price: 99, is_veg: true, description: 'Category: Sparkling' },
        { outlet_id: outletId, name: 'Masala Lemonade', price: 99, is_veg: true, description: 'Category: Sparkling' },

        // Pick A Meal
        { outlet_id: outletId, name: 'Chow Box (Veg)', price: 199, is_veg: true, description: 'Category: Pick A Meal' },
        { outlet_id: outletId, name: 'Chow Box (Paneer)', price: 229, is_veg: true, description: 'Category: Pick A Meal' },
        { outlet_id: outletId, name: 'Chow Box (Chicken)', price: 249, is_veg: false, description: 'Category: Pick A Meal' },
        { outlet_id: outletId, name: 'Bento Box (Veg)', price: 299, is_veg: true, description: 'Category: Pick A Meal' },
        { outlet_id: outletId, name: 'Bento Box (Paneer)', price: 329, is_veg: true, description: 'Category: Pick A Meal' },
        { outlet_id: outletId, name: 'Bento Box (Chicken)', price: 349, is_veg: false, description: 'Category: Pick A Meal' },

        // Soups
        { outlet_id: outletId, name: 'Veg Hot n Sour Soup', price: 149, is_veg: true, description: 'Category: Veg Soups' },
        { outlet_id: outletId, name: 'Veg Manchow Soup', price: 149, is_veg: true, description: 'Category: Veg Soups' },
        { outlet_id: outletId, name: 'Veg Sweet Corn Soup', price: 149, is_veg: true, description: 'Category: Veg Soups' },
        { outlet_id: outletId, name: 'Veg Thukpa Soup', price: 159, is_veg: true, description: 'Category: Veg Soups' },

        { outlet_id: outletId, name: 'Chicken Hot n Sour Soup', price: 169, is_veg: false, description: 'Category: Non Veg Soups' },
        { outlet_id: outletId, name: 'Chicken Manchow Soup', price: 169, is_veg: false, description: 'Category: Non Veg Soups' },
        { outlet_id: outletId, name: 'Chicken Sweet Corn Soup', price: 169, is_veg: false, description: 'Category: Non Veg Soups' },
        { outlet_id: outletId, name: 'Chicken Thukpa Soup', price: 179, is_veg: false, description: 'Category: Non Veg Soups' },

        // Momos (6 Pcs)
        { outlet_id: outletId, name: 'Veg Steamed Momos', price: 199, is_veg: true, description: 'Category: Momos (6 PCS)' },
        { outlet_id: outletId, name: 'Chicken Steamed Momos', price: 219, is_veg: false, description: 'Category: Momos (6 PCS)' },
        { outlet_id: outletId, name: 'Veg Kurkure Momos', price: 219, is_veg: true, description: 'Category: Momos (6 PCS)' },
        { outlet_id: outletId, name: 'Chicken Kurkure Momos', price: 239, is_veg: false, description: 'Category: Momos (6 PCS)' },

        // Veg Appetizers
        { outlet_id: outletId, name: 'Crispy Chilli Potatoes', price: 169, is_veg: true, description: 'Category: Veg Appetizers' },
        { outlet_id: outletId, name: 'Veg Spring Rolls (5 Pcs)', price: 209, is_veg: true, description: 'Category: Veg Appetizers' },
        { outlet_id: outletId, name: 'Chilli Paneer', price: 249, is_veg: true, description: 'Category: Veg Appetizers' },

        // Non Veg Appetizers
        { outlet_id: outletId, name: 'Chicken Drumsticks', price: 249, is_veg: false, description: 'Category: Non Veg Appetizers' },
        { outlet_id: outletId, name: 'Chicken Spring Rolls (5 Pcs)', price: 249, is_veg: false, description: 'Category: Non Veg Appetizers' },
        { outlet_id: outletId, name: 'Chilli Chicken Dry', price: 249, is_veg: false, description: 'Category: Non Veg Appetizers' }
    ];

    console.log(`Inserting ${newItems.length} items...`);

    // Batch insert 50 at a time to be safe
    const chunkSize = 50;
    for (let i = 0; i < newItems.length; i += chunkSize) {
        const chunk = newItems.slice(i, i + chunkSize);
        const { error } = await supabase.from('menu_items').insert(chunk);
        if (error) {
            console.error("Error inserting chunk:", error);
        } else {
            console.log(`Inserted items ${i} to ${i + chunk.length}`);
        }
    }

    console.log(`Successfully added exactly items to House of Chow with categories!`);
}

run();
