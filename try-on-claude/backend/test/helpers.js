import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
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

// ---- Real image fixtures (generated with sharp) -------------------------------------------------
// `jpegBuffer` above only has magic bytes: it is enough for tests that stop before the service,
// but the service now decodes the image (Sprint 2 Task 7), so tests that reach it need these.

const solid = (width, height, background, channels = 3) => ({
  create: { width, height, channels, background },
});

/** Metadata that a phone photo carries and that must never reach Storage. */
export const PRIVATE_MARKERS = {
  make: 'SecretPhoneMake',
  xmp: 'SecretXmpCreator',
  trailing: 'SecretTrailingBytes',
  pngText: 'SecretPngTextComment',
};

const GPS_EXIF = {
  IFD0: { Make: PRIVATE_MARKERS.make, Software: 'SecretSoftware' },
  IFD3: {
    GPSLatitudeRef: 'N',
    GPSLatitude: '10/1 46/1 30/1',
    GPSLongitudeRef: 'E',
    GPSLongitude: '106/1 42/1 0/1',
  },
};

/** True when the EXIF block holds a GPS IFD (tag 0x8825 in IFD0, little-endian "II" byte order). */
export const exifHasGps = (exif) => exif.includes(Buffer.from([0x25, 0x88]));

const XMP = Buffer.from(
  `<x:xmpmeta xmlns:x="adobe:ns:meta/"><dc:creator>${PRIVATE_MARKERS.xmp}</dc:creator></x:xmpmeta>`,
);

/**
 * A JPEG with EXIF (Make + GPS), a Display P3 ICC profile and XMP, like a phone photo.
 * `orientation` 6 means "stored sideways, display rotated 90 degrees clockwise".
 * The image has a 16x16 green block in the top-left corner of a red field (size must be a multiple of 8).
 */
export async function phoneJpeg({ width = 64, height = 32, orientation, withGps = true } = {}) {
  let image = sharp(solid(width, height, '#ff0000')).composite([
    { input: solid(16, 16, '#00ff00'), left: 0, top: 0 },
  ]);
  if (withGps) image = image.withExif(GPS_EXIF);
  image = image.withIccProfile('p3').withXmp(XMP.toString());
  if (orientation) image = image.withMetadata({ orientation });
  return image.jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toBuffer();
}

export const plainJpeg = ({ width = 64, height = 32, color = '#3366cc' } = {}) =>
  sharp(solid(width, height, color))
    .jpeg()
    .toBuffer();

/** PNG with an alpha channel: left half opaque blue, right half 50% transparent red. */
export async function alphaPng({ width = 16, height = 8 } = {}) {
  const half = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const left = x < width / 2;
      half.set(left ? [0, 0, 255, 255] : [255, 0, 0, 128], i);
    }
  }
  return sharp(half, { raw: { width, height, channels: 4 } })
    .withExif({ IFD0: { Make: PRIVATE_MARKERS.make } })
    .png()
    .toBuffer();
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (bytes) => {
  let c = 0xffffffff;
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

/** Insert a PNG chunk right before IEND (the last 12 bytes). Used for tEXt, which sharp cannot write. */
export function insertPngChunk(png, type, data) {
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  body.copy(chunk, 4);
  chunk.writeUInt32BE(crc32(body), 8 + data.length);
  return Buffer.concat([png.subarray(0, png.length - 12), chunk, png.subarray(png.length - 12)]);
}

export const pngWithText = async () =>
  insertPngChunk(
    await alphaPng(),
    'tEXt',
    Buffer.from(`Comment\u0000${PRIVATE_MARKERS.pngText}`, 'latin1'),
  );

export const withTrailingBytes = (image) =>
  Buffer.concat([image, Buffer.from(PRIVATE_MARKERS.trailing)]);

/** Random-noise RGB pixels: incompressible, used to build images whose encoded size is large. */
export const noisePixels = (width, height, channels = 3) => randomBytes(width * height * channels);

export const noiseJpeg = (width, height, quality) =>
  sharp(noisePixels(width, height), { raw: { width, height, channels: 3 } })
    .jpeg({ quality })
    .toBuffer();

/**
 * Single-colour 8-bit grey PNG: a few dozen KB on the wire, but `width x height` pixels once decoded.
 * Used for pixel-limit tests.
 */
export const hugeFlatPng = (width, height) =>
  sharp(Buffer.alloc(width * height, 128), {
    raw: { width, height, channels: 1 },
    limitInputPixels: false,
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

/** 256-colour palette PNG of random indices: about 8 bits per pixel on disk, much larger as truecolor. */
export function randomPalettePng(width, height) {
  const indices = randomBytes(width * height);
  const palette = randomBytes(256 * 3);
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0; i < indices.length; i += 1) {
    rgb[i * 3] = palette[indices[i] * 3];
    rgb[i * 3 + 1] = palette[indices[i] * 3 + 1];
    rgb[i * 3 + 2] = palette[indices[i] * 3 + 2];
  }
  return sharp(rgb, { raw: { width, height, channels: 3 } })
    .png({ palette: true, colours: 256, dither: 0, compressionLevel: 9 })
    .toBuffer();
}

/** Decode to raw pixels: { data, info } with `info.channels` samples per pixel. */
export const rawPixels = (image) => sharp(image).raw().toBuffer({ resolveWithObject: true });

export function pixelAt({ data, info }, x, y) {
  const start = (y * info.width + x) * info.channels;
  return [...data.subarray(start, start + info.channels)];
}
