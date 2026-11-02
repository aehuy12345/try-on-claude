import { useEffect, useState } from 'react';
import { getHealth } from '../services/healthService.js';

/** @returns {{ state: 'loading'|'ok'|'degraded'|'error', detail: string|null }} */
export function useHealth() {
  const [result, setResult] = useState({ state: 'loading', detail: null });

  useEffect(() => {
    const controller = new AbortController();
    getHealth(controller.signal)
      .then((res) => {
        if (res.ok) setResult({ state: 'ok', detail: null });
        else setResult({ state: res.status === 503 ? 'degraded' : 'error', detail: res.message });
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setResult({ state: 'error', detail: err.message });
      });
    return () => controller.abort();
  }, []);

  return result;
}
