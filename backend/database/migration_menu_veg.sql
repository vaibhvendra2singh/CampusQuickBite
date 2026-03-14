-- Migration to add is_veg column to menu_items
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT TRUE;

-- Update existing items based on keywords as a starting point
UPDATE public.menu_items 
SET is_veg = FALSE 
WHERE name ILIKE ANY (ARRAY['%chicken%', '%meat%', '%egg%', '%fish%', '%mutton%', '%pork%', '%beef%', '%prawn%', '%crab%', '%squid%']);
