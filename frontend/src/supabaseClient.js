import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from environment variables, fallback to project URL
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lepaxhqnjvcdmjfhpbxq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlcGF4aHFuanZjZG1qZmhwYnhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTAzNDQsImV4cCI6MjEwMjUyNjM0NH0.4Wbgf753nVfJrTTmCfEdqU5BtIMejvMXvdz0vUwIiHo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

