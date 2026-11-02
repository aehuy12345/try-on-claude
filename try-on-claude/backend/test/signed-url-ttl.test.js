import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import './setup.js';
import { USER_ID } from './helpers.js';

const EXPECTED_TTL_SECONDS = 300;
const PHOTO_PATH = `${USER_ID}/1.jpg`;

const jsonResponse = (body) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

// Only this file stubs fetch (the global one is a guard from setup.js); it is restored in `after`.
describe('body photo signed URL lifetime', () => {
  const guard = globalThis.fetch;
  const signRequests = [];
  let getProfile;

  before(async () => {
    globalThis.fetch = async (input, init = {}) => {
      const url = typeof input === 'string' ? input : (input?.url ?? String(input));
      if (url.includes('/storage/v1/object/sign/')) {
        signRequests.push(JSON.parse(init.body));
        return jsonResponse({ signedURL: `/object/sign/body-photos/${PHOTO_PATH}?token=stub` });
      }
      if (url.includes('/rest/v1/profiles')) {
        return jsonResponse({
          id: USER_ID,
          email: 'a@example.com',
          role: 'user',
          display_name: null,
          height_cm: 170,
          weight_kg: 65,
          body_photo_path: PHOTO_PATH,
          updated_at: '2026-01-01T00:00:00Z',
        });
      }
      return guard(input, init);
    };
    ({ getProfile } = await import('../src/services/profile.service.js'));
  });

  after(() => {
    globalThis.fetch = guard;
  });

  it(`asks Storage for a ${EXPECTED_TTL_SECONDS} s signed URL`, async () => {
    const profile = await getProfile(USER_ID);
    assert.ok(profile.bodyPhotoUrl, 'expected a signed URL in the profile');
    assert.equal(signRequests.length, 1);
    assert.equal(signRequests[0].expiresIn, EXPECTED_TTL_SECONDS);
  });
});
