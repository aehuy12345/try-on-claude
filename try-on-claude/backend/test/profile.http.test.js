import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { env } from '../src/config/env.js';
import { blockedFetchCalls, FAKE_SUPABASE_URL } from './setup.js';
import {
  bearer,
  buildForm,
  createClient,
  jpegBuffer,
  signTestToken,
  startServer,
} from './helpers.js';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

// Every case here must stop before the service layer (which would call Supabase), so the guard stays unused.
describe('PUT /api/user/profile: error order (PRD 4.4)', () => {
  let server;
  let request;
  let auth;

  before(async () => {
    server = await startServer();
    request = createClient(server.baseUrl);
    auth = bearer(signTestToken());
  });

  after(async () => {
    await server.close();
  });

  const put = (headers, body) => request('/api/user/profile', { method: 'PUT', headers, body });

  function assertError(res, status, code) {
    assert.equal(res.status, status, `expected ${status}, got ${res.status}: ${res.text}`);
    assert.equal(res.json?.error?.code, code);
    assert.equal(typeof res.json.error.message, 'string');
    assert.ok(res.json.error.message.length > 0);
    assert.deepEqual(Object.keys(res.json), ['error']);
    assert.equal(res.headers.get('cache-control'), 'no-store');
  }

  it('runs against fake credentials only', () => {
    assert.equal(env.supabaseUrl, FAKE_SUPABASE_URL);
    assert.equal(env.nodeEnv, 'test');
    assert.equal(env.supabaseServiceRoleKey, 'fake-service-role-key-for-tests');
  });

  describe('authentication comes first', () => {
    it('GET without a token is 401 AUTH_REQUIRED', async () => {
      assertError(await request('/api/user/profile'), 401, 'AUTH_REQUIRED');
    });

    it('PUT without a token is 401 AUTH_REQUIRED before the Content-Type check', async () => {
      const res = await put({ 'Content-Type': 'text/plain' }, 'hello');
      assertError(res, 401, 'AUTH_REQUIRED');
    });

    it('PUT without a token is 401 before field errors', async () => {
      assertError(await put({}, buildForm({ heightCm: 'abc' })), 401, 'AUTH_REQUIRED');
    });

    it('PUT without a token is 401 before FILE_TOO_LARGE', async () => {
      const form = buildForm({}, [{ name: 'bodyPhoto', bytes: jpegBuffer(MAX_PHOTO_BYTES) }]);
      assertError(await put({}, form), 401, 'AUTH_REQUIRED');
    });

    it('rejects a malformed Authorization header', async () => {
      assertError(await put({ Authorization: 'Basic abc' }, buildForm()), 401, 'AUTH_REQUIRED');
    });

    it('rejects a garbage token with TOKEN_INVALID', async () => {
      const res = await put(bearer('not.a.jwt'), buildForm());
      assertError(res, 401, 'TOKEN_INVALID');
    });

    it('rejects an expired token with TOKEN_EXPIRED', async () => {
      const expired = signTestToken(undefined, { expiresIn: -60 });
      assertError(await put(bearer(expired), buildForm()), 401, 'TOKEN_EXPIRED');
    });

    it('PUT without a token and with malformed JSON is 401', async () => {
      const res = await put({ 'Content-Type': 'application/json' }, '{"broken":');
      assertError(res, 401, 'AUTH_REQUIRED');
    });

    it('PUT without a token and with a JSON body over 1 MB is 401', async () => {
      const big = JSON.stringify({ filler: 'x'.repeat(1024 * 1024 + 1024) });
      const res = await put({ 'Content-Type': 'application/json' }, big);
      assertError(res, 401, 'AUTH_REQUIRED');
    });
  });

  describe('Content-Type comes second', () => {
    it('plain text is 415 before field errors', async () => {
      const res = await put({ ...auth, 'Content-Type': 'text/plain' }, 'heightCm=abc');
      assertError(res, 415, 'UNSUPPORTED_MEDIA_TYPE');
    });

    it('urlencoded is 415', async () => {
      const res = await put(
        { ...auth, 'Content-Type': 'application/x-www-form-urlencoded' },
        'heightCm=170&weightKg=65',
      );
      assertError(res, 415, 'UNSUPPORTED_MEDIA_TYPE');
    });

    it('valid JSON is 415', async () => {
      const res = await put(
        { ...auth, 'Content-Type': 'application/json' },
        JSON.stringify({ heightCm: '170', weightKg: '65' }),
      );
      assertError(res, 415, 'UNSUPPORTED_MEDIA_TYPE');
    });

    it('no body and no Content-Type is 415', async () => {
      assertError(await put(auth), 415, 'UNSUPPORTED_MEDIA_TYPE');
    });

    it('JSON with a malformed body is 415', async () => {
      const res = await put({ ...auth, 'Content-Type': 'application/json' }, '{"broken":');
      assertError(res, 415, 'UNSUPPORTED_MEDIA_TYPE');
    });

    it('JSON body over 1 MB is 415', async () => {
      const big = JSON.stringify({ filler: 'x'.repeat(1024 * 1024 + 1024) });
      const res = await put({ ...auth, 'Content-Type': 'application/json' }, big);
      assertError(res, 415, 'UNSUPPORTED_MEDIA_TYPE');
    });
  });

  describe('multipart parsing comes third', () => {
    it('file over 5 MB is 413 FILE_TOO_LARGE, before field errors', async () => {
      const form = buildForm({ heightCm: 'abc', weightKg: 'abc', displayName: 'x'.repeat(51) }, [
        { name: 'bodyPhoto', bytes: jpegBuffer(MAX_PHOTO_BYTES) },
      ]);
      assertError(await put(auth, form), 413, 'FILE_TOO_LARGE');
    });

    it('a file of exactly 5 242 880 bytes is not rejected as too large', async () => {
      // The height is wrong on purpose so the request stops at the field check, never reaching the service.
      const bytes = jpegBuffer(MAX_PHOTO_BYTES - jpegBuffer().length);
      assert.equal(bytes.length, MAX_PHOTO_BYTES);
      const form = buildForm({ heightCm: 'abc', weightKg: '65' }, [{ name: 'bodyPhoto', bytes }]);
      assertError(await put(auth, form), 400, 'INVALID_HEIGHT');
    });

    it('a wrongly named file part is 400 INVALID_UPLOAD', async () => {
      const form = buildForm({ heightCm: 'abc' }, [{ name: 'avatar', bytes: jpegBuffer() }]);
      assertError(await put(auth, form), 400, 'INVALID_UPLOAD');
    });

    it('several files are 400 INVALID_UPLOAD', async () => {
      const form = buildForm({ heightCm: 'abc' }, [
        { name: 'bodyPhoto', bytes: jpegBuffer() },
        { name: 'bodyPhoto', bytes: jpegBuffer() },
      ]);
      assertError(await put(auth, form), 400, 'INVALID_UPLOAD');
    });

    it('a malformed multipart body is 400 INVALID_UPLOAD', async () => {
      const res = await put(
        { ...auth, 'Content-Type': 'multipart/form-data; boundary=xyz' },
        '--xyz\r\nContent-Disposition: form-data; name="heightCm"\r\n\r\n170',
      );
      assertError(res, 400, 'INVALID_UPLOAD');
    });

    it('a multipart request without a boundary is 400 INVALID_UPLOAD', async () => {
      const res = await put({ ...auth, 'Content-Type': 'multipart/form-data' }, 'garbage');
      assertError(res, 400, 'INVALID_UPLOAD');
    });
  });

  describe('field checks run in order: displayName, heightCm, weightKg, file type', () => {
    const textFile = [{ name: 'bodyPhoto', bytes: Buffer.from('not an image'), filename: 'a.png' }];
    const long = 'x'.repeat(51);

    it('displayName is checked before heightCm, weightKg and file type', async () => {
      const form = buildForm({ displayName: long, heightCm: 'abc', weightKg: 'abc' }, textFile);
      assertError(await put(auth, form), 400, 'INVALID_DISPLAY_NAME');
    });

    it('heightCm is checked before weightKg and file type', async () => {
      const form = buildForm({ heightCm: 'abc', weightKg: 'abc' }, textFile);
      assertError(await put(auth, form), 400, 'INVALID_HEIGHT');
    });

    it('weightKg is checked before file type', async () => {
      const form = buildForm({ heightCm: '170', weightKg: 'abc' }, textFile);
      assertError(await put(auth, form), 400, 'INVALID_WEIGHT');
    });

    it('a missing heightCm is INVALID_HEIGHT', async () => {
      assertError(await put(auth, buildForm({ weightKg: '65' })), 400, 'INVALID_HEIGHT');
    });

    it('file type is checked last, from magic bytes and not the claimed type', async () => {
      const form = buildForm({ heightCm: '170', weightKg: '65' }, textFile);
      assertError(await put(auth, form), 400, 'INVALID_FILE_TYPE');
    });

    it('an empty file is INVALID_FILE_TYPE', async () => {
      const form = buildForm({ heightCm: '170', weightKg: '65' }, [
        { name: 'bodyPhoto', bytes: Buffer.alloc(0) },
      ]);
      assertError(await put(auth, form), 400, 'INVALID_FILE_TYPE');
    });
  });

  it('made no outbound fetch calls', () => {
    assert.deepEqual(blockedFetchCalls, []);
  });
});
