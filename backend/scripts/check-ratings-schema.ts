import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { supabase } from '../src/config/supabase';

async function checkRatingsTable() {
    try {
        // We can't easily check schema with supabase-js directly without RPC
        // But we can try to select is_hidden to see if it works
        const { data, error } = await supabase
            .from('ratings')
            .select('is_hidden')
            .limit(1);

        if (error) {
            console.error('Database Error:', error.message);
            if (error.message.includes('column "is_hidden" does not exist')) {
                console.log('COLUMN IS MISSING!');
            }
        } else {
            console.log('is_hidden column exists. Sample data:', data);
        }
    } catch (err: any) {
        console.error('Execution Error:', err.message);
    }
}

checkRatingsTable();
