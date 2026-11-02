import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { blockedFetchCalls } from './setup.js';
import { createClient, startServer } from './helpers.js';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const BROKEN_JSON = '{"broken":';
const OVER_1MB_JSON = JSON.stringify({ filler: 'x'.repeat(1024 * 1024 + 1024) });

// JSON is parsed only under /api/auth (D20). Every case stops before the service layer, so no Supabase call.
describe('JSON body parsing scope (D20)', () => {
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

  const send = (path, { method = 'POST', headers = JSON_HEADERS, body } = {}) =>
    request(path, { method, headers, body });

  const assertError = (res, status, code) => {
    assert.equal(res.status, status);
    assert.equal(res.json?.error?.code, code);
  };

  describe('/api/auth keeps its JSON parser', () => {
    for (const route of ['login', 'register']) {
      it(`${route}: malformed JSON is 400 INVALID_JSON`, async () => {
        assertError(await send(`/api/auth/${route}`, { body: BROKEN_JSON }), 400, 'INVALID_JSON');
      });

      it(`${route}: body over 1 MB is 413 PAYLOAD_TOO_LARGE`, async () => {
        assertError(
          await send(`/api/auth/${route}`, { body: OVER_1MB_JSON }),
          413,
          'PAYLOAD_TOO_LARGE',
        );
      });
    }

    it('login: valid JSON is parsed and reaches field validation', async () => {
      const res = await send('/api/auth/login', { body: JSON.stringify({ email: 'a@b.co' }) });
      assertError(res, 400, 'VALIDATION_ERROR');
    });

    it('register: valid JSON is parsed and reaches field validation', async () => {
      const res = await send('/api/auth/register', {
        body: JSON.stringify({ email: 'not-an-email', password: 'abcdefg1' }),
      });
      assertError(res, 400, 'INVALID_EMAIL');
    });

    it('login: no Content-Type still reaches field validation', async () => {
      assertError(await send('/api/auth/login', { headers: {} }), 400, 'VALIDATION_ERROR');
    });

    it('unknown /api/auth route with malformed JSON is 400 INVALID_JSON (unchanged)', async () => {
      assertError(
        await send('/api/auth/khong-ton-tai', { body: BROKEN_JSON }),
        400,
        'INVALID_JSON',
      );
    });

    it('unknown /api/auth route with an oversized body is 413 (unchanged)', async () => {
      assertError(
        await send('/api/auth/khong-ton-tai', { body: OVER_1MB_JSON }),
        413,
        'PAYLOAD_TOO_LARGE',
      );
    });

    it('unknown /api/auth route without a body is 404 NOT_FOUND', async () => {
      assertError(await send('/api/auth/khong-ton-tai', { headers: {} }), 404, 'NOT_FOUND');
    });
  });

  describe('outside /api/auth the body is never parsed', () => {
    for (const path of ['/api/khong-ton-tai', '/api/user/khong-ton-tai', '/khong-ton-tai']) {
      it(`POST ${path} with malformed JSON is 404 NOT_FOUND`, async () => {
        assertError(await send(path, { body: BROKEN_JSON }), 404, 'NOT_FOUND');
      });

      it(`POST ${path} with a body over 1 MB is 404 NOT_FOUND`, async () => {
        assertError(await send(path, { body: OVER_1MB_JSON }), 404, 'NOT_FOUND');
      });
    }
  });
});
