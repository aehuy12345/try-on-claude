import { apiClient } from './apiClient.js';

/** Health endpoint returns 503 with a JSON body when degraded, so read it without throwing. */
export async function getHealth(signal) {
  try {
    return { ok: true, data: await apiClient.get('/health', { signal }) };
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    return { ok: false, message: err.data?.reason ?? err.message, status: err.status };
  }
}
