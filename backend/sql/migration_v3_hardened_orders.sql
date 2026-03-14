-- 1. Add stock column to menu_items (if not exists)
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 100;

-- 2. Create the CORRECTED secure order function for UUIDs
-- This version correctly uses UUID for outlet_id and menuItemId
CREATE OR REPLACE FUNCTION public.create_order_v2(
    p_user_id UUID,
    p_outlet_id UUID,
    p_items JSONB
) RETURNS JSONB AS $$
DECLARE
    v_order_id BIGINT;
    v_total_amount DECIMAL(10, 2) := 0;
    v_item RECORD;
    v_menu_item RECORD;
    v_result JSONB;
BEGIN
    -- 1. Validate items and calculate total while locking rows for stock check
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(menu_item_id UUID, quantity INTEGER)
    LOOP
        -- SELECT ... FOR UPDATE locks the row until this transaction finishes
        SELECT id, name, price, stock, availability, outlet_id INTO v_menu_item
        FROM public.menu_items 
        WHERE id = v_item.menu_item_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Menu item % not found', v_item.menu_item_id;
        END IF;

        IF NOT v_menu_item.availability THEN
            RAISE EXCEPTION 'Item % is currently unavailable', v_item.name;
        END IF;

        IF v_menu_item.outlet_id != p_outlet_id THEN
            RAISE EXCEPTION 'Item % belongs to a different outlet', v_item.name;
        END IF;

        IF v_menu_item.stock < v_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for item %', v_item.name;
        END IF;

        v_total_amount := v_total_amount + (v_menu_item.price * v_item.quantity);
        
        -- Update stock immediately
        UPDATE public.menu_items SET stock = stock - v_item.quantity WHERE id = v_item.menu_item_id;
    END LOOP;

    -- 2. Create the Order
    INSERT INTO public.orders (user_id, outlet_id, total_amount, status, payment_status, created_at)
    VALUES (p_user_id, p_outlet_id, v_total_amount, 'pending', 'pending', NOW())
    RETURNING id INTO v_order_id;

    -- 3. Insert Order Items (using snapshots of names and prices)
    INSERT INTO public.order_items (order_id, menu_item_id, item_name, quantity, price)
    SELECT v_order_id, x.menu_item_id, m.name, x.quantity, m.price
    FROM jsonb_to_recordset(p_items) AS x(menu_item_id UUID, quantity INTEGER)
    JOIN public.menu_items m ON m.id = x.menu_item_id;

    -- 4. Clear User's Cart
    DELETE FROM public.cart_items WHERE user_id = p_user_id;

    -- 5. Prepare Return Data
    SELECT jsonb_build_object(
        'id', v_order_id,
        'total_amount', v_total_amount,
        'status', 'pending'
    ) INTO v_result;

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    -- PostgreSQL automatically rolls back the entire transaction on EXCEPTION
    RAISE;
END;
$$ LANGUAGE plpgsql;
