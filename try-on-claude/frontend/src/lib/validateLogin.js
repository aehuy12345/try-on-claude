// Quy tắc validate client cho đăng nhập, khớp design/flows/login.md (bảng "Nhánh lỗi").
// Không áp quy tắc độ mạnh mật khẩu ở đây: chỉ cần không rỗng.
import { MESSAGES as REGISTER_MESSAGES, isValidEmail } from './validateRegister.js';

export { normalizeEmail, normalizePassword } from './validateRegister.js';

export const LOGIN_MESSAGES = {
  REQUIRED: 'Vui lòng nhập email và mật khẩu.',
  INVALID_EMAIL: REGISTER_MESSAGES.INVALID_EMAIL,
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  VALIDATION_ERROR: 'Vui lòng nhập email và mật khẩu.',
  INTERNAL_ERROR: REGISTER_MESSAGES.INTERNAL_ERROR,
  NETWORK_ERROR: REGISTER_MESSAGES.NETWORK_ERROR,
  SESSION_EXPIRED: 'Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.',
};

/** Trả về object lỗi theo field: { email?, password? } (rỗng nếu hợp lệ). */
export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = LOGIN_MESSAGES.REQUIRED;
  else if (!isValidEmail(email)) errors.email = LOGIN_MESSAGES.INVALID_EMAIL;
  if (!password) errors.password = LOGIN_MESSAGES.REQUIRED;
  return errors;
}
