-- Add fcm_token and push_type to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS push_type TEXT DEFAULT 'web-push'; -- 'web-push' or 'fcm'
