-- Migration: Add Email Verification to Users Table

-- 1. Add new columns for email verification
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verification_token TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verification_expiry TIMESTAMP WITH TIME ZONE;

-- 2. Retroactively verify existing users so they don't get locked out
UPDATE public.users SET is_email_verified = TRUE WHERE is_email_verified = FALSE;
