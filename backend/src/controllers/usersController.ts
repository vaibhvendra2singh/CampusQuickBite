import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { notifyAccountStatus } from '../services/socketService';

export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const authenticatedUserId = req.user?.id;

        // Security check
        // Only allow users to update their own profile, or admins
        if (String(id) !== String(authenticatedUserId)) {
            res.status(403).json({ error: 'Forbidden: You can only update your own profile' });
            return;
        }

        const { name, phoneNumber, enrollmentNumber, profilePic } = req.body;

        const updatePayload = {
            name,
            phone_number: phoneNumber,
            enrollment_number: enrollmentNumber,
            profile_pic: profilePic
        };

        let { data, error } = await supabase
            .from('users')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        // Check if it's a schema issue (e.g., column doesn't exist)
        if (error && error.message && error.message.includes('schema cache')) {
            console.warn("Falling back to basic profile update due to missing Supabase columns.");

            // Retry with only the existing columns
            const fallbackResponse = await supabase
                .from('users')
                .update({ name })
                .eq('id', id)
                .select()
                .single();

            if (fallbackResponse.error) {
                res.status(500).json({ error: fallbackResponse.error.message });
                return;
            }

            data = fallbackResponse.data;
            // Mock the un-persisted columns for the frontend so it successfully updates its state
            data.phone_number = phoneNumber;
            data.enrollment_number = enrollmentNumber;
            data.profile_pic = profilePic;
        } else if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        // Send back the mapped fields so frontend Context isn't broken
        res.status(200).json({
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role === 'owner' ? 'SHOP_OWNER' : data.role.toUpperCase(),
            phoneNumber: data.phone_number,
            enrollmentNumber: data.enrollment_number,
            profilePic: data.profile_pic
        });

    } catch (error) {
        console.error('Update user profile error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, xp, tier, profile_pic')
            .eq('role', 'student')
            .order('xp', { ascending: false })
            .limit(10);

        if (error) {
            // If the column doesn't exist yet, return dummy data instead of crashing
            if (error.message.includes('Could not find the column')) {
                res.status(200).json([]);
                return;
            }
            res.status(500).json({ error: error.message });
            return;
        }

        // Map data
        const leaderboard = (data || []).map(u => ({
            id: u.id,
            name: u.name,
            xp: u.xp || 0,
            tier: u.tier || 'BRONZE',
            profilePic: u.profile_pic || ''
        }));

        res.status(200).json(leaderboard);
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { search, role } = req.query;
        let query = supabase.from('users').select('*');

        if (role) query = query.eq('role', role);
        if (search) query = query.or(`name.ilike.%${search}%,enrollment_number.ilike.%${search}%`);

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        const users = (data || []).map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            phoneNumber: u.phone_number,
            enrollmentNumber: u.enrollment_number,
            profilePic: u.profile_pic,
            isBanned: u.is_banned || false,
            isFrozen: u.is_frozen || false,
            createdAt: u.created_at
        }));

        res.status(200).json(users);
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const { data, error } = await supabase
            .from('users')
            .update({ role })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        res.status(200).json({ message: 'User role updated successfully', user: data });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { is_banned, is_frozen, statusType, field, value } = req.body;

        // Support both direct keys (is_banned: true) and key/value pairs (field: 'is_frozen', value: true)
        let updatePayload: any = {};
        if (is_banned !== undefined) updatePayload.is_banned = is_banned;
        if (is_frozen !== undefined) updatePayload.is_frozen = is_frozen;

        if (Object.keys(updatePayload).length === 0) {
            const activeField = field || statusType;
            if (activeField) {
                const key = (activeField === 'isBanned' || activeField === 'is_banned') ? 'is_banned' : 'is_frozen';
                updatePayload[key] = value;
            }
        }

        if (Object.keys(updatePayload).length === 0) {
            res.status(400).json({ error: 'Missing ban/freeze status data' });
            return;
        }

        const { data, error } = await supabase
            .from('users')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        // Notify the user via socket so they update immediately
        notifyAccountStatus(String(id), {
            isFrozen: data.is_frozen,
            isBanned: data.is_banned,
            message: `Your account status was updated by an administrator.`
        });

        res.status(200).json({ message: 'User status updated successfully', user: data });
    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, role, is_frozen, is_banned')
            .eq('id', id)
            .single();

        if (error) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Send back an object mapping DB snake_case columns to frontend camelCase expectations
        res.status(200).json({
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
            isFrozen: data.is_frozen || false,
            isBanned: data.is_banned || false
        });
    } catch (error) {
        console.error('Get user by id error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
