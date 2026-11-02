import { once } from 'node:events';
import jwt from 'jsonwebtoken';
import { TEST_JWT_SECRET, realFetch } from './setup.js';

export const USER_ID = '11111111-2222-4333-8444-555555555555';

export const signTestToken = (payload = { sub: USER_ID }, options = { expiresIn: '1h' }) =>
  jwt.sign(payload, TEST_JWT_SECRET, options);

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

/** Start the real app on a random loopback port. Call `close()` in `after`. */
export async function startServer() {
  const { default: app } = await import('../src/app.js');
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  return {
    baseUrl,
    close: async () => {
      server.close();
      server.closeAllConnections();
      await once(server, 'close');
    },
  };
}

/** HTTP client bound to the original fetch (the global one is a guard). Returns status, headers, body. */
export function createClient(baseUrl) {
  return async function request(path, { method = 'GET', headers, body } = {}) {
    const res = await realFetch(`${baseUrl}${path}`, { method, headers, body });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      // non-JSON body: leave json null
    }
    return { status: res.status, headers: res.headers, json, text };
  };
}

const JPEG_BYTES = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];
export const jpegBuffer = (extra = 0) =>
  Buffer.concat([Buffer.from(JPEG_BYTES), Buffer.alloc(extra)]);

/** Build a multipart body. `fields` are text parts; `files` is [{ name, bytes, filename, type }]. */
export function buildForm(fields = {}, files = []) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  for (const { name, bytes, filename = 'photo.jpg', type = 'image/jpeg' } of files) {
    form.append(name, new Blob([bytes], { type }), filename);
  }
  return form;
}
