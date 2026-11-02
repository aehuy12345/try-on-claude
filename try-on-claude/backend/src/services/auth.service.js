import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.js';
import { signToken } from '../config/jwt.js';
import { AppError } from '../utils/AppError.js';
import { isWellFormedEmail } from '../validators/auth.validator.js';

const BCRYPT_COST = 10;
const MAX_PASSWORD_BYTES = 72;
const PG_UNIQUE_VIOLATION = '23505';
const PG_CHECK_VIOLATION = '23514';

// Created once at startup; compared against when no real hash applies so every 401 costs one bcrypt.compare.
const DUMMY_HASH = await bcrypt.hash('dummy-password-for-timing-only', BCRYPT_COST);

const invalidCredentials = () =>
  new AppError(401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.');

const emailTaken = () => new AppError(409, 'EMAIL_TAKEN', 'Email này đã được sử dụng.');

/**
 * Create a user account and sign them in. Input must already be validated and normalized.
 * @returns {Promise<{ token: string, user: { id: string, email: string, role: string } }>}
 */
export async function register({ email, password }) {
  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) throw emailTaken();

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  // Role is never taken from the client: the DB default ('user') applies.
  const { data: user, error: insertError } = await supabase
    .from('profiles')
    .insert({ email, password_hash: passwordHash })
    .select('id, email, role')
    .single();

  if (insertError) {
    // Concurrent request won the race between the SELECT and this INSERT.
    if (insertError.code === PG_UNIQUE_VIOLATION) throw emailTaken();
    if (insertError.code === PG_CHECK_VIOLATION) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
    }
    throw insertError;
  }

  const token = signToken({ sub: user.id, role: user.role });
  return { token, user: { id: user.id, email: user.email, role: user.role } };
}

/**
 * Verify credentials and sign the user in. Input must already be normalized.
 * Every failure path is identical and runs exactly one bcrypt.compare (D8).
 * @returns {Promise<{ token: string, user: { id: string, email: string, role: string } }>}
 * @throws {AppError} 401 INVALID_CREDENTIALS
 */
export async function login({ email, password }) {
  let profile = null;
  if (isWellFormedEmail(email)) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, password_hash')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    profile = data;
  }

  // bcrypt truncates at 72 bytes; a longer password can never be a real one, so it must not match a prefix.
  const tooLong = Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES;
  const hash = profile && !tooLong ? profile.password_hash : DUMMY_HASH;
  const matches = await bcrypt.compare(password, hash);
  if (!profile || tooLong || !matches) throw invalidCredentials();

  const token = signToken({ sub: profile.id, role: profile.role });
  return { token, user: { id: profile.id, email: profile.email, role: profile.role } };
}
