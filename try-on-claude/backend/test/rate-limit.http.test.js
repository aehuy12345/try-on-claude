import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { env } from '../src/config/env.js';
import { blockedFetchCalls } from './setup.js';
import {
  bearer,
  buildForm,
  createClient,
  jpegBuffer,
  signTestToken,
  startServer,
} from './helpers.js';

const LIMIT = 20;
const WINDOW_SECONDS = 600;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const LIMIT_MESSAGE =
  'Bạn đã lưu quá nhiều lần trong thời gian ngắn. Vui lòng thử lại sau 10 phút.';
// draft-8 policy item: name, q (quota), w (window in seconds), pk (partition key, hashed).
const POLICY_PATTERN = new RegExp(
  `^"[^"]+"; q=${LIMIT}; w=${WINDOW_SECONDS}; pk=:[A-Za-z0-9+/=]+:$`,
);

// The limiter keeps its counters in the process for the whole file, so every test uses its own user id.
// PUT requests here stop at validation or earlier, so they never reach Supabase; the GET case handles its own calls.
describe('PUT /api/user/profile: rate limit (PRD D21-D24)', () => {
  let server;
  let request;

  before(async () => {
    server = await startServer();
    request = createClient(server.baseUrl);
  });

  after(async () => {
    await server.close();
    assert.deepEqual(blockedFetchCalls, [], 'no case here may reach Supabase');
  });

  const newUser = () => bearer(signTestToken({ sub: randomUUID() }));
  const put = (headers, body) => request('/api/user/profile', { method: 'PUT', headers, body });
  // A wrong height fails validation: the request is a failure that must still be counted (D22).
  const failingSave = (auth) => put(auth, buildForm({ heightCm: 'abc', weightKg: '65' }));

  async function exhaust(auth, times = LIMIT) {
    for (let i = 0; i < times; i += 1) {
      const res = await failingSave(auth);
      assert.equal(res.status, 400, `request ${i + 1} should still reach validation: ${res.text}`);
    }
  }

  function assertTooManyRequests(res) {
    assert.equal(res.status, 429, `expected 429, got ${res.status}: ${res.text}`);
    assert.deepEqual(res.json, { error: { message: LIMIT_MESSAGE, code: 'TOO_MANY_REQUESTS' } });
    assert.equal(res.json.error.stack, undefined);
    assert.ok(!res.text.includes('stack'));
  }

  describe('threshold', () => {
    it('lets the first 20 requests through to validation and blocks the 21st', async () => {
      const auth = newUser();
      await exhaust(auth);
      assertTooManyRequests(await failingSave(auth));
    });

    it('keeps blocking after the 21st request', async () => {
      const auth = newUser();
      await exhaust(auth);
      assertTooManyRequests(await failingSave(auth));
      assertTooManyRequests(await failingSave(auth));
    });

    it('counts requests without a file', async () => {
      const auth = newUser();
      for (let i = 0; i < LIMIT; i += 1) {
        const res = await put(auth, buildForm({ weightKg: '65' }));
        assert.equal(res.json?.error?.code, 'INVALID_HEIGHT');
      }
      assertTooManyRequests(await put(auth, buildForm({ weightKg: '65' })));
    });

    it('counts requests that carry a file and fail', async () => {
      const auth = newUser();
      const withFile = () =>
        put(auth, buildForm({ heightCm: 'abc' }, [{ name: 'bodyPhoto', bytes: jpegBuffer(1024) }]));
      for (let i = 0; i < LIMIT; i += 1) assert.equal((await withFile()).status, 400);
      assertTooManyRequests(await withFile());
    });
  });

  describe('a blocked request never reaches multer', () => {
    it('a malformed multipart body is 429, not 400 INVALID_UPLOAD', async () => {
      const auth = newUser();
      const malformed = () =>
        put(
          { ...auth, 'Content-Type': 'multipart/form-data; boundary=xyz' },
          '--xyz\r\nContent-Disposition: form-data; name="heightCm"\r\n\r\n170',
        );
      assert.equal((await malformed()).json?.error?.code, 'INVALID_UPLOAD');
      await exhaust(auth, LIMIT - 1);
      assertTooManyRequests(await malformed());
    });

    it('a file over 5 MB is 429, not 413 FILE_TOO_LARGE', async () => {
      const auth = newUser();
      await exhaust(auth);
      const form = buildForm({ heightCm: '170', weightKg: '65' }, [
        { name: 'bodyPhoto', bytes: jpegBuffer(MAX_PHOTO_BYTES) },
      ]);
      assertTooManyRequests(await put(auth, form));
    });

    it('a file over 5 MB is still 413 while the user is within the limit', async () => {
      const form = buildForm({ heightCm: '170', weightKg: '65' }, [
        { name: 'bodyPhoto', bytes: jpegBuffer(MAX_PHOTO_BYTES) },
      ]);
      const res = await put(newUser(), form);
      assert.equal(res.json?.error?.code, 'FILE_TOO_LARGE');
    });
  });

  describe('what is not counted', () => {
    it('415 does not use up the allowance', async () => {
      const auth = newUser();
      for (let i = 0; i < LIMIT + 5; i += 1) {
        const res = await put({ ...auth, 'Content-Type': 'text/plain' }, 'hello');
        assert.equal(res.status, 415);
      }
      await exhaust(auth);
      assertTooManyRequests(await failingSave(auth));
    });

    it('401 does not use up the allowance', async () => {
      const auth = newUser();
      for (let i = 0; i < LIMIT + 5; i += 1) {
        const res = await put({}, buildForm({ heightCm: 'abc' }));
        assert.equal(res.status, 401);
      }
      await exhaust(auth);
    });

    it('an exhausted user still gets 401 without a token (authentication comes first)', async () => {
      await exhaust(newUser());
      const res = await put({}, buildForm({ heightCm: 'abc' }));
      assert.equal(res.status, 401);
    });

    it('an exhausted user still gets 415 for a wrong Content-Type', async () => {
      const auth = newUser();
      await exhaust(auth);
      const res = await put({ ...auth, 'Content-Type': 'text/plain' }, 'hello');
      assert.equal(res.status, 415);
    });
  });

  describe('per user, PUT only', () => {
    it('user B is unaffected when user A is blocked', async () => {
      const userA = newUser();
      const userB = newUser();
      await exhaust(userA);
      assertTooManyRequests(await failingSave(userA));
      const res = await failingSave(userB);
      assert.equal(res.status, 400);
      assert.equal(res.json.error.code, 'INVALID_HEIGHT');
    });

    it('GET /profile is not limited for a blocked user', async () => {
      const auth = newUser();
      await exhaust(auth);
      assertTooManyRequests(await failingSave(auth));
      // GET reaches the service, so the fetch guard fails it with a non-429 error. Only the limiter's
      // answer matters here; the guarded calls are removed so the check in `after` stays meaningful.
      const before = blockedFetchCalls.length;
      const res = await request('/api/user/profile', { headers: auth });
      assert.notEqual(res.status, 429);
      assert.notEqual(res.json?.error?.code, 'TOO_MANY_REQUESTS');
      const calls = blockedFetchCalls.splice(before);
      assert.ok(calls.length > 0, 'GET must have reached the service');
      assert.ok(calls.every((url) => url.includes('/rest/v1/profiles?')));
    });
  });

  describe('429 response headers', () => {
    it('carries Retry-After, draft-8 RateLimit headers, no-store and CORS for the frontend', async () => {
      const auth = newUser();
      await exhaust(auth);
      const res = await put(
        { ...auth, Origin: env.clientUrl },
        buildForm({ heightCm: 'abc', weightKg: '65' }),
      );
      assertTooManyRequests(res);

      const retryAfter = Number(res.headers.get('retry-after'));
      assert.ok(Number.isInteger(retryAfter) && retryAfter > 0 && retryAfter <= WINDOW_SECONDS);
      assert.match(res.headers.get('ratelimit-policy'), POLICY_PATTERN);
      const rateLimit = res.headers.get('ratelimit');
      assert.match(rateLimit, /^"[^"]+"; r=0; t=\d+$/);
      const reset = Number(/; t=(\d+)$/.exec(rateLimit)[1]);
      assert.ok(reset > 0 && reset <= WINDOW_SECONDS);
      assert.equal(res.headers.get('x-ratelimit-limit'), null, 'legacy headers are off');
      assert.equal(res.headers.get('cache-control'), 'no-store');
      assert.equal(res.headers.get('access-control-allow-origin'), env.clientUrl);
    });

    it('a request inside the limit already shows 20 and 600 in the policy header', async () => {
      const res = await failingSave(newUser());
      assert.equal(res.status, 400);
      assert.match(res.headers.get('ratelimit-policy'), POLICY_PATTERN);
      assert.match(res.headers.get('ratelimit'), /^"[^"]+"; r=19; t=\d+$/);
    });
  });
});
