import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

const fetchFullCart = async (userId: string) => {
    const { data, error } = await supabase
        .from('cart_items')
        .select(`
            id,
            user_id,
            quantity,
            menu_items (
                id,
                name,
                price,
                image_url,
                outlet_id,
                outlets (
                    id,
                    name,
                    location
                )
            )
        `)
        .eq('user_id', userId);

    if (error) throw error;
    return data;
};

export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'User is not authenticated' });
            return;
        }

        const cart = await fetchFullCart(userId as string);
        res.status(200).json(cart);
    } catch (error) {
        console.error('Fetch cart error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { menuItemId, quantity } = req.body;

        if (!userId || !menuItemId) {
            res.status(400).json({ error: 'Menu Item ID is required' });
            return;
        }

        // 1. Get menu item info AND current cart status in 1 TRIP
        const [{ data: menuItem, error: menuErr }, { data: existingItem }] = await Promise.all([
            supabase.from('menu_items').select('id, outlet_id, availability').eq('id', menuItemId).single(),
            supabase.from('cart_items').select('id, quantity, menu_items(outlet_id)').eq('user_id', userId).eq('menu_item_id', menuItemId).maybeSingle()
        ]);

        if (menuErr || !menuItem) {
            res.status(404).json({ error: 'Menu item not found' });
            return;
        }

        if (!menuItem.availability) {
            res.status(400).json({ error: 'Item is currently unavailable' });
            return;
        }

        // Check if adding from a different outlet
        if (!existingItem) {
            const { data: otherItems } = await supabase.from('cart_items').select('menu_items(outlet_id)').eq('user_id', userId).limit(1).maybeSingle();
            if (otherItems && (otherItems.menu_items as any)?.outlet_id !== menuItem.outlet_id) {
                res.status(400).json({ error: 'Cart contains items from another outlet. Clear it first.' });
                return;
            }
        }

        const requestedQty = Math.max(1, parseInt(quantity?.toString()) || 1);
        
        // 2. Perform UPSERT and FETCH resulting cart in 2 TRIPS (Total minimized)
        const { error: upsertError } = await supabase
            .from('cart_items')
            .upsert({
                user_id: userId,
                menu_item_id: menuItemId,
                quantity: existingItem ? existingItem.quantity + requestedQty : requestedQty
            }, { onConflict: 'user_id, menu_item_id' });

        if (upsertError) throw upsertError;

        const updatedCart = await fetchFullCart(userId);
        res.status(200).json(updatedCart);

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { cartItemId, action } = req.body;

        if (!userId || !cartItemId || !action) {
            res.status(400).json({ error: 'Cart Item ID and action (increase/decrease) are required' });
            return;
        }

        const { data: cartItem, error: fetchError } = await supabase
            .from('cart_items')
            .select('quantity')
            .eq('id', cartItemId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !cartItem) {
            res.status(404).json({ error: 'Cart item not found' });
            return;
        }

        let newQuantity = cartItem.quantity;

        if (action === 'increase') {
            newQuantity += 1;
        } else if (action === 'decrease') {
            newQuantity -= 1;
        } else {
            res.status(400).json({ error: 'Invalid action' });
            return;
        }

        if (newQuantity <= 0) {
            const { error: deleteError } = await supabase
                .from('cart_items')
                .delete()
                .eq('id', cartItemId)
                .eq('user_id', userId);

            if (deleteError) throw deleteError;
        } else {
            const { error: updateError } = await supabase
                .from('cart_items')
                .update({ quantity: newQuantity })
                .eq('id', cartItemId)
                .eq('user_id', userId);

            if (updateError) throw updateError;
        }

        const updatedCart = await fetchFullCart(userId);
        res.status(200).json(updatedCart);

    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const removeFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { menuItemId } = req.params;

        if (!userId || !menuItemId) {
            res.status(400).json({ error: 'Menu Item ID is required' });
            return;
        }

        const { error: deleteError } = await supabase
            .from('cart_items')
            .delete()
            .eq('menu_item_id', menuItemId)
            .eq('user_id', userId);

        if (deleteError) throw deleteError;

        const updatedCart = await fetchFullCart(userId);
        res.status(200).json(updatedCart);

    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ error: 'User is not authenticated' });
            return;
        }

        const { error: deleteError } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId);

        if (deleteError) throw deleteError;

        res.status(200).json({ outletId: null, items: [] });

    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
