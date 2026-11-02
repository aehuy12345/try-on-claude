import { supabase } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

const BUCKET = 'body-photos';
const SIGNED_URL_TTL_SECONDS = 300;
const PG_CHECK_VIOLATION = '23514';
// Explicit column list: never select('*') on profiles, it holds password_hash.
const PROFILE_COLUMNS =
  'id, email, role, display_name, height_cm, weight_kg, body_photo_path, updated_at';

const tokenInvalid = () =>
  new AppError(401, 'TOKEN_INVALID', 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');

const uploadFailed = () =>
  new AppError(500, 'UPLOAD_FAILED', 'Không thể tải ảnh lên lúc này. Vui lòng thử lại.');

/** Signed URL for a stored photo, or null when there is no photo or the URL cannot be created. */
async function createPhotoUrl(path) {
  if (!path) return null;
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (error) {
      console.error('Signed URL creation failed:', error.message);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error('Signed URL creation failed:', err.message);
    return null;
  }
}

/** Delete a Storage object. Failures are logged only: callers must not fail because of cleanup. */
async function removeObject(path, reason) {
  try {
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) console.error(`Storage cleanup failed (${reason}):`, error.message);
  } catch (err) {
    console.error(`Storage cleanup failed (${reason}):`, err.message);
  }
}

async function toProfileDto(row) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    displayName: row.display_name,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    bodyPhotoUrl: await createPhotoUrl(row.body_photo_path),
    updatedAt: row.updated_at,
  };
}

/**
 * @param {string} userId - from the JWT `sub`
 * @throws {AppError} 401 TOKEN_INVALID when the profile no longer exists
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw tokenInvalid();
  return toProfileDto(data);
}

/**
 * Update the profile in one UPDATE, after uploading the new photo if any (D10: all or nothing).
 * Order follows design/flows/upload-body-photo.md. Input must already be validated.
 * @param {string} userId - from the JWT `sub`
 * @param {ReturnType<import('../validators/profile.validator.js').parseProfileInput>} input
 * @throws {AppError} 401 TOKEN_INVALID | 400 VALIDATION_ERROR | 500 UPLOAD_FAILED
 */
export async function updateProfile(userId, { displayName, heightCm, weightKg, photo }) {
  let oldPath = null;
  let newPath = null;

  if (photo) {
    const { data: current, error: selectError } = await supabase
      .from('profiles')
      .select('body_photo_path')
      .eq('id', userId)
      .maybeSingle();
    if (selectError) throw selectError;
    if (!current) throw tokenInvalid();
    oldPath = current.body_photo_path;

    newPath = `${userId}/${Date.now()}.${photo.ext}`;
    let uploadError;
    try {
      ({ error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(newPath, photo.buffer, { contentType: photo.contentType, upsert: false }));
    } catch (err) {
      uploadError = err;
    }
    if (uploadError) {
      console.error('Photo upload failed:', uploadError.message);
      throw uploadFailed();
    }
  }

  const changes = { height_cm: heightCm, weight_kg: weightKg };
  if (displayName !== undefined) changes.display_name = displayName;
  if (newPath) changes.body_photo_path = newPath;

  let row;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(changes)
      .eq('id', userId)
      .select(PROFILE_COLUMNS)
      .maybeSingle();
    if (error) throw error;
    row = data;
  } catch (err) {
    if (newPath) await removeObject(newPath, 'rollback');
    if (err.code === PG_CHECK_VIOLATION) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
    }
    throw err;
  }
  if (!row) {
    if (newPath) await removeObject(newPath, 'rollback');
    throw tokenInvalid();
  }

  if (newPath && oldPath && oldPath !== newPath) await removeObject(oldPath, 'old photo');

  return toProfileDto(row);
}
