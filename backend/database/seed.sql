-- Seed file for testing CampusBite Backend
-- Add dummy users
INSERT INTO public.users (id, name, email, password, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Admin', 'admin@campusbite.app', '$2b$10$pBbx.qU92dnf8JPoTTkzyOIQXE9s5XFWRGyLM/aTLj1P5kzTuHCFW', 'admin'),
    ('22222222-2222-2222-2222-222222222222', 'Test Student', 'student@bennett.edu.in', '$2b$10$pBbx.qU92dnf8JPoTTkzyOIQXE9s5XFWRGyLM/aTLj1P5kzTuHCFW', 'student'),
    ('33333333-3333-3333-3333-333333333333', 'House of Chow Owner', 'houseofchow@bennett.edu.in', '$2b$10$pBbx.qU92dnf8JPoTTkzyOIQXE9s5XFWRGyLM/aTLj1P5kzTuHCFW', 'owner'),
    ('44444444-4444-4444-4444-444444444444', 'SnapEats Owner', 'snapeats@bennett.edu.in', '$2b$10$pBbx.qU92dnf8JPoTTkzyOIQXE9s5XFWRGyLM/aTLj1P5kzTuHCFW', 'owner'),
    ('55555555-5555-5555-5555-555555555555', 'Southern Stories Owner', 'southernstories@bennett.edu.in', '$2b$10$pBbx.qU92dnf8JPoTTkzyOIQXE9s5XFWRGyLM/aTLj1P5kzTuHCFW', 'owner'),
    ('66666666-6666-6666-6666-666666666666', 'Maggi Hotspot Owner', 'maggihotspot@bennett.edu.in', '$2b$10$pBbx.qU92dnf8JPoTTkzyOIQXE9s5XFWRGyLM/aTLj1P5kzTuHCFW', 'owner')
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email, 
    name = EXCLUDED.name, 
    role = EXCLUDED.role, 
    password = EXCLUDED.password;

-- Add dummy outlets
INSERT INTO public.outlets (id, name, location, owner_id) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'House of Chow', 'Food Court, First Floor', '33333333-3333-3333-3333-333333333333'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'SnapEats', 'Near Academic Block 2', '44444444-4444-4444-4444-444444444444'),
    ('11111111-cccc-cccc-cccc-cccccccccccc', 'Southern Stories', 'Food Court, First Floor', '55555555-5555-5555-5555-555555555555'),
    ('22222222-dddd-dddd-dddd-dddddddddddd', 'Maggi Hotspot', 'Near Boys Hostel', '66666666-6666-6666-6666-666666666666')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    location = EXCLUDED.location, 
    owner_id = EXCLUDED.owner_id;

-- Add menu items for House of Chow
INSERT INTO public.menu_items (id, outlet_id, name, description, price, availability, image_url) VALUES
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Chilli Chicken', 'Spicy tossed chicken', 180.00, true, 'https://example.com/chillichicken.jpg'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Hakka Noodles', 'Wok tossed noodles', 120.00, true, 'https://example.com/hakka.jpg'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Coke', 'Refreshing cold drink', 40.00, true, 'https://example.com/coke.jpg')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, availability = EXCLUDED.availability, image_url = EXCLUDED.image_url;

-- Add menu items for SnapEats
INSERT INTO public.menu_items (id, outlet_id, name, description, price, availability, image_url) VALUES
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Chicken Wrap', 'Grilled chicken wrap', 150.00, true, 'https://example.com/wrap.jpg'),
    ('10101010-1010-1010-1010-101010101010', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Cold Coffee', 'Thick cold coffee', 90.00, true, 'https://example.com/coffee.jpg')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, availability = EXCLUDED.availability, image_url = EXCLUDED.image_url;

-- Add menu items for Southern Stories
INSERT INTO public.menu_items (id, outlet_id, name, description, price, availability, image_url) VALUES
    ('20202020-2020-2020-2020-202020202020', '11111111-cccc-cccc-cccc-cccccccccccc', 'Masala Dosa', 'Crispy dosa with potato filling', 80.00, true, 'https://example.com/dosa.jpg'),
    ('30303030-3030-3030-3030-303030303030', '11111111-cccc-cccc-cccc-cccccccccccc', 'Idli Sambar', 'Steamed rice cakes', 60.00, true, 'https://example.com/idli.jpg')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, availability = EXCLUDED.availability, image_url = EXCLUDED.image_url;

-- Add menu items for Maggi Hotspot
INSERT INTO public.menu_items (id, outlet_id, name, description, price, availability, image_url) VALUES
    ('40404040-4040-4040-4040-404040404040', '22222222-dddd-dddd-dddd-dddddddddddd', 'Cheese Maggi', 'Classic maggi with cheese', 50.00, true, 'https://example.com/maggi.jpg'),
    ('50505050-5050-5050-5050-505050505050', '22222222-dddd-dddd-dddd-dddddddddddd', 'Peri Peri Fries', 'Spicy french fries', 70.00, true, 'https://example.com/fries2.jpg')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, availability = EXCLUDED.availability, image_url = EXCLUDED.image_url;
