-- Migration to support new Admin features: User Management and Announcements

-- 1. Add moderation/status flags to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_frozen BOOLEAN DEFAULT FALSE;

-- 2. Create Announcements table for system-wide alerts
CREATE TABLE IF NOT EXISTS public.announcements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_role TEXT DEFAULT 'all' CHECK (target_role IN ('all', 'student', 'owner', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 3. Ensure Ratings table exists (if missing) and has is_hidden column
CREATE TABLE IF NOT EXISTS public.ratings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE,
    rating_value INTEGER CHECK (rating_value BETWEEN 1 AND 5),
    comment TEXT,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If it existed, ensure columns are there
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS outlet_id UUID REFERENCES public.outlets(id) ON DELETE CASCADE;
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
