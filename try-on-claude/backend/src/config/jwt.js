import jwt from 'jsonwebtoken';
import { env } from './env.js';

export function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

/** @throws {Error} JsonWebTokenError / TokenExpiredError when the token is invalid or expired */
export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
