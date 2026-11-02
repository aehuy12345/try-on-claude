import jwt from 'jsonwebtoken';
import { verifyToken } from '../config/jwt.js';
import { AppError } from '../utils/AppError.js';

const BEARER_RE = /^Bearer (\S+)$/;
// profiles.id is a uuid: any other `sub` would make Postgres fail with 22P02 (a 500) instead of a 401.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const authRequired = () => new AppError(401, 'AUTH_REQUIRED', 'Vui lòng đăng nhập để tiếp tục.');
const tokenExpired = () =>
  new AppError(401, 'TOKEN_EXPIRED', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
const tokenInvalid = () =>
  new AppError(401, 'TOKEN_INVALID', 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');

/**
 * Verify the Bearer JWT and expose the user id as `req.userId`.
 * The id comes only from the token's `sub`, never from the request body or params.
 * Whether the profile still exists is checked by the service that reads it (PRD 4).
 */
export function requireAuth(req, _res, next) {
  const match = BEARER_RE.exec(req.headers.authorization ?? '');
  if (!match) return next(authRequired());

  let payload;
  try {
    payload = verifyToken(match[1]);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) return next(tokenExpired());
    return next(tokenInvalid());
  }

  if (typeof payload?.sub !== 'string' || !UUID_RE.test(payload.sub)) return next(tokenInvalid());
  req.userId = payload.sub;
  next();
}
