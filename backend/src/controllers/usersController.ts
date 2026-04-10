import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { notifyAccountStatus } from '../services/socketService';
import { normalizeRole, displayRole, ROLES } from '../utils/roles';
import bcrypt from 'bcryptjs';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';


type BadgeType = 'shadow' | 'caffeine' | 'glutton' | 'night_owl' | 'arcade' | 'explorer' | 'pro_gamer' | 'completionist' | 'hacker';
const BADGE_CONFIG: Record<BadgeType, { column: string, xp: number, label: string }> = {
    shadow: { column: 'has_shadow_badge', xp: 50, label: 'Shadow Member' },
    caffeine: { column: 'has_caffeine_badge', xp: 20, label: 'Caffeine Addict' },
    glutton: { column: 'has_glutton_badge', xp: 30, label: 'The Glutton' },
    night_owl: { column: 'has_night_owl_badge', xp: 20, label: 'Night Owl' },
    arcade: { column: 'has_arcade_badge', xp: 40, label: 'Arcade King' },
    explorer: { column: 'has_explorer_badge', xp: 50, label: 'Urban Explorer' },
    pro_gamer: { column: 'has_pro_gamer_badge', xp: 40, label: 'Pro Gamer' },
    completionist: { column: 'has_completionist_badge', xp: 100, label: 'The Gamer' },
    hacker: { column: 'has_hacker_badge', xp: 75, label: 'The Hacker' }
};

export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const authenticatedUserId = req.user?.id;

        if (String(id) !== String(authenticatedUserId)) {
            sendError(res, 'Forbidden: You can only update your own profile', 403);
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

        if (error && error.message && error.message.includes('schema cache')) {
            console.warn("Falling back to basic profile update due to missing Supabase columns.");

            const fallbackResponse = await supabase
                .from('users')
                .update({ name })
                .eq('id', id)
                .select()
                .single();

            if (fallbackResponse.error) {
                sendError(res, fallbackResponse.error.message, 500);
                return;
            }

            data = fallbackResponse.data;
            data.phone_number = phoneNumber;
            data.enrollment_number = enrollmentNumber;
            data.profile_pic = profilePic;
        } else if (error) {
            sendError(res, error.message, 500);
            return;
        }

        sendSuccess(res, {
            id: data.id,
            name: data.name,
            email: data.email,
            role: displayRole(data.role),
            phoneNumber: data.phone_number,
            enrollmentNumber: data.enrollment_number,
            profilePic: data.profile_pic,
            xp: data.xp || 0,
            tier: data.tier || 'BRONZE',
            hasShadowBadge: data.has_shadow_badge || false,
            hasCaffeineBadge: data.has_caffeine_badge || false,
            hasGluttonBadge: data.has_glutton_badge || false,
            hasNightOwlBadge: data.has_night_owl_badge || false,
            hasArcadeBadge: data.has_arcade_badge || false,
            hasExplorerBadge: data.has_explorer_badge || false,
            hasProGamerBadge: data.has_pro_gamer_badge || false,
            hasCompletionistBadge: data.has_completionist_badge || false,
            hasHackerBadge: data.has_hacker_badge || false,
            walletBalance: data.wallet_balance || 0
        }, 'Profile updated successfully');

    } catch (error) {
        console.error('Update user profile error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

    export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, name, xp, tier, profile_pic, has_shadow_badge, has_caffeine_badge, has_glutton_badge, has_night_owl_badge, has_arcade_badge, has_explorer_badge, has_pro_gamer_badge, has_completionist_badge, has_hacker_badge')
                .eq('role', 'student')
                .order('xp', { ascending: false })
                .limit(10);
    
            if (error) {
                if (error.message.includes('Could find the column')) {
                    sendSuccess(res, [], 'Leaderboard empty');
                    return;
                }
                sendError(res, error.message, 500);
                return;
            }
    
            const leaderboard = (data || []).map(u => ({
                id: u.id,
                name: u.name,
                xp: u.xp || 0,
                tier: u.tier || 'BRONZE',
                profilePic: u.profile_pic || '',
                hasShadowBadge: u.has_shadow_badge || false,
                hasCaffeineBadge: u.has_caffeine_badge || false,
                hasGluttonBadge: u.has_glutton_badge || false,
                hasNightOwlBadge: u.has_night_owl_badge || false,
                hasArcadeBadge: u.has_arcade_badge || false,
                hasExplorerBadge: u.has_explorer_badge || false,
                hasProGamerBadge: u.has_pro_gamer_badge || false,
                hasCompletionistBadge: u.has_completionist_badge || false,
                hasHackerBadge: u.has_hacker_badge || false
            }));

        sendSuccess(res, leaderboard, 'Leaderboard fetched successfully');
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
            sendError(res, error.message, 500);
            return;
        }

        const users = (data || []).map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: displayRole(u.role),
            phoneNumber: u.phone_number,
            enrollmentNumber: u.enrollment_number,
            profilePic: u.profile_pic,
            isBanned: u.is_banned || false,
            isFrozen: u.is_frozen || false,
            createdAt: u.created_at
        }));

        sendSuccess(res, users, 'Users fetched successfully');
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
            sendError(res, error.message, 500);
            return;
        }

        sendSuccess(res, data, 'User role updated successfully');
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { is_banned, is_frozen, statusType, field, value } = req.body;

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

        const currentUserId = req.user?.id;
        if (id === currentUserId) {
            res.status(400).json({ error: 'You cannot ban or freeze your own administrator account' });
            return;
        }

        const { data: targetUser, error: fetchError } = await supabase.from('users').select('role').eq('id', id).single();
        if (fetchError || !targetUser) {
            res.status(404).json({ error: 'User does not exist' });
            return;
        }

        if (targetUser.role === ROLES.ADMIN) {
            res.status(403).json({ error: 'Illegal Action: Administrators cannot modify the status of other administrators' });
            return;
        }

        const { data, error } = await supabase
            .from('users')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[DATABASE_ERROR] Could not update user status:', error);
            res.status(500).json({ error: 'Failed to update account status. Database error occurred.' });
            return;
        }

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
        const authenticatedUserId = req.user?.id;
        const authenticatedUserRole = req.user?.role;

        if (authenticatedUserRole !== 'admin' && String(id) !== String(authenticatedUserId)) {
            res.status(403).json({ error: 'Forbidden: You can only view your own profile' });
            return;
        }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        sendSuccess(res, {
            id: data.id,
            name: data.name,
            email: data.email,
            role: displayRole(data.role),
            isFrozen: data.is_frozen || false,
            isBanned: data.is_banned || false,
            adminInsightsResetAt: data.admin_insights_reset_at,
            xp: data.xp || 0,
            tier: data.tier || 'BRONZE',
            profilePic: data.profile_pic,
            enrollmentNumber: data.enrollment_number,
            phoneNumber: data.phone_number,
            hasShadowBadge: data.has_shadow_badge || false,
            hasCaffeineBadge: data.has_caffeine_badge || false,
            hasGluttonBadge: data.has_glutton_badge || false,
            hasNightOwlBadge: data.has_night_owl_badge || false,
            hasArcadeBadge: data.has_arcade_badge || false,
            hasExplorerBadge: data.has_explorer_badge || false,
            hasProGamerBadge: data.has_pro_gamer_badge || false,
            hasCompletionistBadge: data.has_completionist_badge || false,
            hasHackerBadge: data.has_hacker_badge || false,
            walletBalance: data.wallet_balance || 0
        }, 'User profile fetched successfully');
    } catch (error) {
        console.error('Get user by id error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const resetAdminInsights = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.user?.id;
        
        if (!id || normalizeRole(req.user?.role) !== ROLES.ADMIN) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const now = new Date().toISOString();
        const { error } = await supabase
            .from('users')
            .update({ admin_insights_reset_at: now })
            .eq('id', id);

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        res.status(200).json({ message: 'Insights reset successfully', resetAt: now });
    } catch (error) {
        console.error('Reset admin insights error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const resetAllStudentXP = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.user?.id;
        
        if (!id || normalizeRole(req.user?.role) !== ROLES.ADMIN) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        const { error } = await supabase
            .from('users')
            .update({ 
                xp: 0, 
                tier: 'BRONZE',
                has_shadow_badge: false,
                has_caffeine_badge: false,
                has_glutton_badge: false,
                has_night_owl_badge: false,
                has_arcade_badge: false,
                has_explorer_badge: false,
                has_pro_gamer_badge: false,
                has_completionist_badge: false,
                has_hacker_badge: false
            })
            .eq('role', 'student');

        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }

        res.status(200).json({ message: 'All student XP reset successfully' });
    } catch (error) {
        console.error('Reset all student XP error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const nukeDatabase = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.user?.id;
        const { password } = req.body;

        if (!id || normalizeRole(req.user?.role) !== ROLES.ADMIN) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }

        if (!password) {
            res.status(400).json({ error: 'Administrator password is required' });
            return;
        }

        // Verify Admin Password
        const { data: adminUser, error: fetchErr } = await supabase
            .from('users')
            .select('password')
            .eq('id', id)
            .single();

        if (fetchErr || !adminUser) {
            res.status(500).json({ error: 'Verification system offline' });
            return;
        }

        const isMatch = await bcrypt.compare(password, adminUser.password);
        if (!isMatch) {
            res.status(401).json({ error: 'Incorrect administrator password' });
            return;
        }

        // Sequential Wipe to satisfy Foreign Key Constraints
        const tablesToClear = ['audit_logs', 'transactions', 'owner_order_history', 'order_items', 'orders', 'ratings', 'cart_items', 'menu_items', 'outlets', 'announcements'];
        
        for (const table of tablesToClear) {
            const { error } = await supabase.from(table).delete().not('id', 'is', null);
            if (error) {
                console.warn(`[NUKE] Warning: Skipping ${table} - ${error.message}`);
            }
        }

        // Reset User statistics
        const { error: userError } = await supabase.from('users').update({ 
            xp: 0, 
            tier: 'BRONZE',
            has_shadow_badge: false,
            has_caffeine_badge: false,
            has_glutton_badge: false,
            has_night_owl_badge: false,
            has_arcade_badge: false,
            has_explorer_badge: false,
            has_pro_gamer_badge: false,
            has_completionist_badge: false,
            has_hacker_badge: false
        }).neq('role', 'admin');
        const { error: resetErr } = await supabase.from('users').update({ admin_insights_reset_at: null }).eq('role', 'admin');


        if (userError || resetErr) {
            console.error('[NUKE_ERROR] User reset failed:', { userError, resetErr });
            res.status(500).json({ error: 'Database wipe critical error', details: 'Failed to reset user stats' });
            return;
        }

        res.status(200).json({ message: 'DATABASE SUCCESSFULLY PURGED' });

    } catch (error) {
        console.error('Nuke database error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/** 🎭 Universal Gamification Badge Granting. Idempotent. */
export const grantBadge = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { type } = req.body;
        
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

         if (!type || !BADGE_CONFIG[type as BadgeType]) {
             res.status(400).json({ error: 'Invalid badge type' });
             return;
         }

        const badgeDef = BADGE_CONFIG[type as BadgeType];

        const { data: userRow, error: fetchErr } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (fetchErr || !userRow) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const user = userRow as any;

        if (user.role !== 'student') {
            res.status(403).json({ error: 'Badges are only available for students' });
            return;
        }

        if (user[badgeDef.column]) {
            res.status(409).json({ message: 'Badge already claimed', alreadyClaimed: true });
            return;
        }

        const newXp = (user.xp || 0) + badgeDef.xp;
        let newTier = user.tier || 'BRONZE';
        if (newXp >= 200) newTier = 'ELECTRIC_BLUE';
        else if (newXp >= 100) newTier = 'GOLD';
        else if (newXp >= 40) newTier = 'SILVER';

        const updatePayload: any = { xp: newXp, tier: newTier };
        updatePayload[badgeDef.column] = true;

        const { error: updateErr } = await supabase
            .from('users')
            .update(updatePayload)
            .eq('id', userId);

        if (updateErr) {
            console.error('Shadow badge grant error:', updateErr);
            res.status(500).json({ error: 'Failed to grant badge' });
            return;
        }

        console.log(`[GAMIFICATION] 🎭 User ${userId} claimed ${badgeDef.label} Badge. New XP: ${newXp}`);
        res.status(200).json({ 
            message: `${badgeDef.label} Badge Granted (+${badgeDef.xp} XP)`, 
            xpGranted: badgeDef.xp, 
            newXp, 
            newTier 
        });
    } catch (error) {
        console.error('Grant shadow badge error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const revokeAllBadges = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'User ID is required' });
            return;
        }

        const badgeResetPayload: any = {
            has_shadow_badge: false,
            has_caffeine_badge: false,
            has_glutton_badge: false,
            has_night_owl_badge: false,
            has_arcade_badge: false,
            has_explorer_badge: false,
            has_pro_gamer_badge: false,
            has_completionist_badge: false,
            has_hacker_badge: false,
            xp: 0,
            tier: 'BRONZE',
        };

        const { error } = await supabase
            .from('users')
            .update(badgeResetPayload)
            .eq('id', id);

        // Re-fetch the updated user to return to the admin (important for sync)
        const { data: updatedUserData, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !updatedUserData) {
            console.error('Revoke success but fetch fail:', fetchError);
            res.status(200).json({ message: 'Revoked, but failed to fetch updated state.' });
            return;
        }

        const formattedUser = {
            id: updatedUserData.id,
            name: updatedUserData.name,
            email: updatedUserData.email,
            role: displayRole(updatedUserData.role),
            isFrozen: updatedUserData.is_frozen || false,
            isBanned: updatedUserData.is_banned || false,
            xp: updatedUserData.xp || 0,
            tier: updatedUserData.tier || 'BRONZE',
            profilePic: updatedUserData.profile_pic,
            enrollmentNumber: updatedUserData.enrollment_number,
            phoneNumber: updatedUserData.phone_number,
            hasShadowBadge: updatedUserData.has_shadow_badge || false,
            hasCaffeineBadge: updatedUserData.has_caffeine_badge || false,
            hasGluttonBadge: updatedUserData.has_glutton_badge || false,
            hasNightOwlBadge: updatedUserData.has_night_owl_badge || false,
            hasArcadeBadge: updatedUserData.has_arcade_badge || false,
            hasExplorerBadge: updatedUserData.has_explorer_badge || false,
            hasProGamerBadge: updatedUserData.has_pro_gamer_badge || false,
            hasCompletionistBadge: updatedUserData.has_completionist_badge || false,
            hasHackerBadge: updatedUserData.has_hacker_badge || false
        };

        console.log(`[ADMIN] 🚫 Admin revoked all badges for user ${id}`);
        res.status(200).json({ 
            message: 'All badges and XP have been revoked successfully.',
            user: formattedUser
        });
    } catch (error) {
        console.error('Revoke all badges error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

