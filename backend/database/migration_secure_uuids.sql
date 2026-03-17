-- Migration to change Orders ID to UUID
-- Note: In a production environment with millions of rows, this would be a multi-step process.
-- For this remediation, we will perform a safe replacement.

-- 1. Create a new temporary UUID column
ALTER TABLE public.orders ADD COLUMN new_id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.order_items ADD COLUMN new_order_id UUID;

-- 2. Map existing BIGINT IDs to the new UUID column in the child table
UPDATE public.order_items SET new_order_id = (SELECT new_id FROM public.orders WHERE public.orders.id = public.order_items.order_id);

-- 3. Drop constraints
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_pkey;

-- 4. Swap columns
ALTER TABLE public.orders DROP COLUMN id;
ALTER TABLE public.orders RENAME COLUMN new_id TO id;
ALTER TABLE public.orders ADD PRIMARY KEY (id);

ALTER TABLE public.order_items DROP COLUMN order_id;
ALTER TABLE public.order_items RENAME COLUMN new_order_id TO order_id;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
