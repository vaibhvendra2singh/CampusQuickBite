const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Support running from root or from scripts/ directory
const envPaths = [
    path.join(__dirname, '..', '.env'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'backend', '.env')
];

let envFound = false;
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        envFound = true;
        break;
    }
}

if (!process.env.SUPABASE_URL) {
    console.error('❌ SUPABASE_URL not found. Please ensure .env exists in backend/ directory.');
    process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const houseOfChowMenu = [
    { name: 'Biscoff Shake', price: 149, is_veg: true, description: 'Category: Shakes' },
    { name: 'Oreo Shake', price: 149, is_veg: true, description: 'Category: Shakes' },
    { name: 'Cold coffee', price: 149, is_veg: true, description: 'Category: Shakes' },
    { name: 'Vanilla Shake', price: 149, is_veg: true, description: 'Category: Shakes' },
    { name: 'Salted Caramel Shake', price: 149, is_veg: true, description: 'Category: Shakes' },
    { name: 'Lemon Iced Tea', price: 89, is_veg: true, description: 'Category: Iced Tea' },
    { name: 'Peach Iced Tea', price: 89, is_veg: true, description: 'Category: Iced Tea' },
    { name: 'Berry Iced Tea', price: 89, is_veg: true, description: 'Category: Iced Tea' },
    { name: 'Fresh Lime', price: 99, is_veg: true, description: 'Category: Sparkling' },
    { name: 'Fruit Beer', price: 99, is_veg: true, description: 'Category: Sparkling' },
    { name: 'Masala Lemonade', price: 99, is_veg: true, description: 'Category: Sparkling' },
    { name: 'Chow Box (Veg)', price: 199, is_veg: true, description: 'Category: Pick A Meal' },
    { name: 'Chow Box (Paneer)', price: 229, is_veg: true, description: 'Category: Pick A Meal' },
    { name: 'Chow Box (Chicken)', price: 249, is_veg: false, description: 'Category: Pick A Meal' },
    { name: 'Bento Box (Veg)', price: 299, is_veg: true, description: 'Category: Pick A Meal' },
    { name: 'Bento Box (Paneer)', price: 329, is_veg: true, description: 'Category: Pick A Meal' },
    { name: 'Bento Box (Chicken)', price: 349, is_veg: false, description: 'Category: Pick A Meal' },
    { name: 'Veg Hot n Sour Soup', price: 149, is_veg: true, description: 'Category: Veg Soups' },
    { name: 'Veg Manchow Soup', price: 149, is_veg: true, description: 'Category: Veg Soups' },
    { name: 'Veg Sweet Corn Soup', price: 149, is_veg: true, description: 'Category: Veg Soups' },
    { name: 'Veg Thukpa Soup', price: 159, is_veg: true, description: 'Category: Veg Soups' },
    { name: 'Chicken Hot n Sour Soup', price: 169, is_veg: false, description: 'Category: Non Veg Soups' },
    { name: 'Chicken Manchow Soup', price: 169, is_veg: false, description: 'Category: Non Veg Soups' },
    { name: 'Chicken Sweet Corn Soup', price: 169, is_veg: false, description: 'Category: Non Veg Soups' },
    { name: 'Chicken Thukpa Soup', price: 179, is_veg: false, description: 'Category: Non Veg Soups' },
    { name: 'Veg Steamed Momos', price: 199, is_veg: true, description: 'Category: Momos (6 PCS)' },
    { name: 'Chicken Steamed Momos', price: 219, is_veg: false, description: 'Category: Momos (6 PCS)' },
    { name: 'Veg Kurkure Momos', price: 219, is_veg: true, description: 'Category: Momos (6 PCS)' },
    { name: 'Chicken Kurkure Momos', price: 239, is_veg: false, description: 'Category: Momos (6 PCS)' },
    { name: 'Crispy Chilli Potatoes', price: 169, is_veg: true, description: 'Category: Veg Appetizers' },
    { name: 'Veg Spring Rolls (5 Pcs)', price: 209, is_veg: true, description: 'Category: Veg Appetizers' },
    { name: 'Chilli Paneer', price: 249, is_veg: true, description: 'Category: Veg Appetizers' },
    { name: 'Chicken Drumsticks', price: 249, is_veg: false, description: 'Category: Non Veg Appetizers' },
    { name: 'Chicken Spring Rolls (5 Pcs)', price: 249, is_veg: false, description: 'Category: Non Veg Appetizers' },
    { name: 'Chilli Chicken Dry', price: 249, is_veg: false, description: 'Category: Non Veg Appetizers' }
];

const maggiMenu = [
    { name: 'Original Maggi', price: 50, is_veg: true, description: 'Category: Maggi' },
    { name: 'Vegetable Soupy Maggi', price: 60, is_veg: true, description: 'Category: Maggi' },
    { name: 'Chilli Maggi', price: 60, is_veg: true, description: 'Category: Maggi' },
    { name: 'Tomato Chatpata Maggi', price: 60, is_veg: true, description: 'Category: Maggi' },
    { name: 'Double Masala Maggi', price: 60, is_veg: true, description: 'Category: Maggi' },
    { name: 'Biryani Maggi', price: 70, is_veg: true, description: 'Category: Maggi' },
    { name: 'Chilli Garlic Maggi', price: 70, is_veg: true, description: 'Category: Maggi' },
    { name: 'Oregano Maggi', price: 70, is_veg: true, description: 'Category: Maggi' },
    { name: 'Cheese Maggi', price: 70, is_veg: true, description: 'Category: Maggi' },
    { name: 'Butter Maggi', price: 70, is_veg: true, description: 'Category: Maggi' },
    { name: 'Peri peri Maggi', price: 70, is_veg: true, description: 'Category: Maggi' },
    { name: 'Corn Maggi', price: 80, is_veg: true, description: 'Category: Maggi' },
    { name: 'Paneer Maggi', price: 90, is_veg: true, description: 'Category: Maggi' },
    { name: 'Egg Maggi', price: 70, is_veg: false, description: 'Category: Non-Veg Maggi' },
    { name: 'Double Egg Maggi', price: 80, is_veg: false, description: 'Category: Non-Veg Maggi' },
    { name: 'Omlete Maggi', price: 90, is_veg: false, description: 'Category: Non-Veg Maggi' },
    { name: 'Chicken Maggi', price: 90, is_veg: false, description: 'Category: Non-Veg Maggi' },
    { name: 'Oats Maggi', price: 70, is_veg: true, description: 'Category: Nutrilicious Maggi' },
    { name: 'Atta Maggi', price: 70, is_veg: true, description: 'Category: Nutrilicious Maggi' },
    { name: 'Extra Masala', price: 10, is_veg: true, description: 'Category: Add-ons' },
    { name: 'Extra Egg', price: 10, is_veg: false, description: 'Category: Add-ons' },
    { name: 'Extra Cheese', price: 20, is_veg: true, description: 'Category: Add-ons' },
    { name: 'Extra Chicken', price: 30, is_veg: false, description: 'Category: Add-ons' }
];

const southernStoriesMenu = [
    { name: 'Plain Dosa', price: 85, is_veg: true, description: 'Category: Dosas' },
    { name: 'Masala Dosa', price: 95, is_veg: true, description: 'Category: Dosas' },
    { name: 'Mysore Masala Dosa', price: 130, is_veg: true, description: 'Category: Dosas' },
    { name: 'Rawa Dosa', price: 105, is_veg: true, description: 'Category: Dosas' },
    { name: 'Rawa Onion Dosa', price: 120, is_veg: true, description: 'Category: Dosas' },
    { name: 'Rawa Masala Dosa', price: 130, is_veg: true, description: 'Category: Dosas' },
    { name: 'Rawa Paneer Dosa', price: 175, is_veg: true, description: 'Category: Dosas' },
    { name: 'Podi Butter Masala Dosa', price: 120, is_veg: true, description: 'Category: Dosas' },
    { name: 'Paper Masala Dosa', price: 180, is_veg: true, description: 'Category: Dosas' },
    { name: 'Gee Roast Masala Dosa', price: 145, is_veg: true, description: 'Category: Dosas' },
    { name: 'Cheese Dosa', price: 145, is_veg: true, description: 'Category: Dosas' },
    { name: 'Paneer Dosa', price: 150, is_veg: true, description: 'Category: Dosas' },
    { name: 'Onion Uttapam', price: 95, is_veg: true, description: 'Category: Uttapam' },
    { name: 'Tomato Onion Uttapam', price: 110, is_veg: true, description: 'Category: Uttapam' },
    { name: 'Veg Uttapam', price: 120, is_veg: true, description: 'Category: Uttapam' },
    { name: 'Paneer Uttapam', price: 150, is_veg: true, description: 'Category: Uttapam' },
    { name: 'Mixed Uttapam', price: 155, is_veg: true, description: 'Category: Uttapam' },
    { name: 'Aloo Payaaz Paratha (1pc)', price: 75, is_veg: true, description: 'Category: Flat Breads' },
    { name: 'Aloo Payaaz Paratha (2pcs)', price: 135, is_veg: true, description: 'Category: Flat Breads' },
    { name: 'Mixed Veg Paratha (1pc)', price: 80, is_veg: true, description: 'Category: Flat Breads' },
    { name: 'Mixed Veg Paratha (2pcs)', price: 145, is_veg: true, description: 'Category: Flat Breads' },
    { name: 'Gobhi Paratha (1pc)', price: 80, is_veg: true, description: 'Category: Flat Breads' },
    { name: 'Gobhi Paratha (2pcs)', price: 145, is_veg: true, description: 'Category: Flat Breads' },
    { name: 'Paneer Paratha (1pc)', price: 95, is_veg: true, description: 'Category: Flat Breads' },
    { name: 'Paneer Paratha (2pcs)', price: 175, is_veg: true, description: 'Category: Flat Breads' },
    { name: 'Paratha with Paneer Korma', price: 160, is_veg: true, description: 'Category: Flat Breads' },
    { name: 'Idli Sambhar', price: 85, is_veg: true, description: 'Category: Sides' },
    { name: 'Vada Sambhar', price: 90, is_veg: true, description: 'Category: Sides' },
    { name: 'Upma', price: 85, is_veg: true, description: 'Category: Sides' },
    { name: 'Poha', price: 85, is_veg: true, description: 'Category: Sides' },
    { name: 'Pav Bhaji', price: 100, is_veg: true, description: 'Category: Sides' },
    { name: 'Channa Kulcha', price: 120, is_veg: true, description: 'Category: Sides' },
    { name: 'Poori Bhaji', price: 120, is_veg: true, description: 'Category: Sides' },
    { name: 'Choole Bhature', price: 150, is_veg: true, description: 'Category: Sides' },
    { name: 'Rajma Rice Bowl', price: 145, is_veg: true, description: 'Category: Sides' },
    { name: 'Choole Rice Bowl', price: 145, is_veg: true, description: 'Category: Sides' },
    { name: 'Hyderabadi Veg Rice', price: 180, is_veg: true, description: 'Category: Sides' },
    { name: 'Filter Coffee', price: 40, is_veg: true, description: 'Category: Beverages' },
    { name: 'Lassi', price: 65, is_veg: true, description: 'Category: Beverages' },
    { name: 'Mango Shake', price: 85, is_veg: true, description: 'Category: Beverages' },
    { name: 'Classic Cold Coffee', price: 85, is_veg: true, description: 'Category: Beverages' },
    { name: 'Hazelnut Cold Coffee', price: 90, is_veg: true, description: 'Category: Beverages' },
    { name: 'Irish Cold Coffee', price: 90, is_veg: true, description: 'Category: Beverages' },
    { name: 'Caramel Cold Coffee', price: 90, is_veg: true, description: 'Category: Beverages' },
    { name: 'KitKat Coffee Shake', price: 90, is_veg: true, description: 'Category: Beverages' },
    { name: 'Oreo Coffee Shake', price: 90, is_veg: true, description: 'Category: Beverages' }
];

const snapEatsMenu = [
    { name: 'Cappuccino', price: 49, is_veg: true, description: 'Category: Hot Beverages' },
    { name: 'Hot Coffee', price: 49, is_veg: true, description: 'Category: Hot Beverages' },
    { name: 'Hot Chocolate', price: 59, is_veg: true, description: 'Category: Hot Beverages' },
    { name: 'Adrak Chai (Kulhar)', price: 20, is_veg: true, description: 'Category: Chai Nagri' },
    { name: 'Masala Chai (Kulhar)', price: 20, is_veg: true, description: 'Category: Chai Nagri' },
    { name: 'Veg Sandwich', price: 69, is_veg: true, description: 'Category: Sandwiches' },
    { name: 'Cheese Sandwich', price: 99, is_veg: true, description: 'Category: Sandwiches' },
    { name: 'Paneer Tikka Sandwich', price: 99, is_veg: true, description: 'Category: Sandwiches' },
    { name: 'Chicken Tikka Sandwich', price: 129, is_veg: false, description: 'Category: Sandwiches' },
    { name: 'Seekh Kebab Sandwich', price: 129, is_veg: false, description: 'Category: Sandwiches' },
    { name: 'Veg Burger', price: 59, is_veg: true, description: 'Category: Burgers' },
    { name: 'Cheese Burger', price: 69, is_veg: true, description: 'Category: Burgers' },
    { name: 'Peppy Paneer Burger', price: 109, is_veg: true, description: 'Category: Burgers' },
    { name: 'Egg & Mayo Burger', price: 99, is_veg: false, description: 'Category: Burgers' },
    { name: 'Chicken Burger', price: 129, is_veg: false, description: 'Category: Burgers' },
    { name: 'Malai Paneer Tikka (8 Pcs)', price: 249, is_veg: true, description: 'Category: Dil Se Tandoori' },
    { name: 'Malai Soya Chap (8 Pcs)', price: 199, is_veg: true, description: 'Category: Dil Se Tandoori' },
    { name: 'Tandoori Mushroom (8 Pcs)', price: 199, is_veg: true, description: 'Category: Dil Se Tandoori' },
    { name: 'Chicken Tikka (8 Pcs)', price: 299, is_veg: false, description: 'Category: Dil Se Tandoori' },
    { name: 'Seekh Kebab-Chicken (8 Pcs)', price: 299, is_veg: false, description: 'Category: Dil Se Tandoori' },
    { name: 'Seekh Kebab-Mutton (8 Pcs)', price: 349, is_veg: false, description: 'Category: Dil Se Tandoori' },
    { name: 'Tandoori Chicken Half (4 Pcs)', price: 199, is_veg: false, description: 'Category: Dil Se Tandoori' },
    { name: 'Tandoori Chicken Full (8 Pcs)', price: 349, is_veg: false, description: 'Category: Dil Se Tandoori' },
    { name: 'Lachha Parantha (1 Pc.)', price: 59, is_veg: true, description: 'Category: Dil Se Tandoori' },
    { name: 'Garlic Naan', price: 59, is_veg: true, description: 'Category: Dil Se Tandoori' },
    { name: 'Butter Naan', price: 59, is_veg: true, description: 'Category: Dil Se Tandoori' },
    { name: 'Chicken Keema Naan', price: 139, is_veg: false, description: 'Category: Dil Se Tandoori' },
    { name: 'Mutton Keema Naan', price: 199, is_veg: false, description: 'Category: Dil Se Tandoori' },
    { name: 'Chicken Tangdi (4 Pcs.)', price: 249, is_veg: false, description: 'Category: Dil Se Tandoori' },
    { name: 'Classic Salted Fries', price: 80, is_veg: true, description: 'Category: Crispy Snacks' },
    { name: 'Peri Peri Fries', price: 99, is_veg: true, description: 'Category: Crispy Snacks' },
    { name: 'Potato Wedges', price: 99, is_veg: true, description: 'Category: Crispy Snacks' },
    { name: 'Sweet Corn', price: 99, is_veg: true, description: 'Category: Crispy Snacks' },
    { name: 'Crispy Corn', price: 129, is_veg: true, description: 'Category: Crispy Snacks' },
    { name: 'Crispy Chicken', price: 159, is_veg: false, description: 'Category: Crispy Snacks' },
    { name: 'Macroni - Veg', price: 99, is_veg: true, description: 'Category: Crispy Snacks' },
    { name: 'Macroni - Chicken', price: 199, is_veg: false, description: 'Category: Crispy Snacks' },
    { name: 'Pasta - Veg', price: 99, is_veg: true, description: 'Category: Crispy Snacks' },
    { name: 'Pasta - Chicken', price: 199, is_veg: false, description: 'Category: Crispy Snacks' },
    { name: 'Honey Chilly Potato', price: 129, is_veg: true, description: 'Category: Crispy Snacks' },
    { name: 'Veg Manchurian Dry', price: 129, is_veg: true, description: 'Category: Crispy Snacks' },
    { name: 'Chicken Manchurian Dry', price: 249, is_veg: false, description: 'Category: Crispy Snacks' },
    { name: 'Chilly Paneer Dry', price: 159, is_veg: true, description: 'Category: Crispy Snacks' },
    { name: 'Chilly Chicken Dry', price: 249, is_veg: false, description: 'Category: Crispy Snacks' },
    { name: 'Mushroom Chilly Dry', price: 249, is_veg: true, description: 'Category: Crispy Snacks' },
    { name: 'Tomato Soup', price: 79, is_veg: true, description: 'Category: Soups' },
    { name: 'Vegetable Soup', price: 79, is_veg: true, description: 'Category: Soups' },
    { name: 'Manchow Soup', price: 99, is_veg: true, description: 'Category: Soups' },
    { name: 'Chicken Soup', price: 119, is_veg: false, description: 'Category: Soups' },
    { name: 'Veg Momos (Steamed)', price: 99, is_veg: true, description: 'Category: Dimsums & Cigar Spring Rolls' },
    { name: 'Veg Momos (Fried)', price: 119, is_veg: true, description: 'Category: Dimsums & Cigar Spring Rolls' },
    { name: 'Paneer Momos (Steamed)', price: 119, is_veg: true, description: 'Category: Dimsums & Cigar Spring Rolls' },
    { name: 'Paneer Momos (Fried)', price: 129, is_veg: true, description: 'Category: Dimsums & Cigar Spring Rolls' },
    { name: 'Chicken Momos (Steamed)', price: 129, is_veg: false, description: 'Category: Dimsums & Cigar Spring Rolls' },
    { name: 'Chicken Momos (Fried)', price: 139, is_veg: false, description: 'Category: Dimsums & Cigar Spring Rolls' },
    { name: 'Veg Cigar Rolls', price: 119, is_veg: true, description: 'Category: Dimsums & Cigar Spring Rolls' },
    { name: 'Chicken Cigar Rolls', price: 139, is_veg: false, description: 'Category: Dimsums & Cigar Spring Rolls' },
    { name: 'Pao Bhaji', price: 70, is_veg: true, description: 'Category: Street Flavours' },
    { name: 'Chole Bhature', price: 89, is_veg: true, description: 'Category: Street Flavours' },
    { name: 'Paneer Bread Pakora', price: 49, is_veg: true, description: 'Category: Street Flavours' },
    { name: 'Classic Bread Omelette', price: 79, is_veg: false, description: 'Category: Street Flavours' },
    { name: 'Cheese Bread Omelette', price: 99, is_veg: false, description: 'Category: Street Flavours' },
    { name: 'Chicken Bread Omelette', price: 129, is_veg: false, description: 'Category: Street Flavours' },
    { name: 'Vada Pao', price: 49, is_veg: true, description: 'Category: Street Flavours' },
    { name: 'Boiled Chicken', price: 199, is_veg: false, description: 'Category: Street Flavours' },
    { name: 'Chicken Salad', price: 249, is_veg: false, description: 'Category: Street Flavours' },
    { name: 'Cold Coffee', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Iced Americano', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Iced Cappuccino', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Coffee Frappe', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Mocha Frappe', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Hazel Frappe', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Oreo Frappe', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Fresh Lime Soda', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Green Apple Soda', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Green Iced Tea', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Masala Lemonade', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Mint Mojito', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Blue Lagoon', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Imli Banta', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Kala Khatta', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Guava Chilli', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Pineapple Shake', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Strawberry Shake', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Choco Shake', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Rich Mango Shake', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'O-O- Oreo Shake', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Butter Scotch Shake', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Kitkat Shake', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Chocolate Almond Shake', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Brownie Blast Shake', price: 85, is_veg: true, description: 'Category: Cold Beverages' },
    { name: 'Veg Kathi Roll', price: 99, is_veg: true, description: 'Category: Veg Kathi Rolls' },
    { name: 'Paneer Kathi Roll', price: 119, is_veg: true, description: 'Category: Veg Kathi Rolls' },
    { name: 'Paneer Makhani Roll', price: 139, is_veg: true, description: 'Category: Veg Kathi Rolls' },
    { name: 'Paneer Schezwan Roll', price: 129, is_veg: true, description: 'Category: Veg Kathi Rolls' },
    { name: 'Paneer Shawarma Roll', price: 99, is_veg: true, description: 'Category: Veg Kathi Rolls' },
    { name: 'Noodle Roll', price: 89, is_veg: true, description: 'Category: Veg Kathi Rolls' },
    { name: 'Soya Chap Roll', price: 89, is_veg: true, description: 'Category: Veg Kathi Rolls' },
    { name: 'Creamy Soya Roll', price: 99, is_veg: true, description: 'Category: Veg Kathi Rolls' },
    { name: 'White Pasta', price: 99, is_veg: true, description: 'Category: Continental' },
    { name: 'Red Pasta', price: 99, is_veg: true, description: 'Category: Continental' },
    { name: 'Mix Pasta', price: 99, is_veg: true, description: 'Category: Continental' },
    { name: 'Cheese Pasta', price: 139, is_veg: true, description: 'Category: Continental' },
    { name: 'Chicken Pasta', price: 149, is_veg: false, description: 'Category: Continental' },
    { name: 'Egg Roll', price: 89, is_veg: false, description: 'Category: Non Veg Kathi Rolls' },
    { name: 'Chicken Tikka Roll', price: 149, is_veg: false, description: 'Category: Non Veg Kathi Rolls' },
    { name: 'Chicken Achari Roll', price: 129, is_veg: false, description: 'Category: Non Veg Kathi Rolls' },
    { name: 'Chicken Egg Roll', price: 169, is_veg: false, description: 'Category: Non Veg Kathi Rolls' },
    { name: 'Chicken Shawarma Roll', price: 159, is_veg: false, description: 'Category: Non Veg Kathi Rolls' },
    { name: 'Chicken Kebab Roll', price: 129, is_veg: false, description: 'Category: Non Veg Kathi Rolls' },
    { name: 'Mutton Kebab Roll', price: 189, is_veg: false, description: 'Category: Non Veg Kathi Rolls' },
    { name: 'Noodle Egg Roll', price: 109, is_veg: false, description: 'Category: Non Veg Kathi Rolls' },
    { name: 'Aloo Pyaz Parantha with Curd & Pickle', price: 90, is_veg: true, description: 'Category: Classic Indian Combos' },
    { name: 'Paneer Parantha with Curd & Pickle', price: 99, is_veg: true, description: 'Category: Classic Indian Combos' },
    { name: 'Egg Parantha with Curd & Pickle', price: 119, is_veg: false, description: 'Category: Classic Indian Combos' },
    { name: 'Chicken Keema Parantha with Curd & Pickle', price: 139, is_veg: false, description: 'Category: Classic Indian Combos' },
    { name: 'Veg Combo', price: 89, is_veg: true, description: 'Category: Classic Indian Combos' },
    { name: 'Rice & Egg Curry Combo', price: 149, is_veg: false, description: 'Category: Classic Indian Combos' },
    { name: 'Rice & Paneer Combo', price: 149, is_veg: true, description: 'Category: Classic Indian Combos' },
    { name: 'Chicken Curry (2 Pcs.) with Rice/Parantha', price: 199, is_veg: false, description: 'Category: Classic Indian Combos' },
    { name: 'Mutton Curry (2 Pcs.) with Rice/Parantha', price: 259, is_veg: false, description: 'Category: Classic Indian Combos' },
    { name: 'Chicken Biryani with Sallan (Serves 2)', price: 299, is_veg: false, description: 'Category: Classic Indian Combos' },
    { name: 'Premium Thali - Veg', price: 199, is_veg: true, description: 'Category: Classic Indian Combos' },
    { name: 'Premium Thali - Non Veg', price: 299, is_veg: false, description: 'Category: Classic Indian Combos' },
    { name: 'Hakka Noodles + Chilly Paneer Gravy', price: 249, is_veg: true, description: 'Category: Classic Indian Combos' },
    { name: 'Hakka Noodles + Veg Manchurian Gravy', price: 249, is_veg: true, description: 'Category: Classic Indian Combos' },
    { name: 'Hakka Noodles + Chilly Chicken Gravy', price: 299, is_veg: false, description: 'Category: Classic Indian Combos' },
    { name: 'Hakka Noodles + Chicken Manchurian Gravy', price: 299, is_veg: false, description: 'Category: Classic Indian Combos' },
    { name: 'Fried Rice + Chilly Paneer Gravy', price: 249, is_veg: true, description: 'Category: Classic Indian Combos' },
    { name: 'Fried Rice + Veg Manchurian Gravy', price: 249, is_veg: true, description: 'Category: Classic Indian Combos' },
    { name: 'Fried Rice + Chilly Chicken Gravy', price: 299, is_veg: false, description: 'Category: Classic Indian Combos' },
    { name: 'Fried Rice + Chicken Manchurian Gravy', price: 299, is_veg: false, description: 'Category: Classic Indian Combos' },
    { name: 'Fried Rice - Veg', price: 149, is_veg: true, description: 'Category: Classic Indian Combos' },
    { name: 'Fried Rice - Chicken', price: 249, is_veg: false, description: 'Category: Classic Indian Combos' },
    { name: 'Hakka Noodles - Veg', price: 149, is_veg: true, description: 'Category: Classic Indian Combos' },
    { name: 'Hakka Noodles - Chicken', price: 249, is_veg: false, description: 'Category: Classic Indian Combos' },
    { name: 'Schezwan Fried Rice + Hot Garlic Paneer', price: 249, is_veg: true, description: 'Category: Classic Indian Combos' },
    { name: 'Schezwan Fried Rice + Chilly Chicken Gravy', price: 299, is_veg: false, description: 'Category: Classic Indian Combos' },
    { name: 'Schezwan Fried Rice + Chicken Manchurian', price: 299, is_veg: false, description: 'Category: Classic Indian Combos' },
    { name: 'Chicken Lollipop (4)', price: 299, is_veg: false, description: 'Category: Classic Indian Combos' },
    { name: 'Chinese Platter - Veg', price: 249, is_veg: true, description: 'Category: Classic Indian Combos' },
    { name: 'Chinese Platter - Non Veg', price: 349, is_veg: false, description: 'Category: Classic Indian Combos' }
];

async function restore() {
    console.log('--- RESTORING FULL MENUS ---');

    const outletsData = [
        { name: 'House of Chow', menu: houseOfChowMenu },
        { name: 'Maggi Hotspot', menu: maggiMenu },
        { name: 'Southern Stories', menu: southernStoriesMenu },
        { name: 'SnapEats', menu: snapEatsMenu }
    ];

    for (const data of outletsData) {
        process.stdout.write(`Processing ${data.name}... `);

        // Find outlet
        const { data: outlet, error: outletErr } = await supabase
            .from('outlets')
            .select('id')
            .ilike('name', `%${data.name}%`)
            .single();

        if (outletErr || !outlet) {
            console.log(`\n❌ Could not find outlet ${data.name}: ${outletErr?.message}`);
            continue;
        }

        const outletId = outlet.id;

        // Fetch existing items for this outlet
        const { data: existingItems, error: fetchErr } = await supabase
            .from('menu_items')
            .select('name')
            .eq('outlet_id', outletId);

        if (fetchErr) {
            console.log(`\n❌ Error fetching existing items for ${data.name}: ${fetchErr.message}`);
            continue;
        }

        const existingNames = new Set(existingItems.map(i => i.name));
        const itemsToInsert = data.menu
            .filter(item => !existingNames.has(item.name))
            .map(item => ({ ...item, outlet_id: outletId, availability: true }));

        if (itemsToInsert.length === 0) {
            console.log(`Already complete. (${existingItems.length} items)`);
            continue;
        }

        // Batch insert
        const chunkSize = 50;
        let insertedCount = 0;
        for (let i = 0; i < itemsToInsert.length; i += chunkSize) {
            const chunk = itemsToInsert.slice(i, i + chunkSize);
            const { error: insertErr } = await supabase.from('menu_items').insert(chunk);
            if (insertErr) {
                console.log(`\n❌ Error inserting chunk for ${data.name}: ${insertErr.message}`);
                break;
            }
            insertedCount += chunk.length;
        }

        console.log(`Added ${insertedCount} new items. Total: ${existingItems.length + insertedCount}`);
    }

    console.log('\n✅ All menus restored and synchronized!');
}

restore();
