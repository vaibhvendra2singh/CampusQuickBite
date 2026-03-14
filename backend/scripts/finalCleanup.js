const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function cleanData() {
    console.log('--- CAMPUSBITE DATABASE CLEANUP (UUID Edition) ---');

    // Order matters due to foreign key constraints
    const tables = [
        'ratings',
        'payments',
        'order_items',
        'orders',
        'menu_item_tags',
        'menu_items',
        'cart_items',
        'outlets'
    ];

    for (const table of tables) {
        process.stdout.write(`Cleaning table: ${table}... `);

        try {
            // Fetch first row to determine ID column name and type
            const { data: sample } = await supabase.from(table).select('*').limit(1);

            if (sample && sample.length === 0) {
                console.log('Already empty.');
                continue;
            }

            // General delete: not id is null covers almost everything
            const { error } = await supabase
                .from(table)
                .delete()
                .not('id', 'is', null);

            if (error) {
                // Try fallback for tables without 'id'
                const { error: error2 } = await supabase
                    .from(table)
                    .delete()
                    .neq('created_at', '1970-01-01Z');

                if (error2) {
                    console.log(`Failed: ${error2.message}`);
                } else {
                    console.log('Cleaned (via created_at).');
                }
            } else {
                console.log('Successfully cleared.');
            }
        } catch (e) {
            console.log(`Error: ${e.message}`);
        }
    }

    console.log('\n--- CLEANUP COMPLETE ---');
}

cleanData();
