import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../services/logger';
import { displayRole, ROLES } from '../utils/roles';
import { sendPasswordResetEmail, sendSignupOTPEmail } from '../services/emailService';
import { sendSuccess, sendError } from '../utils/response';

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not defined in environment variables');
    return secret;
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, password, role, enrollmentNumber, shopName, shopLocation } = req.body;
        const email = req.body.email?.toLowerCase();

        if (!name || !email || !password) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }

        // Normalize incoming role: support 'SHOP_OWNER', 'owner', 'admin', 'STUDENT', 'student'
        const normalizeIncomingRole = (r?: string): typeof ROLES[keyof typeof ROLES] => {
            if (!r) return ROLES.STUDENT;
            const lower = r.toLowerCase();
            if (lower === 'shop_owner' || lower === 'owner') return ROLES.OWNER;
            if (lower === 'admin') return ROLES.ADMIN;
            return ROLES.STUDENT;
        };
        const normalizedRole = normalizeIncomingRole(role);

        // Shop owners must provide a shop name
        if (normalizedRole === ROLES.OWNER && !shopName) {
            res.status(400).json({ error: 'Shop name is required for shop owner registration' });
            return;
        }

        const { data: existingUser, error: checkError } = await supabase.from('users').select('id').eq('email', email).single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('[AUTH_ERROR] System check failed:', checkError);
            res.status(500).json({ error: 'An internal error occurred' });
            return;
        }

        if (existingUser) {
            sendError(res, 'User already exists', 400);
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12); 

        // Shop owners and admins are pre-verified (no OTP needed)
        const isOwnerOrAdmin = normalizedRole === ROLES.OWNER || normalizedRole === ROLES.ADMIN;
        const otp = isOwnerOrAdmin ? null : Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = isOwnerOrAdmin ? null : new Date(Date.now() + 10 * 60000).toISOString();

        const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .insert([{ 
                name, 
                email, 
                password: hashedPassword, 
                role: normalizedRole,
                enrollment_number: enrollmentNumber,
                email_verification_token: otp,
                email_verification_expiry: otpExpiry,
                is_email_verified: isOwnerOrAdmin // owners/admins are pre-verified
            }])
            .select()
            .single();

        if (dbError || !dbUser) {
            logger.error(`Registration failed for ${email}: ${dbError?.message}`, { ip: req.ip });
            sendError(res, dbError?.message || 'The server could not create your account at this time.');
            return;
        }

        logger.info(`User registered: ${email} (role: ${normalizedRole}, verified: ${isOwnerOrAdmin})`, { userId: dbUser.id, role: normalizedRole, ip: req.ip });

        // ── Auto-create outlet for self-registering shop owners ─────────────────
        if (normalizedRole === ROLES.OWNER && shopName) {
            const { error: outletError } = await supabase
                .from('outlets')
                .insert([{
                    name: shopName.trim(),
                    location: shopLocation?.trim() || 'Campus',
                    owner_id: dbUser.id,
                    is_open: false
                }]);

            if (outletError) {
                // Non-blocking: user account is created; outlet can be set up later
                logger.warn(`[REGISTER] Outlet creation failed for new owner ${email}: ${outletError.message}`);
            } else {
                logger.info(`[REGISTER] Outlet "${shopName}" created and linked to owner ${email}`, { userId: dbUser.id });
            }
        }
        // ────────────────────────────────────────────────────────────────────────

        if (!isOwnerOrAdmin && otp) {
            sendSignupOTPEmail(email, otp).catch(err => {
                logger.error(`Failed to send signup OTP to ${email}:`, err);
            });
        }

        if (isOwnerOrAdmin) {
            res.status(201).json({
                message: normalizedRole === ROLES.OWNER
                    ? `Account and shop "${shopName}" created! You can now log in.`
                    : 'Account created successfully! You can now log in.',
                requiresVerification: false,
                email: email
            });
        } else {
            res.status(201).json({
                message: 'Registration successful! Please check your email for the verification code.',
                requiresVerification: true,
                email: email
            });
        }
    } catch (error) {
        logger.error(`Registration critical error:`, { error, ip: req.ip });
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { password, enrollmentNumber } = req.body;
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
            sendError(res, 'Invalid credentials', 401);
            return;
        }

        if ((profileData as any).is_banned === true) {
            logger.error(`Login failed: User banned - ${email}`, { ip: req.ip });
            sendError(res, 'ACCOUNT_BANNED', 401);
            return;
        }

        // Only students must verify their email. Owners/admins are provisioned by admin and skip verification.
        const userRole = profileData.role as string;
        const requiresVerification = userRole !== ROLES.OWNER && userRole !== ROLES.ADMIN;
        if (requiresVerification && profileData.is_email_verified === false) {
             logger.warn(`Login failed: Email not verified - ${email}`, { ip: req.ip });
            sendError(res, 'ACCOUNT_NOT_VERIFIED', 401);
            return;
        }

        const isMatch = await bcrypt.compare(password, profileData.password);
        if (!isMatch) {
            logger.warn(`Login failed: Incorrect password - ${email}`, { ip: req.ip });
            sendError(res, 'Invalid credentials', 401);
            return;
        }

        let finalEnrollment = profileData.enrollment_number;
        
        if (enrollmentNumber && finalEnrollment) {
            if (enrollmentNumber.trim().toUpperCase() !== finalEnrollment.trim().toUpperCase()) {
                logger.warn(`Login failed: Enrollment ID mismatch - ${email}. Input: "${enrollmentNumber}", DB: "${finalEnrollment}"`, { ip: req.ip });
                sendError(res, 'Enrollment ID does not match our records', 401);
                return;
            }
        } else if (!finalEnrollment && enrollmentNumber) {
            console.log(`[AUTH] Syncing missing enrollment number for ${email}: ${enrollmentNumber}`);
            const { error: syncError } = await supabase
                .from('users')
                .update({ enrollment_number: enrollmentNumber.trim() })
                .eq('id', profileData.id);
            
            if (!syncError) finalEnrollment = enrollmentNumber.trim();
        }

        logger.info(`Login successful: ${email}`, { userId: profileData.id, role: profileData.role, ip: req.ip });

        const payload = { 
            id: profileData.id, 
            role: displayRole(profileData.role), 
            name: profileData.name, 
            email: profileData.email 
        };
        
        const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '365d' });
        
        const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET as string, { expiresIn: '30d' });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        sendSuccess(res, {
            token,
            id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            role: displayRole(profileData.role),
            user: {
                ...profileData,
                role: displayRole(profileData.role),
                phoneNumber: profileData.phone_number || '',
                enrollmentNumber: finalEnrollment || '',
                profilePic: profileData.profile_pic || '',
                hasShadowBadge: profileData.has_shadow_badge || false,
                hasCaffeineBadge: profileData.has_caffeine_badge || false,
                hasGluttonBadge: profileData.has_glutton_badge || false,
                hasNightOwlBadge: profileData.has_night_owl_badge || false,
                hasArcadeBadge: profileData.has_arcade_badge || false,
                hasExplorerBadge: profileData.has_explorer_badge || false,
                hasProGamerBadge: profileData.has_pro_gamer_badge || false,
                hasCompletionistBadge: profileData.has_completionist_badge || false,
                xp: profileData.xp || 0,
                tier: profileData.tier || 'BRONZE'
            }
        }, 'Login successful');

    } catch (error) {
        logger.error(`Login critical error:`, { error, email: req.body.email, ip: req.ip });
        sendError(res, 'Internal Server Error');
    }
};

export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            sendError(res, 'Refresh token missing. Please log in again.', 401);
            return;
        }

        jwt.verify(refreshToken, JWT_REFRESH_SECRET as string, async (err: any, decoded: any) => {
            if (err) {
                res.clearCookie('refreshToken');
                sendError(res, 'Session expired. Please log in again.', 401);
                return;
            }

            const { data: user, error } = await supabase.from('users').select('is_banned, role').eq('id', decoded.id).single();

            if (error || !user) {
                res.clearCookie('refreshToken');
                sendError(res, 'User no longer exists', 401);
                return;
            }

            if (user.is_banned) {
                res.clearCookie('refreshToken');
                sendError(res, 'ACCOUNT_BANNED', 403);
                return;
            }

            const payload = { 
                id: decoded.id, 
                role: displayRole(user?.role || decoded.role), 
                name: decoded.name, 
                email: decoded.email 
            };
            const newToken = jwt.sign(payload, getJwtSecret(), { expiresIn: '365d' });

            sendSuccess(res, { token: newToken }, 'Token refreshed');
        });
    } catch (error) {
        logger.error(`Refresh token error:`, { error, ip: req.ip });
        sendError(res, 'Internal Server Error');
    }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
    sendSuccess(res, null, 'Logged out successfully');
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            sendError(res, 'Email and OTP are required', 400);
            return;
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('id, email_verification_token, email_verification_expiry')
            .eq('email', email.toLowerCase())
            .single();

        if (error || !user) {
            sendError(res, 'User does not exist', 400);
            return;
        }

        if (user.email_verification_token !== otp) {
            sendError(res, 'Invalid verification code.', 400);
            return;
        }

        if (new Date(user.email_verification_expiry) < new Date()) {
            sendError(res, 'Verification code has expired. Please request a new one.', 400);
            return;
        }

        const { error: updateError } = await supabase.from('users').update({ 
            is_email_verified: true,
            email_verification_token: null, 
            email_verification_expiry: null 
        }).eq('id', user.id);

        if (updateError) {
            sendError(res, 'Failed to verify account', 500);
            return;
        }

        sendSuccess(res, null, 'Email verified successfully! You can now log in.');
    } catch (err) {
        sendError(res, 'Server error', 500);
    }
};

export const resendOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            sendError(res, 'Email is required', 400);
            return;
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('id, name')
            .eq('email', email.toLowerCase())
            .single();

        if (error || !user) {
            sendError(res, 'User does not exist', 400);
            return;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60000).toISOString();

        await supabase.from('users').update({ 
            email_verification_token: otp, 
            email_verification_expiry: otpExpiry 
        }).eq('id', user.id);

        sendSignupOTPEmail(email, otp).catch(err => {
            logger.error(`Failed to resend signup OTP to ${email}:`, err);
        });

        sendSuccess(res, null, 'New verification code sent!');
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.body;
        if (!token) {
            sendError(res, 'Verification token is required', 400);
            return;
        }

        const { data: user, error } = await supabase.from('users').select('id, email_verification_expiry').eq('email_verification_token', token).single();
        if (error || !user) {
            sendError(res, 'Invalid or expired verification token.', 400);
            return;
        }

        if (new Date(user.email_verification_expiry) < new Date()) {
            sendError(res, 'Verification token has expired. Please register again or request a new token.', 400);
            return;
        }

        await supabase.from('users').update({ 
            is_email_verified: true,
            email_verification_token: null, 
            email_verification_expiry: null 
        }).eq('id', user.id);

        sendSuccess(res, null, 'Email verified successfully!');
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        if (!email) {
            sendError(res, 'Email is required', 400);
            return;
        }

        const { data: user, error } = await supabase.from('users').select('id, email').eq('email', email).single();
        if (error || !user) {
            sendError(res, 'User does not exist', 400);
            return;
        }

        const token = require('crypto').randomUUID();
        const expiry = new Date(Date.now() + 30 * 60000).toISOString(); // 30 mins

        const { error: updateError } = await supabase.from('users').update({ reset_token: token, token_expiry: expiry }).eq('email', email);

        if (updateError) {
            logger.error(`[Auth] Failed to insert reset token into database for ${email}:`, updateError);
            res.status(500).json({ error: 'Database error: Ensure reset_token and token_expiry columns exist in users table.' });
            return;
        }

        sendPasswordResetEmail(user.email, token).catch(e => {
            logger.error(`[Email Service] Failed to send password reset to ${email}:`, e);
        });

        logger.info(`Password reset requested for ${email}`);
        sendSuccess(res, null, 'Reset link/token dispatched successfully if email exists.');
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const verifyToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.body;
        if (!token) {
            sendError(res, 'Token is required', 400);
            return;
        }

        const { data: user, error } = await supabase.from('users').select('id, token_expiry').eq('reset_token', token).single();
        if (error || !user) {
            sendError(res, 'Invalid or expired reset token.', 400);
            return;
        }

        if (new Date(user.token_expiry) < new Date()) {
            await supabase.from('users').update({ reset_token: null, token_expiry: null }).eq('id', user.id);
            res.status(400).json({ error: 'Reset token has expired.' });
            return;
        }

        sendSuccess(res, { valid: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            sendError(res, 'Token and new password required', 400);
            return;
        }

        const { data: user, error } = await supabase.from('users').select('*').eq('reset_token', token).single();
        if (error || !user) {
            sendError(res, 'Invalid reset token.', 400);
            return;
        }

        if (new Date(user.token_expiry) < new Date()) {
            sendError(res, 'Reset token has expired.', 400);
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

        sendSuccess(res, null, 'Password successfully reset!');
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = (req as any).user?.id; // Assuming auth middleware attaches user.id

        if (!userId) {
            sendError(res, 'Unauthorized', 401);
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
            sendError(res, 'New password must be different from the old password.', 400);
            return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await supabase.from('users').update({ password: hashedPassword }).eq('id', user.id);

        sendSuccess(res, null, 'Password changed successfully!');
    } catch (err) {
        sendError(res, 'Server error', 500);
    }
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token: supabaseToken } = req.body;
        if (!supabaseToken) {
            sendError(res, 'No token provided', 400);
            return;
        }

        // 1. Verify token with Supabase and get user info
        const { data: { user: sbUser }, error: sbError } = await supabase.auth.getUser(supabaseToken);
        
        if (sbError || !sbUser) {
            console.error('[GOOGLE_AUTH] Supabase verification failed:', sbError);
            sendError(res, 'Invalid Google session', 401);
            return;
        }

        const email = sbUser.email?.toLowerCase();
        if (!email) {
            sendError(res, 'Email not provided by Google', 400);
            return;
        }

        // 2. Check if user exists in our DB
        let { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        // 3. Create user if doesn't exist (Student by default)
        if (profileError && profileError.code === 'PGRST116') {
            const tempEnrollment = 'G-' + Math.random().toString(36).substring(2, 10).toUpperCase();
            
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert([{
                    name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || 'Google User',
                    email,
                    role: ROLES.STUDENT,
                    is_email_verified: true,
                    profile_pic: sbUser.user_metadata?.avatar_url || '',
                    enrollment_number: tempEnrollment,
                    password: 'OAUTH_USER_' + Math.random() // Placeholder to avoid null constraint if any
                }])
                .select()
                .single();
            
            if (insertError) {
                console.error('[GOOGLE_AUTH] DB Insert failed:', insertError);
                sendError(res, 'Failed to create account: ' + insertError.message, 500);
                return;
            }
            profileData = newUser;
        } else if (profileError) {
            sendError(res, 'Database error', 500);
            return;
        }

        // 4. Ban check
        if (profileData.is_banned === true) {
            sendError(res, 'ACCOUNT_BANNED', 401);
            return;
        }

        // 5. Generate application JWT 
        const payload = { 
            id: profileData.id, 
            role: displayRole(profileData.role), 
            name: profileData.name, 
            email: profileData.email 
        };
        
        const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '365d' });
        const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET as string, { expiresIn: '30d' });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        logger.info(`Google login successful: ${email}`, { userId: profileData.id });

        sendSuccess(res, {
            token,
            user: {
                ...profileData,
                role: displayRole(profileData.role),
                phoneNumber: profileData.phone_number || '',
                enrollmentNumber: profileData.enrollment_number || '',
                profilePic: profileData.profile_pic || '',
                xp: profileData.xp || 0,
                tier: profileData.tier || 'BRONZE'
            }
        }, 'Google login successful');
    } catch (error) {
        logger.error(`Google login critical error:`, { error, ip: req.ip });
        sendError(res, 'Internal Server Error');
    }
};
