import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseProfileInput } from '../src/validators/profile.validator.js';
import { AppError } from '../src/utils/AppError.js';

const MESSAGES = {
  INVALID_DISPLAY_NAME: 'Tên hiển thị tối đa 50 ký tự.',
  INVALID_HEIGHT: 'Chiều cao phải là số từ 100 đến 250 cm.',
  INVALID_WEIGHT: 'Cân nặng phải là số từ 30 đến 250 kg.',
  INVALID_FILE_TYPE: 'Ảnh phải ở định dạng JPG hoặc PNG.',
};

const valid = { heightCm: '170', weightKg: '65' };
const file = (bytes) => ({ buffer: Buffer.from(bytes) });
const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00];

function assertFails(fn, code) {
  assert.throws(fn, (err) => {
    assert.ok(err instanceof AppError, 'must be an AppError');
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, code);
    assert.equal(err.message, MESSAGES[code]);
    return true;
  });
}

describe('parseProfileInput: heightCm', () => {
  const run = (heightCm) => () => parseProfileInput({ ...valid, heightCm });

  it('accepts the boundaries 100 and 250', () => {
    assert.equal(run('100')().heightCm, 100);
    assert.equal(run('250')().heightCm, 250);
  });

  it('rejects just outside the boundaries', () => {
    assertFails(run('99.9'), 'INVALID_HEIGHT');
    assertFails(run('250.1'), 'INVALID_HEIGHT');
  });

  it('checks the range on the raw value, before rounding', () => {
    assertFails(run('99.96'), 'INVALID_HEIGHT');
    assertFails(run('250.04'), 'INVALID_HEIGHT');
  });

  for (const [label, value] of [
    ['missing', undefined],
    ['an array', ['170']],
    ['letters', 'abc'],
    ['exponent notation', '1e2'],
    ['negative', '-170'],
    ['empty string', ''],
    ['whitespace only', '   '],
    ['a comma decimal', '170,5'],
  ]) {
    it(`rejects ${label}`, () => assertFails(run(value), 'INVALID_HEIGHT'));
  }

  it('trims and rounds to one decimal place', () => {
    assert.equal(run('  170  ')().heightCm, 170);
    assert.equal(run('170.26')().heightCm, 170.3);
    assert.equal(run('170.24')().heightCm, 170.2);
  });
});

describe('parseProfileInput: weightKg', () => {
  const run = (weightKg) => () => parseProfileInput({ ...valid, weightKg });

  it('accepts the boundaries 30 and 250', () => {
    assert.equal(run('30')().weightKg, 30);
    assert.equal(run('250')().weightKg, 250);
  });

  it('rejects just outside the boundaries', () => {
    assertFails(run('29.9'), 'INVALID_WEIGHT');
    assertFails(run('250.1'), 'INVALID_WEIGHT');
  });

  for (const [label, value] of [
    ['missing', undefined],
    ['an array', ['65']],
    ['letters', 'abc'],
    ['exponent notation', '1e2'],
    ['negative', '-65'],
    ['empty string', ''],
  ]) {
    it(`rejects ${label}`, () => assertFails(run(value), 'INVALID_WEIGHT'));
  }

  it('trims and rounds to one decimal place', () => {
    assert.equal(run(' 65 ')().weightKg, 65);
    assert.equal(run('65.26')().weightKg, 65.3);
  });
});

describe('parseProfileInput: displayName', () => {
  const run = (displayName) => () => parseProfileInput({ ...valid, displayName });

  it('is undefined (keep as is) when missing', () => {
    assert.equal(parseProfileInput(valid).displayName, undefined);
  });

  it('is null (clear) when empty or whitespace only', () => {
    assert.equal(run('')().displayName, null);
    assert.equal(run('   \t ')().displayName, null);
  });

  it('trims the value', () => {
    assert.equal(run('  Lan  ')().displayName, 'Lan');
  });

  it('accepts exactly 50 code points', () => {
    assert.equal(run('a'.repeat(50))().displayName, 'a'.repeat(50));
  });

  it('counts code points, not UTF-16 units (astral characters)', () => {
    const emoji50 = '😀'.repeat(50);
    assert.equal(emoji50.length, 100);
    assert.equal(run(emoji50)().displayName, emoji50);
    assertFails(run('😀'.repeat(51)), 'INVALID_DISPLAY_NAME');
  });

  it('rejects 51 characters', () => {
    assertFails(run('a'.repeat(51)), 'INVALID_DISPLAY_NAME');
  });

  it('counts the trimmed value', () => {
    assert.equal(run(` ${'a'.repeat(50)} `)().displayName, 'a'.repeat(50));
  });

  it('rejects NUL characters', () => {
    assertFails(run('ab\u0000c'), 'INVALID_DISPLAY_NAME');
  });

  it('rejects non-string values', () => {
    assertFails(run(['a', 'b']), 'INVALID_DISPLAY_NAME');
    assertFails(run({ a: 1 }), 'INVALID_DISPLAY_NAME');
  });
});

describe('parseProfileInput: file', () => {
  const run = (f) => () => parseProfileInput(valid, f);

  it('returns photo null when there is no file', () => {
    assert.equal(parseProfileInput(valid, undefined).photo, null);
  });

  it('detects JPEG from magic bytes', () => {
    const { photo } = run(file(JPEG))();
    assert.equal(photo.ext, 'jpg');
    assert.equal(photo.contentType, 'image/jpeg');
    assert.ok(Buffer.isBuffer(photo.buffer));
  });

  it('detects PNG from magic bytes', () => {
    const { photo } = run(file(PNG))();
    assert.equal(photo.ext, 'png');
    assert.equal(photo.contentType, 'image/png');
  });

  for (const [label, bytes] of [
    ['an empty file', []],
    ['a PDF', Buffer.from('%PDF-1.7\n')],
    ['a GIF', Buffer.from('GIF89a')],
    ['a WEBP', Buffer.from('RIFF\u0000\u0000\u0000\u0000WEBPVP8 ')],
    ['plain text', Buffer.from('hello world')],
    ['a truncated JPEG magic', [0xff, 0xd8]],
    ['a truncated PNG magic', PNG.slice(0, 7)],
  ]) {
    it(`rejects ${label}`, () => assertFails(run(file(bytes)), 'INVALID_FILE_TYPE'));
  }

  it('ignores client-supplied mimetype and file name', () => {
    assertFails(
      run({ ...file('plain text'), mimetype: 'image/png', originalname: 'me.png' }),
      'INVALID_FILE_TYPE',
    );
    const { photo } = run({ ...file(PNG), mimetype: 'application/pdf', originalname: 'x.pdf' })();
    assert.equal(photo.ext, 'png');
  });
});

describe('parseProfileInput: error order (name, height, weight, file)', () => {
  const badFile = file('not an image');

  it('reports displayName before height, weight and file', () => {
    assertFails(
      () =>
        parseProfileInput({ displayName: 'a'.repeat(51), heightCm: 'x', weightKg: 'x' }, badFile),
      'INVALID_DISPLAY_NAME',
    );
  });

  it('reports height before weight and file', () => {
    assertFails(
      () => parseProfileInput({ heightCm: 'x', weightKg: 'x' }, badFile),
      'INVALID_HEIGHT',
    );
  });

  it('reports weight before file', () => {
    assertFails(
      () => parseProfileInput({ heightCm: '170', weightKg: 'x' }, badFile),
      'INVALID_WEIGHT',
    );
  });

  it('reports the file last', () => {
    assertFails(() => parseProfileInput(valid, badFile), 'INVALID_FILE_TYPE');
  });

  it('treats a missing body as missing height', () => {
    assertFails(() => parseProfileInput(undefined, undefined), 'INVALID_HEIGHT');
  });
});
