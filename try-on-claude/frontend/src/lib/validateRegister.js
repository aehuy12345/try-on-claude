// Quy tắc validate client cho đăng ký, khớp design/flows/register.md và PRD D7 / mục 3.
// Server vẫn validate lại; đây chỉ để chặn sớm.

export const MESSAGES = {
  INVALID_EMAIL: 'Email không hợp lệ.',
  INVALID_PASSWORD:
    'Mật khẩu cần ít nhất 8 ký tự, gồm chữ và số, tối đa 72 ký tự (ít hơn nếu dùng chữ có dấu).',
  PASSWORD_MISMATCH: 'Mật khẩu xác nhận không khớp.',
  EMAIL_TAKEN: 'Email này đã được sử dụng.',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
  INTERNAL_ERROR: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
  NETWORK_ERROR: 'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
};

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const utf8Bytes = (s) => new TextEncoder().encode(s).length;

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function normalizePassword(password) {
  return password.normalize('NFC'); // không trim
}

/** Email hợp lệ sau chuẩn hoá (dùng chung với đăng nhập). */
export function isValidEmail(email) {
  const e = normalizeEmail(email);
  return e.length <= 254 && EMAIL_RE.test(e);
}

/** Trả về object lỗi theo field: { email?, password?, confirmPassword? } (rỗng nếu hợp lệ). */
export function validateRegister({ email, password, confirmPassword }) {
  const errors = {};
  if (!isValidEmail(email)) errors.email = MESSAGES.INVALID_EMAIL;

  const p = normalizePassword(password);
  if ([...p].length < 8 || utf8Bytes(p) > 72 || !/\p{L}/u.test(p) || !/\p{N}/u.test(p)) {
    errors.password = MESSAGES.INVALID_PASSWORD;
  }

  if (normalizePassword(confirmPassword) !== p) {
    errors.confirmPassword = MESSAGES.PASSWORD_MISMATCH;
  }
  return errors;
}
