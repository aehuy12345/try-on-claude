import { AppError } from './AppError.js';

export const uploadFailed = () =>
  new AppError(500, 'UPLOAD_FAILED', 'Không thể tải ảnh lên lúc này. Vui lòng thử lại.');
