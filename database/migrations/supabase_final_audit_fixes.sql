-- Migration to add missing columns used by the Node.js backend

-- 1. Add missing profile columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS enrollment_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_pic TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'BRONZE';

-- 2. Add cancelled_at to orders table for audit trail
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- 3. Add item_name to order_items for historical snapshot (in case menu item name changes)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_name TEXT;

-- 4. Ensure wallet_balance is numeric (if it was text or missing)
-- Note: Using numeric for money is best practice in Postgres
ALTER TABLE users ALTER COLUMN wallet_balance TYPE NUMERIC(10,2) USING (wallet_balance::numeric);
