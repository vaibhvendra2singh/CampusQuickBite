-- ===========================================================
-- CampusBite — Campus Food Ordering System
-- Drops and recreates all data for a clean setup
-- ===========================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu_item_tags;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS outlets;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'SHOP_OWNER', 'ADMIN') NOT NULL,
    phone_number VARCHAR(20),
    enrollment_number VARCHAR(50),
    profile_pic VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE outlets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    owner_id BIGINT UNIQUE NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE menu_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    outlet_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    availability BOOLEAN DEFAULT TRUE,
    is_veg BOOLEAN DEFAULT TRUE,
    average_rating DECIMAL(3, 2) DEFAULT 0.00,
    rating_count INT DEFAULT 0,
    FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE CASCADE
);

CREATE TABLE menu_item_tags (
    menu_item_id BIGINT NOT NULL,
    tag VARCHAR(50) NOT NULL,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    outlet_id BIGINT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('PLACED', 'PREPARING', 'PACKED', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED') DEFAULT 'PLACED',
    payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    scheduled_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE CASCADE
);

CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    menu_item_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

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

CREATE TABLE ratings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    menu_item_id BIGINT NOT NULL,
    value INT NOT NULL,
    comment VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- ===========================================================
-- USERS
-- ===========================================================
INSERT INTO users (name, email, password, role, phone_number, enrollment_number, profile_pic) VALUES
('Admin User', 'admin@campusbite.app', '$2a$10$iwJP6e5E/Pd.jJe6ykTRYONzuJOeCQ16qrJCe7SK5jkOJt4w5.W9e', 'ADMIN', '+91 9876543210', 'ADMIN-001', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'),
('Vaibhav Singh', 'student@bennett.edu.in', '$2a$10$iwJP6e5E/Pd.jJe6ykTRYONzuJOeCQ16qrJCe7SK5jkOJt4w5.W9e', 'STUDENT', '+91 8888877777', 'E24CSEU0001', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vaibhav'),
('vedant', 'S24CSEU0175@BENNETT.EDU.IN', '$2a$10$iwJP6e5E/Pd.jJe6ykTRYONzuJOeCQ16qrJCe7SK5jkOJt4w5.W9e', 'STUDENT', '+91 9999988888', 'S24CSEU0175', 'https://api.dicebear.com/7.x/avataaars/svg?seed=User175'),
('Priya Sharma', 'student2@bennett.edu.in', '$2a$10$iwJP6e5E/Pd.jJe6ykTRYONzuJOeCQ16qrJCe7SK5jkOJt4w5.W9e', 'STUDENT', '+91 7777766666', 'E24CSEU0002', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya');

-- 6 Shop Owners
INSERT INTO users (name, email, password, role) VALUES
('Subway Manager', 'subway@bennett.edu.in', '$2a$10$iwJP6e5E/Pd.jJe6ykTRYONzuJOeCQ16qrJCe7SK5jkOJt4w5.W9e', 'SHOP_OWNER'),
('Dominos Manager', 'dominos@bennett.edu.in', '$2a$10$iwJP6e5E/Pd.jJe6ykTRYONzuJOeCQ16qrJCe7SK5jkOJt4w5.W9e', 'SHOP_OWNER'),
('House of Chow Manager', 'houseofchow@bennett.edu.in', '$2a$10$iwJP6e5E/Pd.jJe6ykTRYONzuJOeCQ16qrJCe7SK5jkOJt4w5.W9e', 'SHOP_OWNER'),
('SnapEats Manager', 'snapeats@bennett.edu.in', '$2a$10$iwJP6e5E/Pd.jJe6ykTRYONzuJOeCQ16qrJCe7SK5jkOJt4w5.W9e', 'SHOP_OWNER'),
('Southern Stories Manager', 'southernstories@bennett.edu.in', '$2a$10$iwJP6e5E/Pd.jJe6ykTRYONzuJOeCQ16qrJCe7SK5jkOJt4w5.W9e', 'SHOP_OWNER'),
('Maggi Hotspot Manager', 'maggihotspot@bennett.edu.in', '$2a$10$iwJP6e5E/Pd.jJe6ykTRYONzuJOeCQ16qrJCe7SK5jkOJt4w5.W9e', 'SHOP_OWNER');

-- 6 OUTLETS
INSERT INTO outlets (name, location, owner_id) VALUES
('Subway Bennett University Noida', 'Food Court, Ground Floor', (SELECT id FROM users WHERE email = 'subway@bennett.edu.in')),
('Domino''s Pizza Bennett University', 'Food Court, Ground Floor', (SELECT id FROM users WHERE email = 'dominos@bennett.edu.in')),
('House of Chow - Haute Cuisine', 'Food Court, First Floor', (SELECT id FROM users WHERE email = 'houseofchow@bennett.edu.in')),
('SnapEats', 'Near Academic Block 2', (SELECT id FROM users WHERE email = 'snapeats@bennett.edu.in')),
('Southern Stories', 'Food Court, First Floor', (SELECT id FROM users WHERE email = 'southernstories@bennett.edu.in')),
('Maggi Hotspot', 'Near Boys Hostel', (SELECT id FROM users WHERE email = 'maggihotspot@bennett.edu.in'));

-- MENU ITEMS
-- ======= SUBWAY =======
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Veggie Delight Sub (6")', 179.00, true, true, 4.20, 15 FROM outlets o WHERE o.name = 'Subway Bennett University Noida';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Chicken Teriyaki Sub (6")', 299.00, true, false, 4.60, 22 FROM outlets o WHERE o.name = 'Subway Bennett University Noida';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Paneer Tikka Sub (6")', 219.00, true, true, 4.30, 18 FROM outlets o WHERE o.name = 'Subway Bennett University Noida';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Tuna Sub (6")', 279.00, true, false, 4.10, 8 FROM outlets o WHERE o.name = 'Subway Bennett University Noida';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Chocolate Chip Cookie', 69.00, true, true, 4.50, 30 FROM outlets o WHERE o.name = 'Subway Bennett University Noida';

-- ======= DOMINO'S =======
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Margherita Pizza', 199.00, true, true, 4.30, 20 FROM outlets o WHERE o.name = 'Domino''s Pizza Bennett University';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Peppy Paneer Pizza', 249.00, true, true, 4.50, 25 FROM outlets o WHERE o.name = 'Domino''s Pizza Bennett University';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Chicken Dominator', 349.00, true, false, 4.70, 18 FROM outlets o WHERE o.name = 'Domino''s Pizza Bennett University';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Garlic Breadsticks', 99.00, true, true, 4.00, 12 FROM outlets o WHERE o.name = 'Domino''s Pizza Bennett University';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Choco Lava Cake', 109.00, true, true, 4.80, 35 FROM outlets o WHERE o.name = 'Domino''s Pizza Bennett University';

-- ======= HOUSE OF CHOW =======
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Veg Hakka Noodles', 120.00, true, true, 4.10, 14 FROM outlets o WHERE o.name = 'House of Chow - Haute Cuisine';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Chicken Fried Rice', 150.00, true, false, 4.40, 19 FROM outlets o WHERE o.name = 'House of Chow - Haute Cuisine';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Paneer Manchurian Dry', 140.00, true, true, 4.30, 16 FROM outlets o WHERE o.name = 'House of Chow - Haute Cuisine';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Dragon Chicken', 170.00, true, false, 4.60, 21 FROM outlets o WHERE o.name = 'House of Chow - Haute Cuisine';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Hot & Sour Soup', 80.00, true, true, 3.90, 7 FROM outlets o WHERE o.name = 'House of Chow - Haute Cuisine';

-- ======= SNAPEATS =======
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Chole Bhature', 80.00, true, true, 4.50, 28 FROM outlets o WHERE o.name = 'SnapEats';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Aloo Paratha with Curd', 60.00, true, true, 4.20, 20 FROM outlets o WHERE o.name = 'SnapEats';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Egg Roll', 70.00, true, false, 4.30, 15 FROM outlets o WHERE o.name = 'SnapEats';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Samosa (2 Pcs)', 30.00, true, true, 4.00, 40 FROM outlets o WHERE o.name = 'SnapEats';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Masala Chai', 20.00, true, true, 4.60, 50 FROM outlets o WHERE o.name = 'SnapEats';

-- ======= SOUTHERN STORIES =======
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Masala Dosa', 90.00, true, true, 4.40, 22 FROM outlets o WHERE o.name = 'Southern Stories';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Idli Sambar (4 Pcs)', 70.00, true, true, 4.20, 18 FROM outlets o WHERE o.name = 'Southern Stories';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Medu Vada (2 Pcs)', 60.00, true, true, 4.10, 12 FROM outlets o WHERE o.name = 'Southern Stories';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Chicken Chettinad', 160.00, true, false, 4.50, 10 FROM outlets o WHERE o.name = 'Southern Stories';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Filter Coffee', 40.00, true, true, 4.70, 35 FROM outlets o WHERE o.name = 'Southern Stories';

-- ======= MAGGI HOTSPOT =======
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Classic Maggi', 40.00, true, true, 4.30, 45 FROM outlets o WHERE o.name = 'Maggi Hotspot';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Cheese Maggi', 60.00, true, true, 4.50, 38 FROM outlets o WHERE o.name = 'Maggi Hotspot';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Egg Maggi', 50.00, true, false, 4.40, 30 FROM outlets o WHERE o.name = 'Maggi Hotspot';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Peri Peri Maggi', 70.00, true, true, 4.20, 25 FROM outlets o WHERE o.name = 'Maggi Hotspot';
INSERT INTO menu_items (outlet_id, name, price, availability, is_veg, average_rating, rating_count) SELECT o.id, 'Loaded Maggi (Veggies + Cheese)', 80.00, true, true, 4.60, 20 FROM outlets o WHERE o.name = 'Maggi Hotspot';

-- TAGS
INSERT INTO menu_item_tags (menu_item_id, tag) SELECT m.id, 'Healthy' FROM menu_items m JOIN outlets o ON m.outlet_id = o.id WHERE m.name = 'Veggie Delight Sub (6")';
INSERT INTO menu_item_tags (menu_item_id, tag) SELECT m.id, 'Best Seller' FROM menu_items m JOIN outlets o ON m.outlet_id = o.id WHERE m.name = 'Chicken Teriyaki Sub (6")';
INSERT INTO menu_item_tags (menu_item_id, tag) SELECT m.id, 'Spicy' FROM menu_items m JOIN outlets o ON m.outlet_id = o.id WHERE m.name = 'Paneer Tikka Sub (6")';
INSERT INTO menu_item_tags (menu_item_id, tag) SELECT m.id, 'Daily Special' FROM menu_items m JOIN outlets o ON m.outlet_id = o.id WHERE m.name = 'Chocolate Chip Cookie';

INSERT INTO menu_item_tags (menu_item_id, tag) SELECT m.id, 'Best Seller' FROM menu_items m JOIN outlets o ON m.outlet_id = o.id WHERE m.name = 'Peppy Paneer Pizza';
INSERT INTO menu_item_tags (menu_item_id, tag) SELECT m.id, 'Spicy' FROM menu_items m JOIN outlets o ON m.outlet_id = o.id WHERE m.name = 'Chicken Dominator';
INSERT INTO menu_item_tags (menu_item_id, tag) SELECT m.id, 'Best Seller' FROM menu_items m JOIN outlets o ON m.outlet_id = o.id WHERE m.name = 'Choco Lava Cake';

INSERT INTO menu_item_tags (menu_item_id, tag) SELECT m.id, 'Spicy' FROM menu_items m JOIN outlets o ON m.outlet_id = o.id WHERE m.name = 'Dragon Chicken';
INSERT INTO menu_item_tags (menu_item_id, tag) SELECT m.id, 'Best Seller' FROM menu_items m JOIN outlets o ON m.outlet_id = o.id WHERE m.name = 'Veg Hakka Noodles';

INSERT INTO menu_item_tags (menu_item_id, tag) SELECT m.id, 'Best Seller' FROM menu_items m JOIN outlets o ON m.outlet_id = o.id WHERE m.name = 'Chole Bhature';
INSERT INTO menu_item_tags (menu_item_id, tag) SELECT m.id, 'Best Seller' FROM menu_items m JOIN outlets o ON m.outlet_id = o.id WHERE m.name = 'Masala Chai';

INSERT INTO menu_item_tags (menu_item_id, tag) SELECT m.id, 'Best Seller' FROM menu_items m JOIN outlets o ON m.outlet_id = o.id WHERE m.name = 'Masala Dosa';
INSERT INTO menu_item_tags (menu_item_id, tag) SELECT m.id, 'Healthy' FROM menu_items m JOIN outlets o ON m.outlet_id = o.id WHERE m.name = 'Idli Sambar (4 Pcs)';

INSERT INTO menu_item_tags (menu_item_id, tag) SELECT m.id, 'Best Seller' FROM menu_items m JOIN outlets o ON m.outlet_id = o.id WHERE m.name = 'Classic Maggi';
INSERT INTO menu_item_tags (menu_item_id, tag) SELECT m.id, 'Spicy' FROM menu_items m JOIN outlets o ON m.outlet_id = o.id WHERE m.name = 'Peri Peri Maggi';
