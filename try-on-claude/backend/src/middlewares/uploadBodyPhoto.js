import multer from 'multer';
import { AppError } from '../utils/AppError.js';

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_FIELD = 'bodyPhoto';

const parseMultipart = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_BYTES, files: 1, fields: 10, fieldSize: 1024 },
}).single(PHOTO_FIELD);

/** Multer silently skips non-multipart requests, so reject them first (PRD 4.4: 415). */
export function requireMultipart(req, _res, next) {
  if (!req.is('multipart/form-data')) {
    return next(
      new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Định dạng yêu cầu không được hỗ trợ.'),
    );
  }
  next();
}

/**
 * Parse the multipart body into `req.body` (text parts) and `req.file` (bodyPhoto, in memory).
 * errorHandler does not know MulterError, so every parse failure is mapped to an AppError here;
 * non-MulterError failures (malformed multipart from busboy) are also treated as bad uploads.
 */
export function parseBodyPhotoUpload(req, res, next) {
  parseMultipart(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError(413, 'FILE_TOO_LARGE', 'Ảnh không được vượt quá 5 MB.'));
    }
    next(new AppError(400, 'INVALID_UPLOAD', 'Dữ liệu tải lên không hợp lệ. Vui lòng thử lại.'));
  });
}
