import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, _res, next) {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
}

// Express recognises error handlers by their 4-argument signature.
export function errorHandler(err, _req, res, _next) {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal server error';

  if (err instanceof AppError) {
    ({ statusCode, code, message } = err);
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Request body is not valid JSON';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request body is too large';
  }

  if (statusCode >= 500) console.error(err);

  const body = { error: { message, code } };
  if (!env.isProduction && statusCode >= 500) body.error.stack = err.stack;
  res.status(statusCode).json(body);
}
