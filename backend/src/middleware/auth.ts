import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import jwt from 'jsonwebtoken';
import { normalizeRole } from '../utils/roles';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
            return;
        }

        const token = authHeader.split(' ')[1];

        const decoded: any = jwt.verify(token, JWT_SECRET);

        const { data: user, error: banError } = await supabase
            .from('users')
            .select('is_banned')
            .eq('id', decoded.id)
            .maybeSingle();

        if (banError) {
            console.warn('Authentication: Skipping ban check due to DB error (likely missing column):', banError.message);
        } else if (user?.is_banned) {
            res.status(401).json({ error: 'ACCOUNT_BANNED' });
            return;
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
        return;
    }
};

export const requireRole = (roles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized: User not authenticated' });
                return;
            }

            const { data: userData, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', req.user.id)
                .single();

            if (error || !userData) {
                res.status(403).json({ error: 'Forbidden: Role not found' });
                return;
            }

            const normalizedRequiredRoles = roles.map(r => normalizeRole(r));
            if (!normalizedRequiredRoles.includes(normalizeRole(userData.role))) {
                res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
                return;
            }


            next();
        } catch (error) {
            console.error('Role middleware error:', error);
            res.status(500).json({ error: 'Internal Server Error during role check' });
            return;
        }
    };
};
