import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {
  MAX_ENCODED_BYTES,
  MAX_INPUT_PIXELS,
  createBodyPhotoProcessor,
  exceedsPixelLimit,
} from '../src/services/bodyPhoto.processor.js';
import { AppError } from '../src/utils/AppError.js';
import { alphaPng, hugeFlatPng, noiseJpeg, phoneJpeg, plainJpeg } from './helpers.js';

const jpegPhoto = (buffer) => ({ buffer, ext: 'jpg', contentType: 'image/jpeg' });
const pngPhoto = (buffer) => ({ buffer, ext: 'png', contentType: 'image/png' });

/**
 * Wrap real sharp so a test can watch the work without changing it: every instance reports when its
 * `metadata()` / `toBuffer()` starts and ends, tagged with the input buffer it was built from.
 */
function observedSharp({ onEvent, delayMs = 0 } = {}) {
  const stats = { metadataCalls: 0, encodeCalls: 0, inFlight: 0, maxInFlight: 0 };
  const wrapOperation = (image, name, tag) => {
    const original = image[name].bind(image);
    image[name] = async (...args) => {
      stats.inFlight += 1;
      stats.maxInFlight = Math.max(stats.maxInFlight, stats.inFlight);
      stats[name === 'metadata' ? 'metadataCalls' : 'encodeCalls'] += 1;
      onEvent?.(tag, name);
      try {
        if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
        return await original(...args);
      } finally {
        stats.inFlight -= 1;
      }
    };
  };
  const impl = (input, options) => {
    const image = sharp(input, options);
    wrapOperation(image, 'metadata', input);
    wrapOperation(image, 'toBuffer', input);
    return image;
  };
  return { impl, stats };
}

/** Run `fn` with console.error captured, so expected server-side logs do not clutter the test output. */
async function withCapturedErrors(fn) {
  const logged = [];
  const original = console.error;
  console.error = (...args) => logged.push(args.join(' '));
  try {
    await fn();
  } finally {
    console.error = original;
  }
  return logged;
}

describe('exceedsPixelLimit (D27)', () => {
  it('is false at exactly 70 000 000 pixels and true one pixel over', () => {
    assert.equal(MAX_INPUT_PIXELS, 70_000_000);
    assert.equal(exceedsPixelLimit(7000, 10000), false);
    assert.equal(exceedsPixelLimit(70_000_000, 1), false);
    assert.equal(exceedsPixelLimit(70_000_001, 1), true);
    assert.equal(exceedsPixelLimit(7001, 10000), true);
  });
});

describe('bodyPhoto processor: limits and encode attempts (D26, D27)', () => {
  it('uses the 5 242 880 byte limit by default', () => {
    assert.equal(MAX_ENCODED_BYTES, 5 * 1024 * 1024);
  });

  it('rejects an image over the pixel limit from its header, without decoding it', async () => {
    const { impl, stats } = observedSharp();
    const process = createBodyPhotoProcessor({ sharpImpl: impl });
    await assert.rejects(process(pngPhoto(await hugeFlatPng(7001, 10000))), (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 413);
      assert.equal(err.code, 'FILE_TOO_LARGE');
      return true;
    });
    assert.equal(stats.metadataCalls, 1);
    assert.equal(stats.encodeCalls, 0, 'no pixel may be decoded');
  });

  it('encodes once when the first attempt fits', async () => {
    const { impl, stats } = observedSharp();
    const process = createBodyPhotoProcessor({ sharpImpl: impl });
    const result = await process(jpegPhoto(await plainJpeg()));
    assert.equal(stats.encodeCalls, 1);
    assert.equal(result.ext, 'jpg');
    assert.equal(result.contentType, 'image/jpeg');
  });

  it('falls back to the second JPEG attempt (quality 75) when the first is over the limit', async () => {
    const original = await noiseJpeg(500, 500, 95);
    const size90 = (await sharp(original).jpeg({ quality: 90 }).toBuffer()).length;
    const size75 = (await sharp(original).jpeg({ quality: 75 }).toBuffer()).length;
    assert.ok(size75 < size90, 'fixture must shrink between attempts');

    const { impl, stats } = observedSharp();
    const limit = Math.floor((size75 + size90) / 2);
    const process = createBodyPhotoProcessor({ sharpImpl: impl, maxEncodedBytes: limit });
    const result = await process(jpegPhoto(original));
    assert.equal(stats.encodeCalls, 2);
    assert.equal(result.buffer.length, size75, 'the second attempt result is returned');
    assert.ok(result.buffer.length <= limit);
  });

  it('is 413 when the second attempt is still over the limit', async () => {
    const original = await noiseJpeg(500, 500, 95);
    const size75 = (await sharp(original).jpeg({ quality: 75 }).toBuffer()).length;
    const { impl, stats } = observedSharp();
    const process = createBodyPhotoProcessor({ sharpImpl: impl, maxEncodedBytes: size75 - 1 });
    await assert.rejects(
      process(jpegPhoto(original)),
      (err) => err.statusCode === 413 && err.code === 'FILE_TOO_LARGE',
    );
    assert.equal(stats.encodeCalls, 2, 'exactly two attempts, then give up');
  });

  it('accepts an output of exactly the limit', async () => {
    const original = await noiseJpeg(200, 200, 95);
    const size90 = (await sharp(original).jpeg({ quality: 90 }).toBuffer()).length;
    const { impl, stats } = observedSharp();
    const process = createBodyPhotoProcessor({ sharpImpl: impl, maxEncodedBytes: size90 });
    await process(jpegPhoto(original));
    assert.equal(stats.encodeCalls, 1);
  });

  it('PNG also gets a second attempt before giving up', async () => {
    const { impl, stats } = observedSharp();
    const process = createBodyPhotoProcessor({ sharpImpl: impl, maxEncodedBytes: 10 });
    await assert.rejects(process(pngPhoto(await alphaPng())), (err) => err.statusCode === 413);
    assert.equal(stats.encodeCalls, 2);
  });

  it('does not resize: the output has the input dimensions', async () => {
    const process = createBodyPhotoProcessor();
    const result = await process(jpegPhoto(await phoneJpeg({ width: 96, height: 48 })));
    const meta = await sharp(result.buffer).metadata();
    assert.deepEqual([meta.width, meta.height], [96, 48]);
  });
});

describe('bodyPhoto processor: error classification (D28)', () => {
  /** Real sharp, except that `tamper` can break one method of each instance. */
  const tamperedSharp = (tamper) => (input, options) => tamper(sharp(input, options));
  const expect500 = (err) => err.statusCode === 500 && err.code === 'UPLOAD_FAILED';

  it('out of memory while encoding is 500 UPLOAD_FAILED and is logged', async () => {
    const impl = tamperedSharp((image) => {
      image.toBuffer = async () => {
        throw new Error('Vips: out of memory');
      };
      return image;
    });
    const process = createBodyPhotoProcessor({ sharpImpl: impl });
    const photo = jpegPhoto(await plainJpeg());
    const logged = await withCapturedErrors(() => assert.rejects(process(photo), expect500));
    assert.equal(logged.length, 1, 'the cause must be logged');
    assert.match(logged[0], /out of memory/);
  });

  it('out of memory while reading the header is 500 UPLOAD_FAILED', async () => {
    const impl = tamperedSharp((image) => {
      image.metadata = async () => {
        throw new Error('pixel buffer: out of memory');
      };
      return image;
    });
    const process = createBodyPhotoProcessor({ sharpImpl: impl });
    const photo = jpegPhoto(await plainJpeg());
    await withCapturedErrors(() => assert.rejects(process(photo), expect500));
  });

  it('a synchronous throw while building the pipeline is 500 UPLOAD_FAILED and is logged', async () => {
    const impl = tamperedSharp((image) => {
      image.toColourspace = () => {
        throw new Error('Expected valid colourspace');
      };
      return image;
    });
    const process = createBodyPhotoProcessor({ sharpImpl: impl });
    const photo = jpegPhoto(await plainJpeg());
    const logged = await withCapturedErrors(() => assert.rejects(process(photo), expect500));
    assert.equal(logged.length, 1);
  });

  it('any other decode failure is 400 INVALID_FILE_TYPE', async () => {
    const impl = tamperedSharp((image) => {
      image.toBuffer = async () => {
        throw new Error('VipsJpeg: premature end of JPEG image');
      };
      return image;
    });
    const process = createBodyPhotoProcessor({ sharpImpl: impl });
    await assert.rejects(
      process(jpegPhoto(await plainJpeg())),
      (err) => err.statusCode === 400 && err.code === 'INVALID_FILE_TYPE',
    );
  });

  it('a truncated JPEG is rejected by the real decoder with failOn: warning', async () => {
    const full = await noiseJpeg(400, 400, 80);
    const process = createBodyPhotoProcessor();
    await assert.rejects(
      process(jpegPhoto(full.subarray(0, Math.floor(full.length / 2)))),
      (err) => err.statusCode === 400 && err.code === 'INVALID_FILE_TYPE',
    );
  });
});

describe('bodyPhoto processor: one image at a time (D29)', () => {
  it('runs concurrent images strictly one after another, whole image per turn', async () => {
    const events = [];
    const { impl, stats } = observedSharp({
      delayMs: 15,
      onEvent: (buffer) => events.push(buffer),
    });
    // maxEncodedBytes 10 forces both attempts, so each image has metadata + 2 encodes = 3 operations.
    const process = createBodyPhotoProcessor({ sharpImpl: impl, maxEncodedBytes: 10 });
    const images = [
      await plainJpeg({ width: 40 }),
      await plainJpeg({ width: 48 }),
      await plainJpeg({ width: 56 }),
    ];
    const settled = await Promise.allSettled(images.map((buffer) => process(jpegPhoto(buffer))));

    assert.ok(settled.every((s) => s.status === 'rejected' && s.reason.statusCode === 413));
    assert.equal(stats.maxInFlight, 1);
    assert.equal(events.length, 9);
    const order = events.map((buffer) => images.indexOf(buffer));
    assert.deepEqual(order, [0, 0, 0, 1, 1, 1, 2, 2, 2], 'images must not interleave');
  });

  it('a failed image does not block or break the ones queued behind it', async () => {
    const process = createBodyPhotoProcessor();
    const broken = (await noiseJpeg(300, 300, 80)).subarray(0, 2000);
    const results = await Promise.allSettled([
      process(jpegPhoto(await plainJpeg())),
      process(jpegPhoto(broken)),
      process(jpegPhoto(await plainJpeg({ width: 48 }))),
      process(pngPhoto(await hugeFlatPng(7001, 10000))),
      process(pngPhoto(await alphaPng())),
    ]);
    assert.deepEqual(
      results.map((r) => (r.status === 'fulfilled' ? 'ok' : r.reason.code)),
      ['ok', 'INVALID_FILE_TYPE', 'ok', 'FILE_TOO_LARGE', 'ok'],
    );
  });
});
