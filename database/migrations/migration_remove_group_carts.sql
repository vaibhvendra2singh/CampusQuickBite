-- Migration to remove 'Order together' / 'Group Cart' feature completely

-- Drop the group cart items table
DROP TABLE IF EXISTS group_cart_items;

-- Drop the group carts table
DROP TABLE IF EXISTS group_carts;
