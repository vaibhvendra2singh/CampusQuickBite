const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const envPaths = [
    path.join(__dirname, '..', '.env'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'backend', '.env')
];

for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        break;
    }
}

if (!process.env.SUPABASE_URL) {
    console.error('❌ SUPABASE_URL not found.');
    process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const tables = ['ratings', 'orders', 'menu_items', 'outlets', 'users'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(table, 'Error:', error.message);
        } else if (data && data.length > 0) {
            console.log(table, 'Row 0 Keys:', Object.keys(data[0]));
            if (data[0].id) console.log(table, 'Sample ID Type:', typeof data[0].id, data[0].id);
        } else {
            console.log(table, 'Empty');
        }
    }
}
run();
