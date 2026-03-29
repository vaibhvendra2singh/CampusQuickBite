-- Migration: Add admin_insights_reset_at to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS admin_insights_reset_at TIMESTAMPTZ;
