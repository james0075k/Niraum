import type { Request } from 'express';
import type { Actor } from '../services/audit.service.js';
import type { VisitorMeta } from '../services/contact.service.js';
import { AppError } from '../utils/AppError.js';

export const actorOf = (req: Request): Actor => ({
  userId: req.user?.id ?? null,
  ip: req.ip ?? '',
});

export const visitorOf = (req: Request): VisitorMeta => ({
  ip: req.ip ?? '',
  userAgent: req.get('user-agent') ?? '',
});

/** For routes behind requireAuth. */
export function userIdOf(req: Request): string {
  if (!req.user) throw AppError.unauthenticated();
  return req.user.id;
}
