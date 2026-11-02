// Preloaded with `node --import ./test/setup.js --test ...` so it runs before any app module is imported.
// It isolates the suite from the real Supabase project (see sprints/sprint2.md, Task 2):
//   1. every required env var gets a fake value, and dotenv is pointed at a file that does not exist,
//      so backend/.env is never read (dotenv would not override existing vars anyway);
//   2. globalThis.fetch is replaced with a guard that rejects every call and records it, installed
//      before config/supabase.js creates its client. The test HTTP client uses `realFetch` instead.

export const TEST_JWT_SECRET = 'test-only-jwt-secret-not-used-anywhere-else';
export const FAKE_SUPABASE_URL = 'http://127.0.0.1:9';

Object.assign(process.env, {
  NODE_ENV: 'test',
  CLIENT_URL: 'http://localhost:5173',
  JWT_SECRET: TEST_JWT_SECRET,
  JWT_EXPIRES_IN: '1h',
  SUPABASE_URL: FAKE_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: 'fake-service-role-key-for-tests',
  DOTENV_CONFIG_PATH: 'test/.no-such-env-file',
  DOTENV_CONFIG_QUIET: 'true',
  DOTENV_PATH: 'test/.no-such-env-file',
  DOTENV_QUIET: 'true',
});
delete process.env.DOTENV_CONFIG_OVERRIDE;
delete process.env.DOTENV_OVERRIDE;

export const realFetch = globalThis.fetch;

/** URLs the app tried to reach through fetch during the run. Must stay empty. */
export const blockedFetchCalls = [];

globalThis.fetch = async (input) => {
  const url = typeof input === 'string' ? input : (input?.url ?? String(input));
  blockedFetchCalls.push(url);
  throw new Error(`Outbound fetch blocked by test guard: ${url}`);
};
