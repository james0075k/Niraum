import type { RequestHandler } from 'express';
import { allowedOrigins } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence in depth (on top of SameSite=Strict cookies): a state-changing request that
 * carries an `Origin` header must come from an allowed origin. Requests without `Origin`
 * (curl, server-to-server, the prerender build) are let through — they carry no cookies
 * a browser attached on someone else's behalf.
 */
export const originCheck: RequestHandler = (req, _res, next) => {
  if (SAFE.has(req.method)) return next();
  const origin = req.get('origin');
  if (!origin || allowedOrigins.includes(origin)) return next();
  next(AppError.forbidden('Origin not allowed'));
};
