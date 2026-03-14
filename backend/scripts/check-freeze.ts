import * as path from 'path';
import * as dotenv from 'dotenv';
// Use process.cwd() as fallback if __dirname is not available or points to dist
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { supabase } from '../src/config/supabase';

async function checkUserFreeze() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('email, is_frozen')
            .eq('email', 'student@test.com')
            .single();

        if (error) {
            console.error('Database Error:', error.message);
        } else {
            console.log('User status:', data);
        }
    } catch (err: any) {
        console.error('Execution Error:', err.message);
    }
}

checkUserFreeze();
