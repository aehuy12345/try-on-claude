import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { blockedFetchCalls, TEST_JWT_SECRET } from './setup.js';
import { bearer, buildForm, createClient, startServer, USER_ID } from './helpers.js';

const b64url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const unsigned = (payload) => `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url(payload)}.`;
const exp = () => Math.floor(Date.now() / 1000) + 3600;

// Tokens that pass or nearly pass signature checks but carry content the API must refuse with 401.
const WEIRD_TOKENS = {
  'sub is not a UUID': () => jwt.sign({ sub: 'not-a-uuid' }, TEST_JWT_SECRET, { expiresIn: '1h' }),
  'sub is a UUID with trailing junk': () =>
    jwt.sign({ sub: `${USER_ID}-x` }, TEST_JWT_SECRET, { expiresIn: '1h' }),
  'sub is an SQL-ish string': () =>
    jwt.sign({ sub: "1' or '1'='1" }, TEST_JWT_SECRET, { expiresIn: '1h' }),
  'sub is missing': () => jwt.sign({ role: 'admin' }, TEST_JWT_SECRET, { expiresIn: '1h' }),
  'sub is a number': () => jwt.sign({ sub: 12345 }, TEST_JWT_SECRET, { expiresIn: '1h' }),
  'sub is an array of a UUID': () =>
    jwt.sign({ sub: [USER_ID] }, TEST_JWT_SECRET, { expiresIn: '1h' }),
  'signed with another secret': () =>
    jwt.sign({ sub: USER_ID }, 'some-other-secret', { expiresIn: '1h' }),
  'alg is none': () => unsigned({ sub: USER_ID, exp: exp() }),
  'alg is HS384 with the right secret': () =>
    jwt.sign({ sub: USER_ID }, TEST_JWT_SECRET, { algorithm: 'HS384', expiresIn: '1h' }),
  'alg is HS512 with the right secret': () =>
    jwt.sign({ sub: USER_ID }, TEST_JWT_SECRET, { algorithm: 'HS512', expiresIn: '1h' }),
};

describe('token with valid structure but unexpected content', () => {
  let server;
  let request;

  before(async () => {
    server = await startServer();
    request = createClient(server.baseUrl);
  });

  after(async () => {
    await server.close();
  });

  function assertTokenInvalid(res) {
    assert.equal(res.status, 401, `expected 401, got ${res.status}: ${res.text}`);
    assert.equal(res.json?.error?.code, 'TOKEN_INVALID');
    assert.equal(res.headers.get('cache-control'), 'no-store');
  }

  for (const [label, makeToken] of Object.entries(WEIRD_TOKENS)) {
    it(`GET rejects a token where ${label}`, async () => {
      assertTokenInvalid(await request('/api/user/profile', { headers: bearer(makeToken()) }));
    });

    it(`PUT rejects a token where ${label}`, async () => {
      const res = await request('/api/user/profile', {
        method: 'PUT',
        headers: bearer(makeToken()),
        body: buildForm({ heightCm: '170', weightKg: '65' }),
      });
      assertTokenInvalid(res);
    });
  }

  it('GET without a token is 401 AUTH_REQUIRED', async () => {
    const res = await request('/api/user/profile');
    assert.equal(res.status, 401);
    assert.equal(res.json?.error?.code, 'AUTH_REQUIRED');
  });

  it('made no outbound fetch calls (so never reached Supabase)', () => {
    assert.deepEqual(blockedFetchCalls, []);
  });
});
