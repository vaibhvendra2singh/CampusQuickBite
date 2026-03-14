-- Migration for Owner Order History Feature
-- 1. Add delivery_timestamp to orders
ALTER TABLE orders ADD COLUMN delivery_timestamp TIMESTAMP NULL;

-- 2. Align status ENUM with Java OrderStatus enum
UPDATE orders SET status = 'PENDING' WHERE status = 'PLACED';
UPDATE orders SET status = 'READY' WHERE status = 'READY_FOR_PICKUP';
UPDATE orders SET status = 'DELIVERED' WHERE status = 'COMPLETED';

ALTER TABLE orders MODIFY COLUMN status ENUM('PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING';

-- 3. Add item_name snapshot to order_items
ALTER TABLE order_items ADD COLUMN item_name VARCHAR(255) NULL;

-- Backfill item_name from menu_items for existing records
UPDATE order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
SET oi.item_name = mi.name;

-- 4. Add indexes for performance
CREATE INDEX idx_orders_outlet_id ON orders(outlet_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
