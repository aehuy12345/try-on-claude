import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Service role bypasses RLS: use on the backend only, never expose to the frontend.
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
