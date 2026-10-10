import rateLimit, { type Options } from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';

const base = (windowMs: number, limit: number, message: string): Partial<Options> => ({
  windowMs,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, _res, next) => next(new AppError(429, 'RATE_LIMITED', message)),
});

const HOUR = 60 * 60_000;
const MIN = 60_000;

/**
 * Built per app instance (each `createApp()` gets fresh in-memory counters, which keeps tests
 * isolated). For several API replicas, swap in a shared store (rate-limit-redis / -mongo).
 */
export function createRateLimiters() {
  return {
    global: rateLimit(base(15 * MIN, 300, 'Too many requests — slow down')),
    login: rateLimit(base(15 * MIN, 10, 'Too many login attempts — try again later')),
    forgot: rateLimit(base(HOUR, 5, 'Too many reset requests — try again later')),
    contact: rateLimit(base(HOUR, 5, 'Too many messages — please try again in an hour')),
    applications: rateLimit(base(HOUR, 5, 'Too many applications — try again later')),
    newsletter: rateLimit(base(10 * MIN, 5, 'Too many requests — try again later')),
    inquiries: rateLimit(base(HOUR, 5, 'Too many inquiries — please try again in an hour')),
  } satisfies Record<string, RequestHandler>;
}

export type RateLimiters = ReturnType<typeof createRateLimiters>;
