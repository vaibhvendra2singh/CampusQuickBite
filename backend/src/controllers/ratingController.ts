import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const submitRating = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { menuItemId, outletId, ratingValue, comment } = req.body;

        if (!userId || (!menuItemId && !outletId) || !ratingValue) {
            res.status(400).json({ error: 'User ID, Rating Target (Menu Item or Outlet), and Rating Value (1-5) are required' });
            return;
        }

        const val = parseInt(ratingValue);
        if (val < 1 || val > 5) {
            res.status(400).json({ error: 'Rating must be between 1 and 5' });
            return;
        }

        const column = menuItemId ? 'menu_item_id' : 'outlet_id';
        const targetId = menuItemId || outletId;

        // 1. Check if user already rated this target
        const query = supabase
            .from('ratings')
            .select('id, rating_value')
            .eq('user_id', userId);

        if (menuItemId) query.eq('menu_item_id', menuItemId);
        else query.eq('outlet_id', outletId);

        const { data: existingRating, error: fetchError } = await query.maybeSingle();

        if (fetchError) {
            console.error("Fetch rating error:", fetchError);
            res.status(500).json({ error: fetchError.message });
            return;
        }

        let result;
        if (existingRating) {
            // Update existing rating
            const { data, error: updateError } = await supabase
                .from('ratings')
                .update({ rating_value: val, comment: comment || '' })
                .eq('id', existingRating.id)
                .select()
                .single();
            if (updateError) throw updateError;
            result = data;
        } else {
            // Insert new rating
            const payload: any = { user_id: userId, rating_value: val, comment: comment || '' };
            if (menuItemId) payload.menu_item_id = menuItemId;
            else payload.outlet_id = outletId;

            const { data, error: insertError } = await supabase
                .from('ratings')
                .insert([payload])
                .select()
                .single();
            if (insertError) throw insertError;
            result = data;
        }

        // 2. Re-calculate average rating for the entity EXCLUDING hidden ones
        const { data: allVisibleRatings, error: countError } = await supabase
            .from('ratings')
            .select('rating_value')
            .eq(column, targetId)
            .eq('is_hidden', false);

        if (countError) throw countError;

        if (allVisibleRatings) {
            const count = allVisibleRatings.length;
            const sum = allVisibleRatings.reduce((acc, curr) => acc + curr.rating_value, 0);
            const average = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;

            const table = menuItemId ? 'menu_items' : 'outlets';
            const { error: targetUpdateError } = await supabase
                .from(table)
                .update({ average_rating: average, rating_count: count })
                .eq('id', targetId);

            if (targetUpdateError) throw targetUpdateError;
        }

        res.status(200).json({ message: 'Rating submitted successfully', data: result });

    } catch (error: any) {
        console.error('Submit rating error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            details: error?.message || 'Unknown error occurred'
        });
    }
};

export const getMenuItemRatings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { itemId } = req.params;
        const { data, error } = await supabase
            .from('ratings')
            .select(`
                *,
                user:users!user_id (id, name)
            `)
            .eq('menu_item_id', itemId)
            .eq('is_hidden', false)
            .order('created_at', { ascending: false });

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Get item ratings error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getOutletRatings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { outletId } = req.params;
        const { data, error } = await supabase
            .from('ratings')
            .select(`
                *,
                user:users!user_id (id, name)
            `)
            .eq('outlet_id', outletId)
            .eq('is_hidden', false)
            .order('created_at', { ascending: false });

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Get outlet ratings error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getAdminReviewFeed = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { data, error } = await supabase
            .from('ratings')
            .select(`
                *,
                user:users!user_id (id, name, enrollment_number),
                outlet:outlets (id, name),
                menu_item:menu_items (id, name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error: any) {
        console.error('Admin review feed error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

export const toggleReviewVisibility = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { is_hidden } = req.body;
        const userId = req.user?.id;
        const userRole = req.user?.role;

        // 1. Fetch current review details to cross-reference with outlet ownership
        const { data: review, error: fetchError } = await supabase
            .from('ratings')
            .select('*, outlets(owner_id), menu_items(outlet_id)')
            .eq('id', id)
            .single();

        if (fetchError || !review) {
            res.status(404).json({ error: 'Review not found' });
            return;
        }

        // Security Check: Only Admin or the Outlet Owner can toggle visibility
        if (userRole !== 'admin') {
            let authorized = false;
            
            // If it's an outlet rating
            if (review.outlet_id && (review.outlets as any)?.owner_id === userId) {
                authorized = true;
            }
            
            // If it's a menu item rating, we need to check the outlet's owner
            if (review.menu_item_id) {
                const outletId = (review.menu_items as any)?.outlet_id;
                const { data: outlet } = await supabase
                    .from('outlets')
                    .select('owner_id')
                    .eq('id', outletId)
                    .single();
                
                if (outlet?.owner_id === userId) {
                    authorized = true;
                }
            }

            if (!authorized) {
                res.status(403).json({ error: 'Unauthorized: You do not own the outlet for this review' });
                return;
            }
        }

        // 2. Update visibility
        const { data: updatedReview, error: updateError } = await supabase
            .from('ratings')
            .update({ is_hidden })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // 2. Identify the target (menu_item or outlet)
        const targetId = updatedReview.menu_item_id || updatedReview.outlet_id;
        const column = updatedReview.menu_item_id ? 'menu_item_id' : 'outlet_id';

        // 3. Re-calculate metrics EXCLUDING hidden reviews
        const { data: allVisibleRatings, error: countError } = await supabase
            .from('ratings')
            .select('rating_value')
            .eq(column, targetId)
            .eq('is_hidden', false);

        if (countError) throw countError;

        const count = allVisibleRatings?.length || 0;
        const sum = allVisibleRatings?.reduce((acc, curr) => acc + curr.rating_value, 0) || 0;
        const average = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;

        // 4. Update the target table
        const table = updatedReview.menu_item_id ? 'menu_items' : 'outlets';
        const { error: targetUpdateError } = await supabase
            .from(table)
            .update({ average_rating: average, rating_count: count })
            .eq('id', targetId);

        if (targetUpdateError) throw targetUpdateError;

        res.status(200).json(updatedReview);
    } catch (error: any) {
        console.error('Toggle review visibility error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
