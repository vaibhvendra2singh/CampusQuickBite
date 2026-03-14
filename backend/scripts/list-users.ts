import path from 'path';
require('dotenv').config({ path: path.join(__dirname, '../.env') });
import { supabase } from '../src/config/supabase';

async function listUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, email, is_frozen, is_banned');

    if (error) {
        console.error('Error:', error);
    } else {
        console.table(data);
    }
}

listUsers();
