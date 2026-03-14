const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('Trying to exec sql');
    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: "ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT; ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMPTZ;"
    });

    if (error) {
        console.error('Migration error:', error);
    } else {
        console.log('Migration output:', data);
    }
}
run();
