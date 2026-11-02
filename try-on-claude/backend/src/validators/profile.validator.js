import { AppError } from '../utils/AppError.js';

// Keep in sync with frontend/src/lib/validateProfile.js and the CHECKs in migrations/001.
const MAX_DISPLAY_NAME_CODE_POINTS = 50;
const MEASURE_RE = /^\d{1,3}(\.\d+)?$/;
const HEIGHT_RANGE = [100, 250];
const WEIGHT_RANGE = [30, 250];

const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const MESSAGES = {
  INVALID_DISPLAY_NAME: 'Tên hiển thị tối đa 50 ký tự.',
  INVALID_HEIGHT: 'Chiều cao phải là số từ 100 đến 250 cm.',
  INVALID_WEIGHT: 'Cân nặng phải là số từ 30 đến 250 kg.',
  INVALID_FILE_TYPE: 'Ảnh phải ở định dạng JPG hoặc PNG.',
};

const fail = (code) => new AppError(400, code, MESSAGES[code]);

// Postgres text cannot store NUL; reject it here instead of letting the UPDATE fail with a 500.
const hasNul = (value) => value.includes('\u0000');

const startsWith = (buffer, magic) =>
  buffer.length >= magic.length && magic.every((byte, i) => buffer[i] === byte);

/** Normalize and validate one measurement. The range is checked on the raw value, then rounded. */
function parseMeasure(raw, [min, max], code) {
  if (typeof raw !== 'string') throw fail(code);
  const text = raw.trim();
  if (!MEASURE_RE.test(text)) throw fail(code);
  const value = Number(text);
  if (value < min || value > max) throw fail(code);
  return Math.round(value * 10) / 10;
}

/**
 * Detect the image type from magic bytes. Client-supplied MIME and file name are never trusted (D16).
 * @param {Buffer} buffer
 * @returns {{ ext: 'jpg' | 'png', contentType: string } | null}
 */
function detectImageType(buffer) {
  if (startsWith(buffer, JPEG_MAGIC)) return { ext: 'jpg', contentType: 'image/jpeg' };
  if (startsWith(buffer, PNG_MAGIC)) return { ext: 'png', contentType: 'image/png' };
  return null;
}

/**
 * Validate the PUT /user/profile payload. Reads only whitelisted fields (D11); other parts are ignored.
 * Check order (PRD 4.4): displayName, heightCm, weightKg, file type.
 * @param {Record<string, unknown> | undefined} body - req.body from multer (values may be arrays/objects)
 * @param {{ buffer: Buffer } | undefined} file - req.file
 * @returns {{
 *   displayName: string | null | undefined,
 *   heightCm: number,
 *   weightKg: number,
 *   photo: { buffer: Buffer, ext: 'jpg' | 'png', contentType: string } | null
 * }} displayName: undefined = keep as is, null = clear
 * @throws {AppError} 400 INVALID_DISPLAY_NAME | INVALID_HEIGHT | INVALID_WEIGHT | INVALID_FILE_TYPE
 */
export function parseProfileInput(body, file) {
  const source = body ?? {};

  let displayName;
  const rawName = source.displayName;
  if (rawName !== undefined) {
    if (typeof rawName !== 'string' || hasNul(rawName)) throw fail('INVALID_DISPLAY_NAME');
    const trimmed = rawName.trim();
    if ([...trimmed].length > MAX_DISPLAY_NAME_CODE_POINTS) throw fail('INVALID_DISPLAY_NAME');
    displayName = trimmed === '' ? null : trimmed;
  }

  const heightCm = parseMeasure(source.heightCm, HEIGHT_RANGE, 'INVALID_HEIGHT');
  const weightKg = parseMeasure(source.weightKg, WEIGHT_RANGE, 'INVALID_WEIGHT');

  let photo = null;
  if (file) {
    const type = detectImageType(file.buffer);
    if (!type) throw fail('INVALID_FILE_TYPE');
    photo = { buffer: file.buffer, ...type };
  }

  return { displayName, heightCm, weightKg, photo };
}
