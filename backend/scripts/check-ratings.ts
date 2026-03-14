import 'dotenv/config';
import { supabase } from '../src/config/supabase';

async function checkRatings() {
    try {
        const { data, error } = await supabase.from('ratings').select('id').limit(1);
        if (error) {
            console.error('Ratings table check error:', error.message);
        } else {
            console.log('Ratings table exists.');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkRatings();
