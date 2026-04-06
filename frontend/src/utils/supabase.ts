import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mwovhehesvriexyhwbsb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_MjA4NzM4OTcyNQ.IVQJyW3s7tSCFefVytjcOzP3QjZf5UjYiIx0uVcR4J8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
