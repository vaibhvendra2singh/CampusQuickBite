-- Migration: Order History Enhancements for Supabase (PostgreSQL)
-- 1. Add item_name snapshot to order_items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS item_name TEXT;

-- Backfill existing rows with names from menu_items where possible
UPDATE public.order_items oi
SET item_name = mi.name
FROM public.menu_items mi
WHERE oi.menu_item_id = mi.id
  AND oi.item_name IS NULL;

-- 2. Add delivery_timestamp to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_timestamp TIMESTAMPTZ;

-- 3. Align statuses to lowercase (common in Node.js/Supabase setups here)
UPDATE public.orders SET status = 'pending' WHERE status = 'placed';
UPDATE public.orders SET status = 'ready' WHERE status = 'ready_for_pickup';
UPDATE public.orders SET status = 'delivered' WHERE status = 'completed';
