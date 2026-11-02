import { checkSupabase } from '../services/health.service.js';

export async function getHealth(_req, res) {
  const result = await checkSupabase();
  if (result.connected) {
    return res.status(200).json({ status: 'ok', supabase: 'connected' });
  }
  return res
    .status(503)
    .json({ status: 'degraded', supabase: 'disconnected', reason: result.reason });
}
