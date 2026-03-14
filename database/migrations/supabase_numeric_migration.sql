-- SUPABASE MIGRATION (V2 - SAFE): CONVERT UUIDs TO NUMERIC IDs
-- This version checks for table existence to avoid "relation does not exist" errors.

DO $$ 
BEGIN
    -- 1. Create a sequence for the new IDs if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'orders_id_seq') THEN
        CREATE SEQUENCE orders_id_seq;
    END IF;

    -- 2. Modify 'orders' table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS numeric_id BIGINT;
        UPDATE public.orders SET numeric_id = nextval('orders_id_seq') WHERE numeric_id IS NULL;
    END IF;

    -- 3. Modify 'order_items' table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
        ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS numeric_order_id BIGINT;
        -- Map numeric_order_id based on UUID join
        UPDATE public.order_items oi 
        SET numeric_order_id = o.numeric_id 
        FROM public.orders o 
        WHERE oi.order_id = o.id;
    END IF;

    -- 4. Modify 'payments' table ONLY if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
        ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS numeric_order_id BIGINT;
        UPDATE public.payments p 
        SET numeric_order_id = o.numeric_id 
        FROM public.orders o 
        WHERE p.order_id = o.id;
    END IF;
END $$;

-- 5. Drop old foreign keys and constraints (These must be done outside DO block if they involve DDL that might fail)
-- Using 'ALTER TABLE ... DROP CONSTRAINT IF EXISTS' for safety
ALTER TABLE IF EXISTS public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE IF EXISTS public.payments DROP CONSTRAINT IF EXISTS payments_order_id_fkey;
ALTER TABLE IF EXISTS public.orders DROP CONSTRAINT IF EXISTS orders_pkey;

-- 6. Finalize columns in 'orders'
ALTER TABLE public.orders DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE public.orders RENAME COLUMN numeric_id TO id;
ALTER TABLE public.orders ADD PRIMARY KEY (id);
ALTER TABLE public.orders ALTER COLUMN id SET DEFAULT nextval('orders_id_seq');

-- 7. Finalize 'order_items'
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='order_id') THEN
        ALTER TABLE public.order_items DROP COLUMN order_id;
        ALTER TABLE public.order_items RENAME COLUMN numeric_order_id TO order_id;
        ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 8. Finalize 'payments'
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='order_id') THEN
        ALTER TABLE public.payments DROP COLUMN order_id;
        ALTER TABLE public.payments RENAME COLUMN numeric_order_id TO order_id;
        ALTER TABLE public.payments ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
END $$;
