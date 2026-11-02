import 'dotenv/config';

const REQUIRED = [
  'CLIENT_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const missing = REQUIRED.filter((key) => !process.env[key]?.trim());
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`,
  );
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 4000,
  clientUrl: process.env.CLIENT_URL.trim(),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  supabaseUrl: process.env.SUPABASE_URL.trim(),
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY.trim(),
});
