import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if credentials are properly set up (not empty and not placeholders)
const isConfigured = 
  supabaseUrl && 
  supabaseUrl !== 'your-supabase-project-url' && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'your-supabase-anon-key';

export const isMock = !isConfigured;

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (isMock) {
  console.warn("⚠️ FitShare: Supabase environment variables are missing or default. Running in mock simulation mode.");
}
