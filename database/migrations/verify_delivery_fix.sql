-- Add delivery_timestamp column to orders table
ALTER TABLE orders ADD COLUMN delivery_timestamp DATETIME DEFAULT NULL;

-- Migrate existing order statuses to new simplified flow
UPDATE orders SET status = 'PENDING' WHERE status = 'PLACED';
UPDATE orders SET status = 'READY' WHERE status = 'PACKED' OR status = 'READY_FOR_PICKUP';
UPDATE orders SET status = 'DELIVERED' WHERE status = 'COMPLETED';
