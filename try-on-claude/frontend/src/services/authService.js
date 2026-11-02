import { apiClient } from './apiClient.js';

/**
 * POST /auth/register. Values must already be normalized (see lib/validateRegister.js).
 * @returns {Promise<{ token: string, user: { id: string, email: string, role: string } }>}
 * @throws {import('./apiClient.js').ApiError}
 */
export function register({ email, password, confirmPassword }) {
  return apiClient.post('/auth/register', { email, password, confirmPassword });
}

/**
 * POST /auth/login. Email and password must already be normalized (see lib/validateLogin.js).
 * @returns {Promise<{ token: string, user: { id: string, email: string, role: string } }>}
 * @throws {import('./apiClient.js').ApiError}
 */
export function login({ email, password }) {
  return apiClient.post('/auth/login', { email, password });
}
