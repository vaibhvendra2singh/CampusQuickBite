-- Migration: Add item_name snapshot column to order_items
-- This ensures that even if a menu item is deleted, the order history
-- still shows the original item name instead of "Unknown Item".

-- Step 1: Add the column (safe to run even if it already exists)
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS item_name TEXT;

-- Step 2: Backfill existing rows with names from menu_items where possible
UPDATE public.order_items oi
SET item_name = mi.name
FROM public.menu_items mi
WHERE oi.menu_item_id = mi.id
  AND oi.item_name IS NULL;

-- Step 3: For rows where menu_item is already gone, set a placeholder
UPDATE public.order_items
SET item_name = 'Removed Item'
WHERE item_name IS NULL;
