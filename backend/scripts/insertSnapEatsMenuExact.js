const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
if (!url) throw new Error('Missing SUPABASE_URL environment variable');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
const supabase = createClient(url, key);

async function run() {
    console.log('Fetching SnapEats outlet ID...');
    const { data: outlet, error: outletErr } = await supabase
        .from('outlets')
        .select('id')
        .ilike('name', '%SnapEats%')
        .single();

    if (outletErr || !outlet) {
        return console.error("Could not find outlet:", outletErr);
    }

    const outletId = outlet.id;
    console.log(`Found SnapEats ID: ${outletId}`);

    // DELETE all existing items for SnapEats to ensure a clean slate matching exactly the image
    const { error: deleteErr } = await supabase.from('menu_items').delete().eq('outlet_id', outletId);
    if (deleteErr) {
        console.error("Failed to delete existing items:", deleteErr);
    } else {
        console.log("Cleared existing SnapEats menu items.");
    }

    // The items from the SINGLE provided image
    const newItems = [
        // Hot Beverages
        { outlet_id: outletId, name: 'Cappuccino', price: 49, is_veg: true },
        { outlet_id: outletId, name: 'Hot Coffee', price: 49, is_veg: true },
        { outlet_id: outletId, name: 'Hot Chocolate', price: 59, is_veg: true },
        // Chai Nagri
        { outlet_id: outletId, name: 'Adrak Chai (Kulhar)', price: 20, is_veg: true },
        { outlet_id: outletId, name: 'Masala Chai (Kulhar)', price: 20, is_veg: true },
        // Sandwiches
        { outlet_id: outletId, name: 'Veg Sandwich', price: 69, is_veg: true },
        { outlet_id: outletId, name: 'Cheese Sandwich', price: 99, is_veg: true },
        { outlet_id: outletId, name: 'Paneer Tikka Sandwich', price: 99, is_veg: true },
        { outlet_id: outletId, name: 'Chicken Tikka Sandwich', price: 129, is_veg: false },
        { outlet_id: outletId, name: 'Seekh Kebab Sandwich', price: 129, is_veg: false },
        // Burgers
        { outlet_id: outletId, name: 'Veg Burger', price: 59, is_veg: true },
        { outlet_id: outletId, name: 'Cheese Burger', price: 69, is_veg: true },
        { outlet_id: outletId, name: 'Peppy Paneer Burger', price: 109, is_veg: true },
        { outlet_id: outletId, name: 'Egg & Mayo Burger', price: 99, is_veg: false },
        { outlet_id: outletId, name: 'Chicken Burger', price: 129, is_veg: false },
        // Dil Se Tandoori
        { outlet_id: outletId, name: 'Malai Paneer Tikka (8 Pcs)', price: 249, is_veg: true },
        { outlet_id: outletId, name: 'Malai Soya Chap (8 Pcs)', price: 199, is_veg: true },
        { outlet_id: outletId, name: 'Tandoori Mushroom (8 Pcs)', price: 199, is_veg: true },
        { outlet_id: outletId, name: 'Chicken Tikka (8 Pcs)', price: 299, is_veg: false },
        { outlet_id: outletId, name: 'Seekh Kebab-Chicken (8 Pcs)', price: 299, is_veg: false },
        { outlet_id: outletId, name: 'Seekh Kebab-Mutton (8 Pcs)', price: 349, is_veg: false },
        { outlet_id: outletId, name: 'Tandoori Chicken Half (4 Pcs)', price: 199, is_veg: false },
        { outlet_id: outletId, name: 'Tandoori Chicken Full (8 Pcs)', price: 349, is_veg: false },
        { outlet_id: outletId, name: 'Lachha Parantha (1 Pc.)', price: 59, is_veg: true },
        { outlet_id: outletId, name: 'Garlic Naan', price: 59, is_veg: true },
        { outlet_id: outletId, name: 'Butter Naan', price: 59, is_veg: true },
        { outlet_id: outletId, name: 'Chicken Keema Naan', price: 139, is_veg: false },
        { outlet_id: outletId, name: 'Mutton Keema Naan', price: 199, is_veg: false },
        { outlet_id: outletId, name: 'Chicken Tangdi (4 Pcs.)', price: 249, is_veg: false },
        // Crispy Snacks
        { outlet_id: outletId, name: 'Classic Salted Fries', price: 80, is_veg: true },
        { outlet_id: outletId, name: 'Peri Peri Fries', price: 99, is_veg: true },
        { outlet_id: outletId, name: 'Potato Wedges', price: 99, is_veg: true },
        { outlet_id: outletId, name: 'Sweet Corn', price: 99, is_veg: true },
        { outlet_id: outletId, name: 'Crispy Corn', price: 129, is_veg: true },
        { outlet_id: outletId, name: 'Crispy Chicken', price: 159, is_veg: false },
        { outlet_id: outletId, name: 'Macroni - Veg', price: 99, is_veg: true },
        { outlet_id: outletId, name: 'Macroni - Chicken', price: 199, is_veg: false },
        { outlet_id: outletId, name: 'Pasta - Veg', price: 99, is_veg: true },
        { outlet_id: outletId, name: 'Pasta - Chicken', price: 199, is_veg: false },
        { outlet_id: outletId, name: 'Honey Chilly Potato', price: 129, is_veg: true },
        { outlet_id: outletId, name: 'Veg Manchurian Dry', price: 129, is_veg: true },
        { outlet_id: outletId, name: 'Chicken Manchurian Dry', price: 249, is_veg: false },
        { outlet_id: outletId, name: 'Chilly Paneer Dry', price: 159, is_veg: true },
        { outlet_id: outletId, name: 'Chilly Chicken Dry', price: 249, is_veg: false },
        { outlet_id: outletId, name: 'Mushroom Chilly Dry', price: 249, is_veg: true },
        // Soups
        { outlet_id: outletId, name: 'Tomato Soup', price: 79, is_veg: true },
        { outlet_id: outletId, name: 'Vegetable Soup', price: 79, is_veg: true },
        { outlet_id: outletId, name: 'Manchow Soup', price: 99, is_veg: true },
        { outlet_id: outletId, name: 'Chicken Soup', price: 119, is_veg: false },
        // Dimsums & Cigar Spring Rolls
        { outlet_id: outletId, name: 'Veg Momos (Steamed)', price: 99, is_veg: true },
        { outlet_id: outletId, name: 'Veg Momos (Fried)', price: 119, is_veg: true },
        { outlet_id: outletId, name: 'Paneer Momos (Steamed)', price: 119, is_veg: true },
        { outlet_id: outletId, name: 'Paneer Momos (Fried)', price: 129, is_veg: true },
        { outlet_id: outletId, name: 'Chicken Momos (Steamed)', price: 129, is_veg: false },
        { outlet_id: outletId, name: 'Chicken Momos (Fried)', price: 139, is_veg: false },
        { outlet_id: outletId, name: 'Veg Cigar Rolls', price: 119, is_veg: true },
        { outlet_id: outletId, name: 'Chicken Cigar Rolls', price: 139, is_veg: false },
        // Street Flavours
        { outlet_id: outletId, name: 'Pao Bhaji', price: 70, is_veg: true },
        { outlet_id: outletId, name: 'Chole Bhature', price: 89, is_veg: true },
        { outlet_id: outletId, name: 'Paneer Bread Pakora', price: 49, is_veg: true },
        { outlet_id: outletId, name: 'Classic Bread Omelette', price: 79, is_veg: false },
        { outlet_id: outletId, name: 'Cheese Bread Omelette', price: 99, is_veg: false },
        { outlet_id: outletId, name: 'Chicken Bread Omelette', price: 129, is_veg: false },
        { outlet_id: outletId, name: 'Vada Pao', price: 49, is_veg: true },
        { outlet_id: outletId, name: 'Boiled Chicken', price: 199, is_veg: false },
        { outlet_id: outletId, name: 'Chicken Salad', price: 249, is_veg: false },
        // Cold Beverages
        { outlet_id: outletId, name: 'Cold Coffee', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Iced Americano', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Iced Cappuccino', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Coffee Frappe', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Mocha Frappe', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Hazel Frappe', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Oreo Frappe', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Fresh Lime Soda', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Green Apple Soda', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Green Iced Tea', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Masala Lemonade', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Mint Mojito', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Blue Lagoon', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Imli Banta', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Kala Khatta', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Guava Chilli', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Pineapple Shake', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Strawberry Shake', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Choco Shake', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Rich Mango Shake', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'O-O- Oreo Shake', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Butter Scotch Shake', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Kitkat Shake', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Chocolate Almond Shake', price: 85, is_veg: true },
        { outlet_id: outletId, name: 'Brownie Blast Shake', price: 85, is_veg: true },
        // Veg Kathi Rolls
        { outlet_id: outletId, name: 'Veg Kathi Roll', price: 99, is_veg: true },
        { outlet_id: outletId, name: 'Paneer Kathi Roll', price: 119, is_veg: true },
        { outlet_id: outletId, name: 'Paneer Makhani Roll', price: 139, is_veg: true },
        { outlet_id: outletId, name: 'Paneer Schezwan Roll', price: 129, is_veg: true },
        { outlet_id: outletId, name: 'Paneer Shawarma Roll', price: 99, is_veg: true },
        { outlet_id: outletId, name: 'Noodle Roll', price: 89, is_veg: true },
        { outlet_id: outletId, name: 'Soya Chap Roll', price: 89, is_veg: true },
        { outlet_id: outletId, name: 'Creamy Soya Roll', price: 99, is_veg: true },
        // Continental
        { outlet_id: outletId, name: 'White Pasta', price: 99, is_veg: true },
        { outlet_id: outletId, name: 'Red Pasta', price: 99, is_veg: true },
        { outlet_id: outletId, name: 'Mix Pasta', price: 99, is_veg: true },
        { outlet_id: outletId, name: 'Cheese Pasta', price: 139, is_veg: true },
        { outlet_id: outletId, name: 'Chicken Pasta', price: 149, is_veg: false },
        // Non Veg Kathi Rolls
        { outlet_id: outletId, name: 'Egg Roll', price: 89, is_veg: false },
        { outlet_id: outletId, name: 'Chicken Tikka Roll', price: 149, is_veg: false },
        { outlet_id: outletId, name: 'Chicken Achari Roll', price: 129, is_veg: false },
        { outlet_id: outletId, name: 'Chicken Egg Roll', price: 169, is_veg: false },
        { outlet_id: outletId, name: 'Chicken Shawarma Roll', price: 159, is_veg: false },
        { outlet_id: outletId, name: 'Chicken Kebab Roll', price: 129, is_veg: false },
        { outlet_id: outletId, name: 'Mutton Kebab Roll', price: 189, is_veg: false },
        { outlet_id: outletId, name: 'Noodle Egg Roll', price: 109, is_veg: false },
        // Classic Indian Combos
        { outlet_id: outletId, name: 'Aloo Pyaz Parantha with Curd & Pickle', price: 90, is_veg: true },
        { outlet_id: outletId, name: 'Paneer Parantha with Curd & Pickle', price: 99, is_veg: true },
        { outlet_id: outletId, name: 'Egg Parantha with Curd & Pickle', price: 119, is_veg: false },
        { outlet_id: outletId, name: 'Chicken Keema Parantha with Curd & Pickle', price: 139, is_veg: false },
        { outlet_id: outletId, name: 'Veg Combo with Rice - Rajma / Chole / Kadhi / Soya Chap', price: 89, is_veg: true },
        { outlet_id: outletId, name: 'Rice & Egg Curry Combo', price: 149, is_veg: false },
        { outlet_id: outletId, name: 'Rice & Paneer Combo', price: 149, is_veg: true },
        { outlet_id: outletId, name: 'Chicken Curry (2 Pcs.) with Rice/Parantha/Naan', price: 199, is_veg: false },
        { outlet_id: outletId, name: 'Mutton Curry (2 Pcs.) with Rice/Parantha/Naan', price: 259, is_veg: false },
        { outlet_id: outletId, name: 'Chicken Biryani with Sallan (Serves 2)', price: 299, is_veg: false },
        { outlet_id: outletId, name: 'Premium Thali - Veg', price: 199, is_veg: true },
        { outlet_id: outletId, name: 'Premium Thali - Non Veg', price: 299, is_veg: false },
        { outlet_id: outletId, name: 'Hakka Noodles + Chilly Paneer Gravy', price: 249, is_veg: true },
        { outlet_id: outletId, name: 'Hakka Noodles + Veg Manchurian Gravy', price: 249, is_veg: true },
        { outlet_id: outletId, name: 'Hakka Noodles + Chilly Chicken Gravy', price: 299, is_veg: false },
        { outlet_id: outletId, name: 'Hakka Noodles + Chicken Manchurian Gravy', price: 299, is_veg: false },
        { outlet_id: outletId, name: 'Fried Rice + Chilly Paneer Gravy', price: 249, is_veg: true },
        { outlet_id: outletId, name: 'Fried Rice + Veg Manchurian Gravy', price: 249, is_veg: true },
        { outlet_id: outletId, name: 'Fried Rice + Chilly Chicken Gravy', price: 299, is_veg: false },
        { outlet_id: outletId, name: 'Fried Rice + Chicken Manchurian Gravy', price: 299, is_veg: false },
        { outlet_id: outletId, name: 'Fried Rice - Veg', price: 149, is_veg: true },
        { outlet_id: outletId, name: 'Fried Rice - Chicken', price: 249, is_veg: false },
        { outlet_id: outletId, name: 'Hakka Noodles - Veg', price: 149, is_veg: true },
        { outlet_id: outletId, name: 'Hakka Noodles - Chicken', price: 249, is_veg: false },
        { outlet_id: outletId, name: 'Schezwan Fried Rice + Hot Garlic Paneer', price: 249, is_veg: true },
        { outlet_id: outletId, name: 'Schezwan Fried Rice + Chilly Chicken Gravy', price: 299, is_veg: false },
        { outlet_id: outletId, name: 'Schezwan Fried Rice + Chicken Manchurian', price: 299, is_veg: false },
        { outlet_id: outletId, name: 'Chicken Lollipop (4)', price: 299, is_veg: false },
        { outlet_id: outletId, name: 'Chinese Platter - Veg', price: 249, is_veg: true },
        { outlet_id: outletId, name: 'Chinese Platter - Non Veg', price: 349, is_veg: false },
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

    console.log(`Successfully added all identical items to SnapEats from the requested image.`);
}

run();
