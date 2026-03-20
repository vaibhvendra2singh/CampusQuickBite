-- Migration: Add insights_reset_at to outlets table
-- This allows shop owners to permanently reset their dashboard and analytics
-- view to zero out metrics without deleting any order history.

ALTER TABLE public.outlets ADD COLUMN IF NOT EXISTS insights_reset_at TIMESTAMPTZ;
