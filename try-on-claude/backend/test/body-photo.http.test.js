import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { blockedFetchCalls } from './setup.js';
import {
  PRIVATE_MARKERS,
  alphaPng,
  bearer,
  buildForm,
  createClient,
  exifHasGps,
  hugeFlatPng,
  jpegBuffer,
  noiseJpeg,
  phoneJpeg,
  pixelAt,
  plainJpeg,
  pngWithText,
  randomPalettePng,
  rawPixels,
  signTestToken,
  startServer,
  withTrailingBytes,
} from './helpers.js';

// Sprint 2 Task 7 (PRD D25-D29): the server decodes and re-encodes every body photo before Storage.
// Supabase is replaced by a recorder: it answers the few calls the profile update makes and keeps
// what was uploaded, so the tests inspect the bytes that would reach Storage.

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const NOT_READABLE = 'Không đọc được ảnh. Vui lòng chọn ảnh khác.';
const TOO_LARGE =
  'Ảnh quá lớn để xử lý. Vui lòng chọn ảnh có độ phân giải hoặc dung lượng nhỏ hơn.';
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('PUT /api/user/profile: body photo processing (D25-D29)', () => {
  const guard = globalThis.fetch;
  /** Every request the app made to the fake Supabase, in order. */
  let calls = [];
  let server;
  let request;

  before(async () => {
    globalThis.fetch = async (input, init = {}) => {
      const url = typeof input === 'string' ? input : (input?.url ?? String(input));
      const method = (init.method ?? 'GET').toUpperCase();
      if (url.includes('/rest/v1/profiles') && method === 'GET') {
        calls.push({ kind: 'select' });
        return json({ body_photo_path: null });
      }
      if (url.includes('/storage/v1/object/body-photos/') && method === 'POST') {
        const body = Buffer.from(await new Response(init.body).arrayBuffer());
        const path = decodeURIComponent(url.split('/storage/v1/object/body-photos/')[1]);
        const contentType = new Headers(init.headers).get('content-type');
        calls.push({ kind: 'upload', path, body, contentType });
        return json({ Key: `body-photos/${path}` });
      }
      if (url.includes('/rest/v1/profiles') && method === 'PATCH') {
        calls.push({ kind: 'update' });
        return json({
          id: randomUUID(),
          email: 'a@example.com',
          role: 'user',
          display_name: null,
          height_cm: 170,
          weight_kg: 65,
          body_photo_path: 'x/1.jpg',
          updated_at: '2026-01-01T00:00:00Z',
        });
      }
      if (url.includes('/storage/v1/object/sign/')) {
        return json({ signedURL: '/object/sign/body-photos/x/1.jpg?token=stub' });
      }
      return guard(input, init);
    };
    server = await startServer();
    request = createClient(server.baseUrl);
  });

  after(async () => {
    globalThis.fetch = guard;
    await server.close();
    assert.deepEqual(blockedFetchCalls, [], 'only the fake Supabase calls are expected');
  });

  // Fresh user per request: the profile limiter keeps counters for the whole file.
  const save = (photo, fields = { heightCm: '170', weightKg: '65' }) =>
    request('/api/user/profile', {
      method: 'PUT',
      headers: bearer(signTestToken({ sub: randomUUID() })),
      body: buildForm(fields, photo ? [{ name: 'bodyPhoto', bytes: photo }] : []),
    });

  const uploads = () => calls.filter((c) => c.kind === 'upload');

  /** Save a photo, expect success and return the single uploaded object. */
  async function saveOk(photo) {
    calls = [];
    const res = await save(photo);
    assert.equal(res.status, 200, res.text);
    assert.equal(uploads().length, 1);
    return uploads()[0];
  }

  async function saveRejected(photo, status, code, message) {
    calls = [];
    const res = await save(photo);
    assert.equal(res.status, status, res.text);
    assert.equal(res.json.error.code, code);
    if (message) assert.equal(res.json.error.message, message);
    assert.deepEqual(calls, [], 'a rejected photo must not touch Supabase (D10)');
    return res;
  }

  describe('metadata is removed (D25)', () => {
    it('drops EXIF, GPS, ICC and XMP from a phone JPEG', async () => {
      const original = await phoneJpeg();
      const before = await sharp(original).metadata();
      // Make sure the fixture really carries what we claim to remove.
      assert.ok(exifHasGps(before.exif) && before.icc && before.xmp);
      assert.ok(original.includes(PRIVATE_MARKERS.make) && original.includes(PRIVATE_MARKERS.xmp));

      const stored = await saveOk(original);
      const after = await sharp(stored.body).metadata();
      assert.equal(after.exif, undefined);
      assert.equal(after.icc, undefined);
      assert.equal(after.xmp, undefined);
      assert.equal(after.hasProfile, false);
      assert.equal(after.orientation, undefined);
      const markers = [PRIVATE_MARKERS.make, PRIVATE_MARKERS.xmp, 'SecretSoftware', 'Exif'];
      for (const marker of [...markers, 'ICC_PROFILE', 'xmpmeta']) {
        assert.ok(!stored.body.includes(marker), `${marker} must not be in the stored bytes`);
      }
      assert.equal(stored.contentType, 'image/jpeg');
      assert.match(stored.path, /\.jpg$/);
      assert.equal(stored.body[0], 0xff);
    });

    it('stores the re-encoded buffer, not the original upload', async () => {
      const original = await phoneJpeg();
      const stored = await saveOk(original);
      assert.notDeepEqual(stored.body, original);
    });

    it('applies the EXIF orientation to the pixels and removes the tag', async () => {
      // Stored 64x32 with the green block at the top-left; orientation 6 = display rotated 90 deg clockwise.
      const stored = await saveOk(await phoneJpeg({ orientation: 6 }));
      const meta = await sharp(stored.body).metadata();
      assert.equal(meta.orientation, undefined);
      assert.deepEqual([meta.width, meta.height], [32, 64]);

      const pixels = await rawPixels(stored.body);
      // A clockwise rotation moves the top-left corner to the top-right corner.
      const [r, g, b] = pixelAt(pixels, 27, 4);
      assert.ok(g > 200 && r < 80 && b < 80, `expected green at top-right, got ${[r, g, b]}`);
      const [r2, g2] = pixelAt(pixels, 4, 4);
      assert.ok(r2 > 200 && g2 < 80, `expected red at top-left, got ${[r2, g2]}`);
      const [r3, g3] = pixelAt(pixels, 4, 60);
      assert.ok(r3 > 200 && g3 < 80, `expected red at the bottom, got ${[r3, g3]}`);
    });

    it('keeps an image without orientation unrotated', async () => {
      const stored = await saveOk(await phoneJpeg());
      const meta = await sharp(stored.body).metadata();
      assert.deepEqual([meta.width, meta.height], [64, 32]);
      const [r, g] = pixelAt(await rawPixels(stored.body), 4, 4);
      assert.ok(g > 200 && r < 80, 'green block stays at the top-left');
    });

    it('converts a Display P3 JPEG to sRGB and drops the profile', async () => {
      const stored = await saveOk(await phoneJpeg());
      const meta = await sharp(stored.body).metadata();
      assert.equal(meta.space, 'srgb');
      assert.equal(meta.icc, undefined);
      // P3 red (255,0,0) is outside sRGB: it must come out as saturated sRGB red, not wash out.
      const [r, g, b] = pixelAt(await rawPixels(stored.body), 60, 28);
      assert.ok(r > 240 && g < 40 && b < 40, `got ${[r, g, b]}`);
    });

    it('converts a CMYK JPEG to 3-channel sRGB', async () => {
      const cmyk = await sharp({
        create: { width: 16, height: 16, channels: 3, background: '#336699' },
      })
        .toColourspace('cmyk')
        .jpeg()
        .toBuffer();
      assert.equal((await sharp(cmyk).metadata()).space, 'cmyk');
      const stored = await saveOk(cmyk);
      const meta = await sharp(stored.body).metadata();
      assert.equal(meta.space, 'srgb');
      assert.equal(meta.channels, 3);
    });

    it('removes bytes appended after the end of a JPEG', async () => {
      const stored = await saveOk(withTrailingBytes(await plainJpeg()));
      assert.ok(!stored.body.includes(PRIVATE_MARKERS.trailing));
    });
  });

  describe('PNG', () => {
    it('keeps the alpha channel and stays a PNG', async () => {
      const stored = await saveOk(await alphaPng());
      assert.equal(stored.contentType, 'image/png');
      assert.match(stored.path, /\.png$/);
      assert.deepEqual([...stored.body.subarray(0, 8)], [...PNG_MAGIC]);

      const meta = await sharp(stored.body).metadata();
      assert.equal(meta.format, 'png');
      assert.equal(meta.hasAlpha, true);
      assert.equal(meta.exif, undefined);
      assert.ok(!stored.body.includes(PRIVATE_MARKERS.make));
      const pixels = await rawPixels(stored.body);
      assert.deepEqual(pixelAt(pixels, 2, 2), [0, 0, 255, 255]);
      assert.deepEqual(pixelAt(pixels, 13, 2), [255, 0, 0, 128]);
    });

    it('drops tEXt chunks', async () => {
      const original = await pngWithText();
      assert.ok(original.includes(PRIVATE_MARKERS.pngText));
      const stored = await saveOk(original);
      assert.ok(!stored.body.includes(PRIVATE_MARKERS.pngText));
      assert.ok(!stored.body.includes('tEXt'));
    });

    it('removes bytes appended after IEND', async () => {
      const stored = await saveOk(withTrailingBytes(await alphaPng()));
      assert.ok(!stored.body.includes(PRIVATE_MARKERS.trailing));
    });
  });

  describe('files that match the magic bytes but cannot be decoded (D28, D10)', () => {
    const halfOf = (buffer) => buffer.subarray(0, Math.floor(buffer.length / 2));

    it('truncated JPEG is 400 INVALID_FILE_TYPE with the new message', async () => {
      const full = await noiseJpeg(400, 400, 80);
      await saveRejected(halfOf(full), 400, 'INVALID_FILE_TYPE', NOT_READABLE);
    });

    it('truncated PNG is 400 INVALID_FILE_TYPE', async () => {
      const full = await randomPalettePng(300, 300);
      await saveRejected(halfOf(full), 400, 'INVALID_FILE_TYPE', NOT_READABLE);
    });

    it('a PNG cut inside its header is 400 INVALID_FILE_TYPE', async () => {
      const full = await alphaPng();
      await saveRejected(full.subarray(0, 20), 400, 'INVALID_FILE_TYPE', NOT_READABLE);
    });

    it('a file that is only the JPEG magic bytes is 400 INVALID_FILE_TYPE', async () => {
      await saveRejected(jpegBuffer(), 400, 'INVALID_FILE_TYPE', NOT_READABLE);
    });

    it('a file that is only the PNG magic bytes is 400 INVALID_FILE_TYPE', async () => {
      await saveRejected(PNG_MAGIC, 400, 'INVALID_FILE_TYPE', NOT_READABLE);
    });

    it('a JPEG header followed by garbage is 400 INVALID_FILE_TYPE', async () => {
      const header = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const garbage = Buffer.concat([header, Buffer.alloc(2000, 0x41)]);
      await saveRejected(garbage, 400, 'INVALID_FILE_TYPE', NOT_READABLE);
    });
  });

  describe('size limits (D26, D27)', () => {
    it('more than 70 000 000 pixels is 413 FILE_TOO_LARGE and writes nothing', async () => {
      const huge = await hugeFlatPng(7001, 10000);
      assert.ok(huge.length < MAX_PHOTO_BYTES, 'only the pixel count is huge, not the file');
      await saveRejected(huge, 413, 'FILE_TOO_LARGE', TOO_LARGE);
    });

    it('an image over the default sharp pixel limit (268 million) is also 413, not 400', async () => {
      const huge = await hugeFlatPng(20000, 15000);
      await saveRejected(huge, 413, 'FILE_TOO_LARGE', TOO_LARGE);
    });

    it('exactly 70 000 000 pixels is accepted', async () => {
      const stored = await saveOk(await hugeFlatPng(7000, 10000));
      const meta = await sharp(stored.body, { limitInputPixels: false }).metadata();
      assert.deepEqual([meta.width, meta.height], [7000, 10000]);
    });

    it('a near-5 MB palette PNG that grows when re-encoded is 413, not 500', async () => {
      const original = await randomPalettePng(2400, 2000);
      assert.ok(original.length > 4 * 1024 * 1024 && original.length <= MAX_PHOTO_BYTES);
      await saveRejected(original, 413, 'FILE_TOO_LARGE', TOO_LARGE);
    });
  });

  describe('error order (PRD 4.4)', () => {
    it('a field error comes before an unreadable image and before the pixel limit', async () => {
      for (const photo of [jpegBuffer(), await hugeFlatPng(7001, 10000)]) {
        calls = [];
        const res = await save(photo, { heightCm: 'abc', weightKg: '65' });
        assert.equal(res.status, 400);
        assert.equal(res.json.error.code, 'INVALID_HEIGHT');
        assert.deepEqual(calls, []);
      }
    });

    it('a wrong file type is still reported by magic bytes with the old message', async () => {
      calls = [];
      const res = await save(Buffer.from('plain text'));
      assert.equal(res.json.error.code, 'INVALID_FILE_TYPE');
      assert.equal(res.json.error.message, 'Ảnh phải ở định dạng JPG hoặc PNG.');
      assert.deepEqual(calls, []);
    });

    it('a save without a photo never runs image processing', async () => {
      calls = [];
      const res = await save(null);
      assert.equal(res.status, 200, res.text);
      assert.deepEqual(uploads(), []);
    });
  });

  describe('one image at a time (D29)', () => {
    it('concurrent saves all finish and a broken image does not block the others', async () => {
      calls = [];
      const good = await phoneJpeg({ orientation: 6 });
      const broken = (await noiseJpeg(300, 300, 80)).subarray(0, 3000);
      const results = await Promise.all([
        save(good),
        save(broken),
        save(good),
        save(await alphaPng()),
      ]);
      assert.deepEqual(
        results.map((r) => r.status),
        [200, 400, 200, 200],
      );
      assert.equal(results[1].json.error.code, 'INVALID_FILE_TYPE');
      assert.equal(uploads().length, 3);
    });
  });
});
