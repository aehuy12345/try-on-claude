import sharp from 'sharp';
import { AppError } from '../utils/AppError.js';
import { uploadFailed } from '../utils/uploadErrors.js';

// PRD D25-D29. Runs in the service layer after the magic-bytes check and before any Supabase call (D10).
export const MAX_ENCODED_BYTES = 5 * 1024 * 1024;
export const MAX_INPUT_PIXELS = 70_000_000;

const ENCODE_ATTEMPTS = {
  jpg: [{ quality: 90 }, { quality: 75 }],
  png: [{ compressionLevel: 9, adaptiveFiltering: true }, { compressionLevel: 9 }],
};

const unreadable = () =>
  new AppError(400, 'INVALID_FILE_TYPE', 'Không đọc được ảnh. Vui lòng chọn ảnh khác.');

const tooLarge = () =>
  new AppError(
    413,
    'FILE_TOO_LARGE',
    'Ảnh quá lớn để xử lý. Vui lòng chọn ảnh có độ phân giải hoặc dung lượng nhỏ hơn.',
  );

/** @returns {boolean} true when width x height is over the pixel limit (D27) */
export const exceedsPixelLimit = (width, height, maxPixels = MAX_INPUT_PIXELS) =>
  width * height > maxPixels;

/**
 * D28: out-of-memory is a server problem (500); any other read/decode failure is the user's file (400).
 * Only err.message is logged, never file content.
 */
function classifyAsyncError(err) {
  if (/out of memory/i.test(err?.message ?? '')) {
    console.error('Photo processing failed (out of memory):', err.message);
    return uploadFailed();
  }
  return unreadable();
}

/** A synchronous throw while building the pipeline means bad parameters, i.e. a bug of ours (D28). */
function internalError(err) {
  console.error('Photo processing failed (pipeline setup):', err?.message);
  return uploadFailed();
}

/**
 * Build a processor. `sharpImpl`, `maxEncodedBytes` and `maxPixels` exist so tests can observe the
 * pipeline and shrink limits; production uses the defaults below.
 */
export function createBodyPhotoProcessor({
  sharpImpl = sharp,
  maxEncodedBytes = MAX_ENCODED_BYTES,
  maxPixels = MAX_INPUT_PIXELS,
} = {}) {
  // D29: one image per process at a time. A failed task must not break the chain for the next one.
  let tail = Promise.resolve();
  const runExclusive = (task) => {
    const result = tail.then(task);
    tail = result.catch(() => {});
    return result;
  };

  async function readDimensions(buffer) {
    let image;
    try {
      image = sharpImpl(buffer, { failOn: 'warning', limitInputPixels: false });
    } catch (err) {
      throw internalError(err);
    }
    try {
      const { width, height } = await image.metadata();
      if (!width || !height) throw unreadable();
      return { width, height };
    } catch (err) {
      throw err instanceof AppError ? err : classifyAsyncError(err);
    }
  }

  async function encode(buffer, ext, options) {
    let pipeline;
    try {
      pipeline = sharpImpl(buffer, { failOn: 'warning', limitInputPixels: maxPixels })
        .autoOrient()
        .toColourspace('srgb');
      pipeline = ext === 'jpg' ? pipeline.jpeg(options) : pipeline.png(options);
    } catch (err) {
      throw internalError(err);
    }
    try {
      return await pipeline.toBuffer();
    } catch (err) {
      throw classifyAsyncError(err);
    }
  }

  async function process({ buffer, ext, contentType }) {
    const { width, height } = await readDimensions(buffer);
    if (exceedsPixelLimit(width, height, maxPixels)) throw tooLarge();

    for (const options of ENCODE_ATTEMPTS[ext]) {
      const encoded = await encode(buffer, ext, options);
      if (encoded.length <= maxEncodedBytes) return { buffer: encoded, ext, contentType };
    }
    throw tooLarge();
  }

  /**
   * Decode, apply EXIF orientation, convert to sRGB and re-encode without any metadata (D25).
   * @param {{ buffer: Buffer, ext: 'jpg' | 'png', contentType: string }} photo - magic bytes already checked
   * @returns {Promise<{ buffer: Buffer, ext: 'jpg' | 'png', contentType: string }>}
   * @throws {AppError} 400 INVALID_FILE_TYPE | 413 FILE_TOO_LARGE | 500 UPLOAD_FAILED
   */
  return (photo) => runExclusive(() => process(photo));
}

export const processBodyPhoto = createBodyPhotoProcessor();
