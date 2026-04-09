import { normalizeRole, ROLES } from '../utils/roles';
import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, message, target_role, expires_at } = req.body;

        if (!title || !message) {
            res.status(400).json({ error: 'Title and message are required' });
            return;
        }

        const { data, error } = await supabase
            .from('announcements')
            .insert([{
                title,
                message,
                target_role: target_role || 'all',
                created_by: req.user?.id,
                expires_at: expires_at || null
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error: any) {
        console.error('Create announcement error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

export const getAnnouncements = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userRole = req.user?.role || 'student';
        const now = new Date().toISOString();

        let query = supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (normalizeRole(req.user?.role) !== ROLES.ADMIN) {
            query = query
                .or(`target_role.eq.all,target_role.eq.${userRole}`)
                .or(`expires_at.is.null,expires_at.gt.${now}`);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.status(200).json(data);
    } catch (error: any) {
        console.error('Get announcements error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const parsedId = isNaN(Number(id)) ? id : Number(id);

        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', parsedId);

        if (error) throw error;
        res.status(200).json({ message: 'Announcement deleted' });
    } catch (error: any) {
        console.error('Delete announcement error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
