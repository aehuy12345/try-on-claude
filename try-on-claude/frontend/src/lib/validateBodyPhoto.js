// Kiểm tra ảnh toàn thân ở client, khớp design/flows/upload-body-photo.md.
export const PHOTO_MESSAGES = {
  INVALID_TYPE: 'Ảnh phải ở định dạng JPG hoặc PNG.',
  TOO_LARGE: 'Ảnh không được vượt quá 5 MB.',
  UNREADABLE: 'Không đọc được ảnh. Vui lòng chọn ảnh khác.',
  RATIO_WARNING:
    'Ảnh có thể chưa phù hợp để thử đồ. Nên dùng ảnh toàn thân, đứng thẳng, dọc tỉ lệ 3:4 hoặc 9:16, chiều ngắn từ 720 px.',
  UPLOAD_FAILED: 'Không thể tải ảnh lên lúc này. Vui lòng thử lại.',
  INVALID_UPLOAD: 'Dữ liệu tải lên không hợp lệ. Vui lòng thử lại.',
};

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

/** Đạt khi |ratio - 0.75| <= 0.03 hoặc |ratio - 0.5625| <= 0.03, và chiều ngắn >= 720 px. */
export function isRecommendedSize(width, height) {
  const ratio = width / height;
  const okRatio = Math.abs(ratio - 0.75) <= 0.03 || Math.abs(ratio - 0.5625) <= 0.03;
  return okRatio && Math.min(width, height) >= 720;
}

function readSize(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * @returns {Promise<{ ok: true, warning: string } | { ok: false, error: string }>}
 * `warning` rỗng nếu ảnh đạt khuyến nghị; cảnh báo mềm không chặn việc nhận file.
 */
export async function validateBodyPhoto(file) {
  if (!ALLOWED_TYPES.includes(file.type)) return { ok: false, error: PHOTO_MESSAGES.INVALID_TYPE };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: PHOTO_MESSAGES.TOO_LARGE };
  const size = await readSize(file);
  if (!size || !size.width || !size.height) return { ok: false, error: PHOTO_MESSAGES.UNREADABLE };
  return {
    ok: true,
    warning: isRecommendedSize(size.width, size.height) ? '' : PHOTO_MESSAGES.RATIO_WARNING,
  };
}
