-- Migration script to convert order IDs from UUID to incremental integers
-- IMPORTANT: This will reset order IDs. Run this in your Supabase SQL editor.

-- 1. Drop the foreign key in order_items
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;

-- 2. Modify orders table
-- We'll create a new column, copy data, and then swap.
ALTER TABLE public.orders ADD COLUMN new_id BIGINT GENERATED ALWAYS AS IDENTITY;

-- Update order_items to use new IDs by joining on old UUID
ALTER TABLE public.order_items ADD COLUMN new_order_id BIGINT;
UPDATE public.order_items oi SET new_order_id = o.new_id FROM public.orders o WHERE oi.order_id = o.id;

-- 3. Cleanup orders
ALTER TABLE public.orders DROP CONSTRAINT orders_pkey CASCADE;
ALTER TABLE public.orders DROP COLUMN id;
ALTER TABLE public.orders RENAME COLUMN new_id TO id;
ALTER TABLE public.orders ADD PRIMARY KEY (id);

-- 4. Cleanup order_items
ALTER TABLE public.order_items DROP COLUMN order_id;
ALTER TABLE public.order_items RENAME COLUMN new_order_id TO order_id;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

-- 5. Add missing columns to orders if not existing
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 6. Update status check to include 'cancelled' and use lowercase consistency
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled'));
