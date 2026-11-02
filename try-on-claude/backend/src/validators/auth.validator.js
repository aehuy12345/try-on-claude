import { AppError } from '../utils/AppError.js';

// Keep in sync with frontend/src/lib/validateRegister.js and the CHECKs in migrations/001.
// U+0085 counts as whitespace for Postgres but not for JS \s, so it is excluded explicitly.
const EMAIL_RE = /^[^@\s\u0085]+@[^@\s\u0085]+\.[^@\s\u0085]+$/;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_CODE_POINTS = 8;
const MAX_PASSWORD_BYTES = 72;

const MESSAGES = {
  INVALID_EMAIL: 'Email không hợp lệ.',
  INVALID_PASSWORD:
    'Mật khẩu cần ít nhất 8 ký tự, gồm chữ và số, tối đa 72 ký tự (ít hơn nếu dùng chữ có dấu).',
  PASSWORD_MISMATCH: 'Mật khẩu xác nhận không khớp.',
};

function fail(code) {
  return new AppError(400, code, MESSAGES[code]);
}

// Postgres text cannot store NUL; reject it here instead of letting the insert fail with a 500.
const hasNul = (value) => value.split('').some((ch) => ch.charCodeAt(0) === 0);

/**
 * Validate and normalize the register payload. Reads only the whitelisted fields.
 * Check order (PRD 4.1): email, password, confirmation.
 * @param {unknown} body - raw req.body (may be undefined or non-object)
 * @returns {{ email: string, password: string }}
 * @throws {AppError} 400 INVALID_EMAIL | INVALID_PASSWORD | PASSWORD_MISMATCH
 */
export function parseRegisterInput(body) {
  const source = body !== null && typeof body === 'object' ? body : {};
  const { email: rawEmail, password: rawPassword, confirmPassword: rawConfirm } = source;

  if (typeof rawEmail !== 'string') throw fail('INVALID_EMAIL');
  const email = rawEmail.trim().toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH || hasNul(email) || !EMAIL_RE.test(email)) {
    throw fail('INVALID_EMAIL');
  }

  if (typeof rawPassword !== 'string') throw fail('INVALID_PASSWORD');
  const password = rawPassword.normalize('NFC');
  if (
    [...password].length < MIN_PASSWORD_CODE_POINTS ||
    Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES ||
    !/\p{L}/u.test(password) ||
    !/\p{N}/u.test(password)
  ) {
    throw fail('INVALID_PASSWORD');
  }

  if (typeof rawConfirm !== 'string' || rawConfirm.normalize('NFC') !== password) {
    throw fail('PASSWORD_MISMATCH');
  }

  return { email, password };
}
