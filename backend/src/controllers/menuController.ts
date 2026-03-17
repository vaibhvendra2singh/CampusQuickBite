import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { notifyMenuUpdate } from '../services/socketService';
import { AuthRequest } from '../middleware/auth';

export const getAllMenu = async (req: Request, res: Response): Promise<void> => {
    try {
        const { data, error } = await supabase
            .from('menu_items')
            .select(`
                *,
                outlets (
                    id,
                    name,
                    location
                )
            `);

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Fetch all menu error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getMenuByOutlet = async (req: Request, res: Response): Promise<void> => {
    try {
        const { outletId } = req.params;

        const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('outlet_id', outletId);

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Fetch outlet menu error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const addMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { outletId } = req.query;
        const userId = req.user?.id;
        const userRole = req.user?.role;

        if (!outletId) {
            res.status(400).json({ error: 'outletId is required' });
            return;
        }

        // Security Check: Verify ownership in a single join query if item exists
        if (userRole !== 'admin') {
            const { data: outlet, error: outletError } = await supabase
                .from('outlets')
                .select('owner_id')
                .eq('id', outletId)
                .single();

            if (outletError || !outlet) {
                res.status(404).json({ error: 'Outlet not found' });
                return;
            }

            if (outlet.owner_id !== userId) {
                res.status(403).json({ error: 'Unauthorized: You do not own this outlet' });
                return;
            }
        }

        const { name, price, availability, isVeg, description, image_url } = req.body;

        if (!name || price === undefined) {
            res.status(400).json({ error: 'name and price are required' });
            return;
        }

        const insertData: any = {
            outlet_id: outletId,
            name,
            price: parseFloat(price.toString()),
            availability: availability !== undefined ? availability : true,
            description: description || '',
            image_url: image_url || ''
        };

        // Attempt with is_veg first
        const { data, error } = await supabase
            .from('menu_items')
            .insert([{ ...insertData, is_veg: isVeg !== undefined ? isVeg : true }])
            .select()
            .single();

        if (error) {
            // If the error is specifically about the missing is_veg column, try without it
            if (error.message.includes('is_veg')) {
                console.warn('DB: is_veg column missing. Retrying insert without it.');
                const { data: retryData, error: retryError } = await supabase
                    .from('menu_items')
                    .insert([insertData])
                    .select()
                    .single();

                if (retryError) {
                    res.status(500).json({ error: retryError.message });
                    return;
                }
                res.status(201).json(retryData);
                return;
            }
            res.status(500).json({ error: error.message });
            return;
        }

        res.status(201).json(data);
    } catch (error: any) {
        console.error('Add menu item error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

export const updateMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role;

        // Security Check: Fetch item and its outlet's owner in ONE combined query
        const { data: menuItem, error: fetchError } = await supabase
            .from('menu_items')
            .select('id, outlet_id, outlets!inner(owner_id)')
            .eq('id', id)
            .single();

        if (fetchError || !menuItem) {
            res.status(404).json({ error: 'Menu item not found' });
            return;
        }

        if (userRole !== 'admin') {
            if ((menuItem.outlets as any).owner_id !== userId) {
                res.status(403).json({ error: 'Unauthorized: You do not own the outlet for this menu item' });
                return;
            }
        }

        const { name, price, availability, isVeg, description, image_url } = req.body;
        console.log(`Updating menu item ${id}:`, req.body);

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (price !== undefined) updateData.price = parseFloat(price.toString());
        if (availability !== undefined) updateData.availability = availability;
        if (description !== undefined) updateData.description = description;
        if (image_url !== undefined) updateData.image_url = image_url;

        // Try with is_veg if provided
        let finalUpdate = { ...updateData };
        if (isVeg !== undefined) finalUpdate.is_veg = isVeg;

        const { data, error } = await supabase
            .from('menu_items')
            .update(finalUpdate)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            // Fallback for is_veg column missing
            if (error.message.includes('is_veg')) {
                console.warn('DB: is_veg column missing. Retrying update without it.');
                const { data: retryData, error: retryError } = await supabase
                    .from('menu_items')
                    .update(updateData)
                    .eq('id', id)
                    .select()
                    .single();

                if (retryData?.outlet_id) notifyMenuUpdate(retryData.outlet_id);
                res.status(200).json(retryData);
                return;
            }
            res.status(500).json({ error: error.message });
            return;
        }

        if (data?.outlet_id) notifyMenuUpdate(data.outlet_id);
        res.status(200).json(data);
    } catch (error: any) {
        console.error('Update menu item error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

export const deleteMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role;

        // Security Check: Fetch item and its outlet's owner in ONE combined query
        const { data: menuItem, error: fetchError } = await supabase
            .from('menu_items')
            .select('id, outlet_id, outlets!inner(owner_id)')
            .eq('id', id)
            .single();

        if (fetchError || !menuItem) {
            res.status(404).json({ error: 'Menu item not found' });
            return;
        }

        if (userRole !== 'admin') {
            if ((menuItem.outlets as any).owner_id !== userId) {
                res.status(403).json({ error: 'Unauthorized: You do not own the outlet for this menu item' });
                return;
            }
        }

        const { error } = await supabase.from('menu_items').delete().eq('id', id);

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        res.status(200).json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        console.error('Delete menu item error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
