const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(url, key);

async function run() {
    // try to fetch 'category' column
    const { data, error } = await supabase.from('menu_items').select('category').limit(1);
    if (error) {
        console.log("Category column does not exist:", error.message);
    } else {
        console.log("Category column exists.");
    }
}
run();
