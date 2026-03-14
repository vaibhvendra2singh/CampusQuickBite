-- Migration: Order ID from UUID to Auto-Incrementing BIGINT
-- This script safely migrates the ID system while preserving relationships.
-- Targeting MySQL as primary relational DB specified in Spring Boot config.

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Modify 'orders' table
ALTER TABLE orders RENAME TO orders_old;

CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    outlet_id BIGINT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('PLACED', 'PREPARING', 'PACKED', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED') DEFAULT 'PLACED',
    payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    scheduled_time TIMESTAMP NULL,
    delivery_timestamp TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_uuid VARCHAR(255), -- Keep for mapping during migration
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE CASCADE
);

-- 2. Migrate existing data (Optional mapping)
INSERT INTO orders (user_id, outlet_id, total_amount, status, payment_status, scheduled_time, created_at, old_uuid)
SELECT user_id, outlet_id, total_amount, status, payment_status, scheduled_time, created_at, id FROM orders_old;

-- 3. Update 'order_items' Foreign Key
ALTER TABLE order_items RENAME TO order_items_old;

CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    menu_item_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    item_name VARCHAR(100),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- Map order_items to new numeric order_id
INSERT INTO order_items (order_id, menu_item_id, quantity, price, item_name)
SELECT o.id, oi.menu_item_id, oi.quantity, oi.price, oi.item_name
FROM order_items_old oi
JOIN orders o ON CAST(oi.order_id AS CHAR) = o.old_uuid;

-- 4. Update 'payments' Foreign Key
ALTER TABLE payments RENAME TO payments_old;

CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNIQUE NOT NULL,
    transaction_id VARCHAR(100) UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'ONLINE',
    status ENUM('SUCCESS', 'FAILED', 'PENDING') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Map payments to new numeric order_id
INSERT INTO payments (order_id, transaction_id, amount, payment_method, status, created_at)
SELECT o.id, p.transaction_id, p.amount, p.payment_method, p.status, p.created_at
FROM payments_old p
JOIN orders o ON CAST(p.order_id AS CHAR) = o.old_uuid;

-- 5. Cleanup
DROP TABLE order_items_old;
DROP TABLE payments_old;
DROP TABLE orders_old;
ALTER TABLE orders DROP COLUMN old_uuid;

SET FOREIGN_KEY_CHECKS = 1;
