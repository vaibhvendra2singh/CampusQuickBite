import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { supabase } from '../src/config/supabase';

async function testToggle() {
    try {
        // Step 1: Get a real review ID
        const { data: reviews, error: fetchErr } = await supabase
            .from('ratings')
            .select('id, is_hidden, menu_item_id, outlet_id')
            .limit(5);

        if (fetchErr) {
            console.error('Fetch error:', fetchErr.message);
            return;
        }

        console.log('Reviews found:', reviews);

        if (!reviews || reviews.length === 0) {
            console.log('No reviews found in DB.');
            return;
        }

        const review = reviews[0];
        const newHidden = !review.is_hidden;

        console.log(`\nAttempting to toggle review ${review.id} → is_hidden = ${newHidden}`);

        // Step 2: Attempt the update
        const { data: updated, error: updateErr } = await supabase
            .from('ratings')
            .update({ is_hidden: newHidden })
            .eq('id', review.id)
            .select()
            .single();

        if (updateErr) {
            console.error('Update error:', updateErr.message, updateErr.details, updateErr.hint);
            return;
        }

        console.log('Update success:', updated);

        // Step 3: Identify target
        const targetId = updated.menu_item_id || updated.outlet_id;
        const column = updated.menu_item_id ? 'menu_item_id' : 'outlet_id';
        console.log(`\nTarget: ${column} = ${targetId}`);

        // Step 4: Recalculate visible ratings
        const { data: visible, error: visErr } = await supabase
            .from('ratings')
            .select('rating_value')
            .eq(column, targetId)
            .eq('is_hidden', false);

        if (visErr) {
            console.error('Visible ratings fetch error:', visErr.message, visErr.details, visErr.hint);
            return;
        }

        console.log('Visible ratings after toggle:', visible);

        const count = visible?.length || 0;
        const sum = visible?.reduce((a, c) => a + c.rating_value, 0) || 0;
        const average = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
        console.log(`Recalculated: count=${count}, avg=${average}`);

        // Step 5: Update target table
        const table = updated.menu_item_id ? 'menu_items' : 'outlets';
        const { error: targetErr } = await supabase
            .from(table)
            .update({ average_rating: average, rating_count: count })
            .eq('id', targetId);

        if (targetErr) {
            console.error(`Target (${table}) update error:`, targetErr.message, targetErr.details, targetErr.hint);
            return;
        }

        console.log(`\n✅ All steps passed. review ${review.id} is now is_hidden=${newHidden}`);

        // Revert to avoid messing up data
        await supabase.from('ratings').update({ is_hidden: review.is_hidden }).eq('id', review.id);
        console.log('Reverted to original state.');

    } catch (err: any) {
        console.error('Unexpected error:', err.message);
    }
}

testToggle();
