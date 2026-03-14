const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setupOutlets() {
    console.log('🚀 Setting up fresh outlets...');

    const passwordHash = await bcrypt.hash('password123', 10);

    const vendors = [
        {
            name: 'House of Chow',
            email: 'houseofchow@bennett.edu.in',
            id: '33333333-3333-3333-3333-333333333333',
            location: 'Food Court, First Floor',
            menu: [
                { name: 'Veg Hakka Noodles', price: 120, description: 'Category: Main Course', is_veg: true },
                { name: 'Fried Rice', price: 150, description: 'Category: Main Course', is_veg: true },
                { name: 'Chilli Paneer', price: 180, description: 'Category: Starters', is_veg: true },
                { name: 'Chicken Manchurian', price: 200, description: 'Category: Starters', is_veg: false }
            ]
        },
        {
            name: 'Maggi Hotspot',
            email: 'maggihotspot@bennett.edu.in',
            id: '66666666-6666-6666-6666-666666666666',
            location: 'Near Boys Hostel',
            menu: [
                { name: 'Classic Maggi', price: 40, description: 'Category: Maggi Specials', is_veg: true },
                { name: 'Cheese Maggi', price: 60, description: 'Category: Maggi Specials', is_veg: true },
                { name: 'Butter Maggi', price: 50, description: 'Category: Maggi Specials', is_veg: true },
                { name: 'Egg Maggi', price: 70, description: 'Category: Maggi Specials', is_veg: false }
            ]
        },
        {
            name: 'Southern Stories',
            email: 'southernstories@bennett.edu.in',
            id: '55555555-5555-5555-5555-555555555555',
            location: 'Food Court, First Floor',
            menu: [
                { name: 'Masala Dosa', price: 90, description: 'Category: Dosa Varieties', is_veg: true },
                { name: 'Idli Sambar', price: 70, description: 'Category: Idli & Vada', is_veg: true },
                { name: 'Uttapam', price: 80, description: 'Category: Dosa Varieties', is_veg: true },
                { name: 'Chicken Chettinad', price: 220, description: 'Category: South Indian Non-Veg', is_veg: false }
            ]
        },
        {
            name: 'SnapEats',
            email: 'snapeats@bennett.edu.in',
            id: '44444444-4444-4444-4444-444444444444',
            location: 'Near Academic Block 2',
            menu: [
                { name: 'Veg Sandwich', price: 70, description: 'Category: Sandwiches', is_veg: true },
                { name: 'Paneer Wrap', price: 110, description: 'Category: Wraps & Rolls', is_veg: true },
                { name: 'French Fries', price: 60, description: 'Category: Snacks', is_veg: true },
                { name: 'Chicken Burger', price: 130, description: 'Category: Burgers', is_veg: false }
            ]
        }
    ];

    for (const vendor of vendors) {
        console.log(`Processing ${vendor.name}...`);

        // 1. Update User Password
        const { error: userError } = await supabase
            .from('users')
            .update({ password: passwordHash })
            .eq('email', vendor.email);

        if (userError) console.error(`Error updating user ${vendor.email}:`, userError.message);

        // 2. Insert/Upsert Outlet
        const { data: outlet, error: outletError } = await supabase
            .from('outlets')
            .upsert({
                name: vendor.name,
                location: vendor.location,
                owner_id: vendor.id,
                current_status: 'FAST'
            })
            .select()
            .single();

        if (outletError) {
            console.error(`Error upserting outlet ${vendor.name}:`, outletError.message);
            continue;
        }

        console.log(`Outlet ${vendor.name} is ready. ID: ${outlet.id}`);

        // 3. Clear old menu if any (already cleared but good to be sure)
        await supabase.from('menu_items').delete().eq('outlet_id', outlet.id);

        // 4. Insert Menu Items
        const menuItems = vendor.menu.map(item => ({
            ...item,
            outlet_id: outlet.id,
            availability: true
        }));

        const { error: menuError } = await supabase.from('menu_items').insert(menuItems);
        if (menuError) console.error(`Error inserting menu for ${vendor.name}:`, menuError.message);
        else console.log(`Menu for ${vendor.name} inserted successfully.`);
    }

    console.log('\n✅ All outlets and menus are live!');
}

setupOutlets();
