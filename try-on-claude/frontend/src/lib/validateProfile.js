// Quy tắc validate client cho hồ sơ, khớp design/flows/profile.md (bảng "Nhánh lỗi").
export const PROFILE_MESSAGES = {
  INVALID_DISPLAY_NAME: 'Tên hiển thị tối đa 50 ký tự.',
  INVALID_HEIGHT: 'Chiều cao phải là số từ 100 đến 250 cm.',
  INVALID_WEIGHT: 'Cân nặng phải là số từ 30 đến 250 kg.',
  INTERNAL_ERROR: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
  NETWORK_ERROR: 'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
  LOAD_FAILED: 'Không tải được hồ sơ. Vui lòng thử lại.',
  SAVED: 'Lưu thành công.',
  ADD_PHOTO: 'Thêm ảnh toàn thân để thử đồ',
  DRAFT_RESTORED: 'Đã giữ lại thông tin bạn nhập. Vui lòng chọn lại ảnh.',
};

export const DISPLAY_NAME_MAX = 50;

/** Chuẩn hoá ô số đo: bỏ khoảng trắng hai đầu, đổi dấu phẩy thập phân thành dấu chấm. */
export function normalizeMeasure(raw) {
  return String(raw ?? '')
    .trim()
    .replace(',', '.');
}

function inRange(raw, min, max) {
  const value = normalizeMeasure(raw);
  if (!/^\d{1,3}(\.\d+)?$/.test(value)) return false;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max;
}

/** Trả về object lỗi theo field: { displayName?, heightCm?, weightKg? } (rỗng nếu hợp lệ). */
export function validateProfile({ displayName, heightCm, weightKg }) {
  const errors = {};
  const name = String(displayName ?? '').trim();
  // NUL: server rejects it because Postgres text cannot store it.
  if ([...name].length > DISPLAY_NAME_MAX || name.includes('\u0000')) {
    errors.displayName = PROFILE_MESSAGES.INVALID_DISPLAY_NAME;
  }
  if (!inRange(heightCm, 100, 250)) errors.heightCm = PROFILE_MESSAGES.INVALID_HEIGHT;
  if (!inRange(weightKg, 30, 250)) errors.weightKg = PROFILE_MESSAGES.INVALID_WEIGHT;
  return errors;
}
