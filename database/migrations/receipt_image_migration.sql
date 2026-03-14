-- SQL ALTER STATEMENTS FOR IMAGE RECEIPT INTEGRATION
-- Run these on your relational database (MySQL/PostgreSQL)

-- 1. Add receipt_image column to orders table
-- Using BYTEA for PostgreSQL/Supabase compatibility
ALTER TABLE orders ADD COLUMN receipt_image BYTEA;

-- 2. Cleanup: If there were any reorder-related columns (none found in current schema, but for completeness):
-- ALTER TABLE orders DROP COLUMN IF EXISTS is_reorder;
-- ALTER TABLE order_items DROP COLUMN IF EXISTS parent_item_id;
