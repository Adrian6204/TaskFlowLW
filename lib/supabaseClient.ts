
import { createClient } from '@supabase/supabase-js';

// Access environment variables directly.
// Vite (via vite.config.ts) will inject these during the build process on Vercel.
// We provide fallbacks to prevent the app from crashing immediately if keys are missing.
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder';

// Flag to check if the app is actually connected
export const isSupabaseConfigured =
  !!process.env.SUPABASE_URL &&
  process.env.SUPABASE_URL !== 'undefined' &&
  !!process.env.SUPABASE_ANON_KEY &&
  process.env.SUPABASE_ANON_KEY !== 'undefined';

export const supabase = createClient(supabaseUrl, supabaseKey);
