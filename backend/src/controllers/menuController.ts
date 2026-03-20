import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { notifyMenuUpdate } from '../services/socketService';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { cacheGet, cacheSet, cacheDel, CacheKey, CACHE_TTL } from '../services/cacheService';
import { auditLog } from '../utils/auditLog';

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
            sendError(res, error.message, 500);
            return;
        }

        sendSuccess(res, data, 'All menu items fetched successfully');
    } catch (error) {
        console.error('Fetch all menu error:', error);
        sendError(res, 'Internal Server Error');
    }
};

export const getMenuByOutlet = async (req: Request, res: Response): Promise<void> => {
    try {
        const { outletId } = req.params;
        const cacheKey = CacheKey.menu(outletId as string);

        const cachedData = await cacheGet(cacheKey);
        if (cachedData) {
            sendSuccess(res, cachedData, 'Outlet menu fetched from cache');
            return;
        }

        const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .eq('outlet_id', outletId);

        if (error) {
            sendError(res, error.message, 500);
            return;
        }

        await cacheSet(cacheKey, data, CACHE_TTL.MENU);
        sendSuccess(res, data, 'Outlet menu fetched successfully');
    } catch (error) {
        console.error('Fetch outlet menu error:', error);
        sendError(res, 'Internal Server Error');
    }
};

export const addMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { outletId } = req.query;
        const userId = req.user?.id;
        const userRole = req.user?.role;

        if (!outletId) {
            sendError(res, 'outletId is required', 400);
            return;
        }

        // Security Check: Verify ownership
        if (userRole !== 'admin') {
            const { data: outlet, error: outletError } = await supabase
                .from('outlets')
                .select('owner_id')
                .eq('id', outletId)
                .single();

            if (outletError || !outlet) {
                sendError(res, 'Outlet not found', 404);
                return;
            }

            if (outlet.owner_id !== userId) {
                sendError(res, 'Unauthorized: You do not own this outlet', 403);
                return;
            }
        }

        const { name, price, availability, isVeg, description, image_url } = req.body;

        if (!name || price === undefined) {
             sendError(res, 'name and price are required', 400);
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
            // Fallback
            if (error.message.includes('is_veg')) {
                const { data: retryData, error: retryError } = await supabase
                    .from('menu_items')
                    .insert([insertData])
                    .select()
                    .single();

                if (retryError) {
                    sendError(res, retryError.message, 500);
                    return;
                }
                
                await cacheDel(CacheKey.menu(outletId as string));
                await auditLog({
                    action: 'MENU_ITEM_CREATED',
                    actorId: userId as string,
                    actorRole: userRole as string,
                    targetId: retryData.id,
                    targetType: 'menu_item',
                    details: { outletId, name: retryData.name }
                });
                sendSuccess(res, retryData, 'Menu item added', 201);
                return;
            }
            sendError(res, error.message, 500);
            return;
        }

        await cacheDel(CacheKey.menu(outletId as string));
        await auditLog({
            action: 'MENU_ITEM_CREATED',
            actorId: userId as string,
            actorRole: userRole as string,
            targetId: data.id,
            targetType: 'menu_item',
            details: { outletId, name: data.name }
        });
        sendSuccess(res, data, 'Menu item added', 201);
    } catch (error: any) {
        console.error('Add menu item error:', error);
        sendError(res, error.message || 'Internal Server Error');
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
            sendError(res, 'Menu item not found', 404);
            return;
        }

        if (userRole !== 'admin') {
            if ((menuItem.outlets as any).owner_id !== userId) {
                sendError(res, 'Unauthorized: You do not own the outlet for this menu item', 403);
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
                const { data: retryData, error: retryError } = await supabase
                    .from('menu_items')
                    .update(updateData)
                    .eq('id', id)
                    .select()
                    .single();

                if (retryError) {
                    sendError(res, retryError.message, 500);
                    return;
                }
                
                if (retryData?.outlet_id) {
                    notifyMenuUpdate(retryData.outlet_id);
                    await cacheDel(CacheKey.menu(retryData.outlet_id));
                }

                await auditLog({
                    action: 'MENU_ITEM_UPDATED',
                    actorId: userId as string,
                    actorRole: userRole as string,
                    targetId: id as string,
                    targetType: 'menu_item',
                    details: { name: retryData.name }
                });

                sendSuccess(res, retryData, 'Menu item updated');
                return;
            }
            sendError(res, error.message, 500);
            return;
        }

        if (data?.outlet_id) {
            notifyMenuUpdate(data.outlet_id);
             await cacheDel(CacheKey.menu(data.outlet_id));
        }

        await auditLog({
            action: 'MENU_ITEM_UPDATED',
            actorId: userId as string,
            actorRole: userRole as string,
            targetId: id as string,
            targetType: 'menu_item',
            details: { name: data.name }
        });

        sendSuccess(res, data, 'Menu item updated');
    } catch (error: any) {
        console.error('Update menu item error:', error);
        sendError(res, error.message || 'Internal Server Error');
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
            sendError(res, 'Menu item not found', 404);
            return;
        }

        if (userRole !== 'admin') {
            if ((menuItem.outlets as any).owner_id !== userId) {
                sendError(res, 'Unauthorized: You do not own the outlet for this menu item', 403);
                return;
            }
        }

        const outletId = menuItem.outlet_id;

        const { error } = await supabase.from('menu_items').delete().eq('id', id);

        if (error) {
            sendError(res, error.message, 500);
            return;
        }

        if (outletId) {
             notifyMenuUpdate(outletId);
             await cacheDel(CacheKey.menu(outletId));
        }

        await auditLog({
            action: 'MENU_ITEM_DELETED',
            actorId: userId as string,
            actorRole: userRole as string,
            targetId: id as string,
            targetType: 'menu_item'
        });

        sendSuccess(res, null, 'Menu item deleted successfully');
    } catch (error) {
        console.error('Delete menu item error:', error);
        sendError(res, 'Internal Server Error');
    }
};
