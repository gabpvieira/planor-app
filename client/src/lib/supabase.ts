import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// Environment variables for Supabase
// In Vite, use import.meta.env.VITE_* for client-side variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = import.meta.env.PROD
    ? 'Application configuration error. Please contact support.'
    : 'Supabase credentials missing! Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.\nCheck SETUP_SUPABASE.md for instructions.';
  
  console.error('[Supabase] Missing environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    mode: import.meta.env.MODE
  });
  
  throw new Error(errorMessage);
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

