import { apiClient } from './apiClient.js';

const UPDATE_TIMEOUT_MS = 60000;

/**
 * GET /user/profile (PRD 4.3).
 * @returns {Promise<{ id: string, email: string, role: string, displayName: string|null, heightCm: number|null, weightKg: number|null, bodyPhotoUrl: string|null, updatedAt: string }>}
 * @throws {import('./apiClient.js').ApiError}
 */
export function getProfile({ signal } = {}) {
  return apiClient.get('/user/profile', { signal });
}

/**
 * PUT /user/profile as multipart/form-data (PRD 4.4). `displayName` is always sent so an empty
 * value clears the name (D14); the number fields must already be normalized (lib/validateProfile.js).
 * @param {{ displayName: string, heightCm: string, weightKg: string }} fields
 * @param {File|null} bodyPhoto
 * @throws {import('./apiClient.js').ApiError}
 */
export function updateProfile({ displayName, heightCm, weightKg }, bodyPhoto) {
  const form = new FormData();
  form.append('displayName', displayName);
  form.append('heightCm', heightCm);
  form.append('weightKg', weightKg);
  if (bodyPhoto) form.append('bodyPhoto', bodyPhoto);
  return apiClient.put('/user/profile', form, { signal: AbortSignal.timeout(UPDATE_TIMEOUT_MS) });
}
