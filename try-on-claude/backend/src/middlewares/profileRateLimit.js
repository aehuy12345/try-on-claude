import { rateLimit } from 'express-rate-limit';
import { AppError } from '../utils/AppError.js';

export const PROFILE_UPDATE_WINDOW_MS = 10 * 60 * 1000;
export const PROFILE_UPDATE_LIMIT = 20;

/**
 * Caps PUT /profile per user (PRD D21-D24). Must run after requireAuth (needs req.userId) and
 * requireMultipart (415 is not counted), and before multer so a blocked request never buffers its file.
 * Failed requests count on purpose: they cost the same memory. The store is in-process (D24).
 */
export const limitProfileUpdates = rateLimit({
  windowMs: PROFILE_UPDATE_WINDOW_MS,
  limit: PROFILE_UPDATE_LIMIT,
  keyGenerator: (req) => req.userId,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(
      new AppError(
        429,
        'TOO_MANY_REQUESTS',
        'Bạn đã lưu quá nhiều lần trong thời gian ngắn. Vui lòng thử lại sau 10 phút.',
      ),
    ),
});
