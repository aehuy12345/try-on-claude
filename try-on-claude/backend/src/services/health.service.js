import { supabase } from '../config/supabase.js';

const SUPABASE_TIMEOUT_MS = 5000;

/** Lightweight Supabase check that does not depend on any app table. */
export async function checkSupabase() {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), SUPABASE_TIMEOUT_MS);
  });
  try {
    const { error } = await Promise.race([supabase.storage.listBuckets(), timeout]);
    if (error) return { connected: false, reason: error.message };
    return { connected: true };
  } catch (err) {
    return { connected: false, reason: err.message };
  } finally {
    clearTimeout(timer);
  }
}
