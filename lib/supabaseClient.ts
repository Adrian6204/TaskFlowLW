
import { createClient } from '@supabase/supabase-js';

// Access environment variables directly.
// Vite (via vite.config.ts) will inject these during the build process on Vercel.
// We provide fallbacks to prevent the app from crashing immediately if keys are missing.
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder';

// DEBUG: Log what URL we're actually using
console.log('🔍 Supabase Client Configuration:');
console.log('  URL:', supabaseUrl);
console.log('  Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');
console.log('  Is Configured:', !!process.env.SUPABASE_URL && process.env.SUPABASE_URL !== 'undefined');

// Flag to check if the app is actually connected
export const isSupabaseConfigured =
  !!process.env.SUPABASE_URL &&
  process.env.SUPABASE_URL !== 'undefined' &&
  !!process.env.SUPABASE_ANON_KEY &&
  process.env.SUPABASE_ANON_KEY !== 'undefined';

export const supabase = createClient(supabaseUrl, supabaseKey);
