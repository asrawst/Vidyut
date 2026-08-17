import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from environment variables, fallback to project URL
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lepaxhqnjvcdmjfhpbxq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
    console.warn(
        "Supabase VITE_SUPABASE_ANON_KEY is not defined in your environment variables. " +
        "Please create a `.env` file in the `frontend` folder with your credentials."
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
