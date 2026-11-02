import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.js';
import { signToken } from '../config/jwt.js';
import { AppError } from '../utils/AppError.js';

const BCRYPT_COST = 10;
const PG_UNIQUE_VIOLATION = '23505';
const PG_CHECK_VIOLATION = '23514';

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
