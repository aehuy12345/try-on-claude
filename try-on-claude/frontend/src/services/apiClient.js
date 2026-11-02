export const TOKEN_STORAGE_KEY = 'tryon_token';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, { status, code, data } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_STORAGE_KEY),
  set: (token) => localStorage.setItem(TOKEN_STORAGE_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_STORAGE_KEY),
};

/**
 * Shared API client. Resolves with parsed JSON (or null for empty bodies).
 * Rejects with ApiError built from the backend format `{ error: { message, code } }`.
 * @param {string} path - path relative to VITE_API_URL, e.g. '/health'
 * @param {{ method?: string, body?: unknown, headers?: Record<string,string>, signal?: AbortSignal }} [options]
 */
export async function apiRequest(path, { method = 'GET', body, headers = {}, signal } = {}) {
  const finalHeaders = { Accept: 'application/json', ...headers };
  const token = tokenStorage.get();
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  const isFormData = body instanceof FormData;
  if (body !== undefined && !isFormData) finalHeaders['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Không thể kết nối tới máy chủ. Vui lòng thử lại.', {
      code: 'NETWORK_ERROR',
    });
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Callers decide how to react to 401 (e.g. clear token + redirect once auth exists).
    const message = data?.error?.message ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.';
    throw new ApiError(message, { status: response.status, code: data?.error?.code, data });
  }
  return data;
}

export const apiClient = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
};
