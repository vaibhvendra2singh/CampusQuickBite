import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import logger from '../services/logger';
import { normalizeRole, displayRole, ROLES } from '../utils/roles';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, password, role } = req.body;
        const email = req.body.email?.toLowerCase();


        if (!name || !email || !password) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }

        // SECURITY: Role escalation prevention. Always default to student for public registration.
        // Admins and Shop Owners must be created through the internal admin dashboard.
        const normalizedRole = ROLES.STUDENT;

        // Check if user already exists
        const { data: existingUser, error: checkError } = await supabase.from('users').select('id').eq('email', email).single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('[AUTH_ERROR] System check failed:', checkError);
            res.status(500).json({ error: 'An internal error occurred' });
            return;
        }

        if (existingUser) {
            res.status(400).json({ error: 'User already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12); // Increased cost

        const verificationToken = require('crypto').randomUUID();
        const verificationExpiry = new Date(Date.now() + 24 * 60 * 60000).toISOString(); // 24 hours

        const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .insert([{ 
                name, 
                email, 
                password: hashedPassword, 
                role: normalizedRole,
                email_verification_token: verificationToken,
                email_verification_expiry: verificationExpiry
            }])
            .select()
            .single();

        if (dbError || !dbUser) {
            logger.error(`Registration failed for ${email}: ${dbError?.message}`, { ip: req.ip });
            res.status(400).json({ error: 'The server could not create your account at this time.' });
            return;
        }

        logger.info(`User registered: ${email}`, { userId: dbUser.id, role: normalizedRole, ip: req.ip });

        // Mock email sending
        console.log(`\n=== EMAIL VERIFICATION FOR ${email} ===\nVerification Link: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}\n=========================================\n`);

        res.status(201).json({
            message: 'Registration successful. Please check your email to verify your account.',
            requiresVerification: true
        });
    } catch (error) {
        logger.error(`Registration critical error:`, { error, ip: req.ip });
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { password } = req.body;
        const email = req.body.email?.toLowerCase();


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
            logger.warn(`Login failed: User not found - ${email}`, { ip: req.ip });
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Resilient check for ban status
        if ((profileData as any).is_banned === true) {
            res.status(401).json({ error: 'ACCOUNT_BANNED' });
            return;
        }

        if (profileData.is_email_verified === false) {
            res.status(401).json({ error: 'ACCOUNT_NOT_VERIFIED' });
            return;
        }

        const isMatch = await bcrypt.compare(password, profileData.password);
        if (!isMatch) {
            logger.warn(`Login failed: Incorrect password - ${email}`, { ip: req.ip });
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        logger.info(`Login successful: ${email}`, { userId: profileData.id, role: profileData.role, ip: req.ip });

        const token = jwt.sign({ id: profileData.id, role: profileData.role }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Login successful',
            token,
            id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            role: displayRole(profileData.role),
            user: {
                ...profileData,
                role: displayRole(profileData.role),
                phoneNumber: profileData.phone_number || '',
                enrollmentNumber: profileData.enrollment_number || '',
                profilePic: profileData.profile_pic || ''
            }
        });
    } catch (error) {
        logger.error(`Login critical error:`, { error, email: req.body.email, ip: req.ip });
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.body;
        if (!token) {
            res.status(400).json({ error: 'Verification token is required' });
            return;
        }

        const { data: user, error } = await supabase.from('users').select('id, email_verification_expiry').eq('email_verification_token', token).single();
        if (error || !user) {
            res.status(400).json({ error: 'Invalid or expired verification token.' });
            return;
        }

        if (new Date(user.email_verification_expiry) < new Date()) {
            res.status(400).json({ error: 'Verification token has expired. Please register again or request a new token.' });
            return;
        }

        await supabase.from('users').update({ 
            is_email_verified: true,
            email_verification_token: null, 
            email_verification_expiry: null 
        }).eq('id', user.id);

        res.status(200).json({ message: 'Email verified successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
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
