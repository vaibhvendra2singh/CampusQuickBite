-- Migration: Create owner_order_history table
-- A permanent, denormalized archive of completed & cancelled orders.
-- This table is the source of truth for owner insights & order history,
-- completely independent of the live `orders` table.

-- =================================================================
-- 1. CREATE TABLE
-- =================================================================
CREATE TABLE IF NOT EXISTS public.owner_order_history (
    id              BIGSERIAL PRIMARY KEY,
    owner_id        UUID NOT NULL REFERENCES public.users(id),
    order_id        BIGINT NOT NULL,
    outlet_id       UUID NOT NULL,
    student_id      UUID REFERENCES public.users(id),
    student_name    TEXT DEFAULT 'Unknown',
    student_email   TEXT DEFAULT '',
    items           JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount    DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status          TEXT NOT NULL CHECK (status IN ('completed', 'cancelled')),
    payment_status  TEXT DEFAULT 'pending',
    payment_method  TEXT DEFAULT 'unknown',
    order_date      DATE NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL,
    completed_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id)   -- Prevent duplicate entries for the same order
);

-- =================================================================
-- 2. INDEXES (for fast owner-scoped queries)
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_ooh_owner_id     ON public.owner_order_history (owner_id);
CREATE INDEX IF NOT EXISTS idx_ooh_created_at   ON public.owner_order_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ooh_status       ON public.owner_order_history (status);
CREATE INDEX IF NOT EXISTS idx_ooh_order_date   ON public.owner_order_history (order_date DESC);
CREATE INDEX IF NOT EXISTS idx_ooh_outlet_id    ON public.owner_order_history (outlet_id);

-- Composite index for the most common query pattern: owner + recent + status
CREATE INDEX IF NOT EXISTS idx_ooh_owner_date_status
    ON public.owner_order_history (owner_id, order_date DESC, status);

-- =================================================================
-- 3. ENABLE RLS (Row Level Security)
-- =================================================================
ALTER TABLE public.owner_order_history ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can only read their own rows (enforced at DB level as extra safety)
CREATE POLICY owner_order_history_owner_select
    ON public.owner_order_history
    FOR SELECT
    USING (owner_id = auth.uid());

-- Service role bypasses RLS (used by backend with service key)
-- No additional policy needed for INSERT/DELETE since backend uses service_role_key.

-- =================================================================
-- 4. TRIGGER: Auto-archive orders when status changes to completed/cancelled
-- =================================================================
CREATE OR REPLACE FUNCTION public.archive_completed_order()
RETURNS TRIGGER AS $$
DECLARE
    v_owner_id UUID;
    v_student_name TEXT;
    v_student_email TEXT;
    v_items JSONB;
BEGIN
    -- Only fire on status change TO completed or cancelled
    IF NEW.status NOT IN ('completed', 'cancelled') THEN
        RETURN NEW;
    END IF;

    -- Skip if status didn't actually change
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Look up the outlet owner
    SELECT owner_id INTO v_owner_id
    FROM public.outlets
    WHERE id = NEW.outlet_id;

    IF v_owner_id IS NULL THEN
        RETURN NEW;  -- No owner found, skip archival silently
    END IF;

    -- Look up the student info
    SELECT name, email INTO v_student_name, v_student_email
    FROM public.users
    WHERE id = NEW.user_id;

    -- Build items JSONB array from order_items
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'itemId', oi.menu_item_id,
        'name', COALESCE(oi.item_name, mi.name, 'Unknown Item'),
        'quantity', oi.quantity,
        'price', oi.price
    )), '[]'::jsonb)
    INTO v_items
    FROM public.order_items oi
    LEFT JOIN public.menu_items mi ON mi.id = oi.menu_item_id
    WHERE oi.order_id = NEW.id;

    -- Upsert into history (handles duplicate safely via ON CONFLICT)
    INSERT INTO public.owner_order_history (
        owner_id, order_id, outlet_id, student_id,
        student_name, student_email, items,
        total_amount, status, payment_status, payment_method,
        order_date, created_at, completed_at
    ) VALUES (
        v_owner_id, NEW.id, NEW.outlet_id, NEW.user_id,
        COALESCE(v_student_name, 'Unknown'),
        COALESCE(v_student_email, ''),
        v_items,
        NEW.total_amount,
        NEW.status,
        COALESCE(NEW.payment_status, 'pending'),
        COALESCE(NEW.payment_method, 'unknown'),
        DATE(NEW.created_at),
        NEW.created_at,
        NOW()
    )
    ON CONFLICT (order_id) DO UPDATE SET
        status = EXCLUDED.status,
        payment_status = EXCLUDED.payment_status,
        completed_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to orders table
DROP TRIGGER IF EXISTS trg_archive_completed_order ON public.orders;
CREATE TRIGGER trg_archive_completed_order
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.archive_completed_order();

-- =================================================================
-- 5. BACKFILL: Copy all existing completed/cancelled orders into history
-- =================================================================
INSERT INTO public.owner_order_history (
    owner_id, order_id, outlet_id, student_id,
    student_name, student_email, items,
    total_amount, status, payment_status, payment_method,
    order_date, created_at, completed_at
)
SELECT
    o2.owner_id,
    o.id,
    o.outlet_id,
    o.user_id,
    COALESCE(u.name, 'Unknown'),
    COALESCE(u.email, ''),
    COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
            'itemId', oi.menu_item_id,
            'name', COALESCE(oi.item_name, mi.name, 'Unknown'),
            'quantity', oi.quantity,
            'price', oi.price
        ))
        FROM public.order_items oi
        LEFT JOIN public.menu_items mi ON mi.id = oi.menu_item_id
        WHERE oi.order_id = o.id
    ), '[]'::jsonb),
    o.total_amount,
    o.status,
    COALESCE(o.payment_status, 'pending'),
    'unknown',
    DATE(o.created_at),
    o.created_at,
    COALESCE(o.delivered_at, o.created_at)
FROM public.orders o
JOIN public.outlets o2 ON o2.id = o.outlet_id
LEFT JOIN public.users u ON u.id = o.user_id
WHERE o.status IN ('completed', 'cancelled')
ON CONFLICT (order_id) DO NOTHING;
