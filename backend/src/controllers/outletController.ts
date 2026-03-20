import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { cacheGet, cacheSet, cacheDel, CacheKey, CACHE_TTL } from '../services/cacheService';
import { auditLog } from '../utils/auditLog';

export const getAllOutlets = async (req: Request, res: Response): Promise<void> => {
    try {
        const cacheKey = CacheKey.outlets();
        const cachedData = await cacheGet(cacheKey);
        if (cachedData) {
            sendSuccess(res, cachedData, 'Outlets fetched from cache');
            return;
        }

        const { data, error } = await supabase
            .from('outlets')
            .select(`
                *,
                owner:users!owner_id ( id, name, email, phone_number ),
                menu_items ( id, name, is_veg, price, average_rating )
            `);

        if (error) {
            sendError(res, error.message, 500);
            return;
        }

        await cacheSet(cacheKey, data, CACHE_TTL.OUTLETS);
        sendSuccess(res, data, 'Outlets fetched successfully');
    } catch (error) {
        console.error('Fetch all outlets error:', error);
        sendError(res, 'Internal Server Error');
    }
};

export const getOutletById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const cacheKey = CacheKey.outletById(id as string);
        const cachedData = await cacheGet(cacheKey);
        if (cachedData) {
            sendSuccess(res, cachedData, 'Outlet fetched from cache');
            return;
        }

        const { data, error } = await supabase
            .from('outlets')
            .select(`*, owner:users!owner_id ( id, name, email, phone_number )`)
            .eq('id', id)
            .single();

        if (error || !data) {
            sendError(res, 'Outlet not found', 404);
            return;
        }

        await cacheSet(cacheKey, data, CACHE_TTL.OUTLETS);
        sendSuccess(res, data, 'Outlet fetched successfully');
    } catch (error) {
        console.error('Fetch outlet by id error:', error);
        sendError(res, 'Internal Server Error');
    }
};

export const createOutlet = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, location, latitude, longitude, ownerName, ownerEmail, ownerPassword } = req.body;

        if (!name || !location || !ownerName || !ownerEmail || !ownerPassword) {
            res.status(400).json({ error: 'All fields (Outlet & Owner info) are required.' });
            return;
        }

        // 1. Hash the owner's password
        const hashedPassword = await bcrypt.hash(ownerPassword, 10);

        // 2. Insert the owner into the 'users' table
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert([{
                name: ownerName,
                email: ownerEmail,
                password: hashedPassword,
                role: 'owner'
            }])
            .select()
            .single();

        if (userError || !newUser) {
            sendError(res, userError?.message || 'Failed to create Owner account.', 400);
            return;
        }

        // 3. Insert the outlet, linking it to the new Owner's ID
        const { data: newOutlet, error: outletError } = await supabase
            .from('outlets')
            .insert([{
                name,
                location,
                latitude,
                longitude,
                owner_id: newUser.id
            }])
            .select(`
                *,
                owner:users!owner_id ( id, name, email )
            `)
            .single();

        if (outletError) {
            sendError(res, outletError.message, 500);
            return;
        }

        // Invalidate cache
        await cacheDel(CacheKey.outlets());

        // Audit Log
        await auditLog({
            action: 'OUTLET_CREATED',
            actorId: 'system', // Ideally use req.user.id if an admin is creating this
            actorRole: 'admin',
            targetId: newOutlet.id,
            targetType: 'outlet',
            details: { name: newOutlet.name }
        });

        sendSuccess(res, newOutlet, 'Outlet and Owner created successfully', 201);
    } catch (error) {
        console.error('Create outlet + owner error:', error);
        sendError(res, 'Internal Server Error');
    }
};

export const updateOutlet = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role;

        // Security Check: Verify ownership
        if (userRole !== 'admin') {
            const { data: outlet, error: outletError } = await supabase
                .from('outlets')
                .select('owner_id')
                .eq('id', id)
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

        const { name, location, latitude, longitude, is_open } = req.body;
        const { data, error } = await supabase.from('outlets').update({ name, location, latitude, longitude, is_open }).eq('id', id).select().single();
        
        if (error) {
            sendError(res, error.message, 500);
            return;
        }

        // Invalidate cache
        await cacheDel(CacheKey.outlets(), CacheKey.outletById(id as string));

        // Audit Log
        if (req.user) {
            await auditLog({
                action: 'OUTLET_UPDATED',
                actorId: req.user.id,
                actorRole: req.user.role,
                targetId: id as string,
                targetType: 'outlet',
                details: req.body
            });
        }

        sendSuccess(res, data, 'Outlet updated successfully');
    } catch (error) {
        console.error('Update outlet error:', error);
        sendError(res, 'Internal Server Error');
    }
};

export const deleteOutlet = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role;

        // Security Check: Verify ownership
        if (userRole !== 'admin') {
            const { data: outlet, error: outletError } = await supabase
                .from('outlets')
                .select('owner_id')
                .eq('id', id)
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

        const { error } = await supabase.from('outlets').delete().eq('id', id);
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        res.status(200).json({ message: 'Outlet deleted successfully' });
    } catch (error) {
        console.error('Delete outlet error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateOutletStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user?.id;
        const userRole = req.user?.role;

        // Allow ANY logged-in user (student, owner, admin) to report wait time.
        // This is a crowdsourced feature. No ownership check needed here.

        if (!['FAST', 'MODERATE', 'BUSY'].includes(status)) {
            res.status(400).json({ error: 'Invalid status. Must be FAST, MODERATE, or BUSY.' });
            return;
        }

        const { data, error } = await supabase
            .from('outlets')
            .update({
                current_status: status,
                status_updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Supabase error updating outlet status:', error);
            res.status(500).json({ error: 'Failed to update outlet status', details: error.message });
            return;
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Update outlet status error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
