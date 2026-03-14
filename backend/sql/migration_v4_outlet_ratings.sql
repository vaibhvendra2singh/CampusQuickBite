-- Migration to support Outlet Ratings and add necessary columns

-- 1. Add outlet_id to ratings table (nullable, references outlets)
-- Note: it already has menu_item_id which is references menu_items.
-- We want a rating to be for EITHER a menu item OR an outlet.
ALTER TABLE public.ratings 
ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE;

-- 2. Add average_rating and rating_count to outlets table
ALTER TABLE public.outlets 
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- 3. Ensure menu_items also have these (they should, but just in case)
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
