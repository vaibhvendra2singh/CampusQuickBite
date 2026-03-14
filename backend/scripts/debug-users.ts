import path from 'path';
require('dotenv').config({ path: path.join(__dirname, '../.env') });
import { supabase } from '../src/config/supabase';

async function debugUsers() {
    try {
        const { data, error } = await supabase.from('users').select('id, email, role, is_banned').limit(5);
        if (error) {
            console.error('Error fetching users:', error.message);
        } else {
            console.log('Users found:', data);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

debugUsers();
