import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

// Helper to fetch the full cart for a user
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

        // 1. Validate item exists and is available, and get its outlet_id
        const { data: menuItem, error: menuError } = await supabase
            .from('menu_items')
            .select('outlet_id, availability')
            .eq('id', menuItemId)
            .single();

        if (menuError || !menuItem) {
            res.status(404).json({ error: 'Menu item not found' });
            return;
        }

        if (!menuItem.availability) {
            res.status(400).json({ error: 'Item is currently unavailable' });
            return;
        }

        // 2. Check if the user's cart already has items from a distinct outlet
        const currentCart = await fetchFullCart(userId);

        if (currentCart && currentCart.length > 0) {
            // Because Supabase joins return objects or arrays based on the relation,
            // menu_items is a single object since it's a many-to-one relation.
            const existingOutletId = (currentCart[0].menu_items as any).outlet_id;

            if (existingOutletId !== menuItem.outlet_id) {
                res.status(400).json({
                    error: 'Cart contains items from a different outlet. Please clear your cart to order from here.'
                });
                return;
            }
        }

        // 3. Check if the item already exists in the cart to increment quantity
        const requestedQty = parseInt(quantity?.toString()) || 1;
        const existingItem = currentCart?.find(item => (item.menu_items as any).id === menuItemId);

        if (existingItem) {
            // Increment
            const { error: updateError } = await supabase
                .from('cart_items')
                .update({ quantity: existingItem.quantity + requestedQty })
                .eq('id', existingItem.id);

            if (updateError) throw updateError;
        } else {
            // Insert new
            const { error: insertError } = await supabase
                .from('cart_items')
                .insert([{ user_id: userId, menu_item_id: menuItemId, quantity: requestedQty }]);

            if (insertError) throw insertError;
        }

        // 4. Return updated cart
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
            // Remove item
            const { error: deleteError } = await supabase
                .from('cart_items')
                .delete()
                .eq('id', cartItemId);

            if (deleteError) throw deleteError;
        } else {
            // Update quantity
            const { error: updateError } = await supabase
                .from('cart_items')
                .update({ quantity: newQuantity })
                .eq('id', cartItemId);

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
