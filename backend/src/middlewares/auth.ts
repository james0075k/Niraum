import type { RequestHandler } from 'express';
import { ACCESS_COOKIE, verifyAccessToken } from '../services/token.service.js';
import { User, type Role } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { ah } from '../utils/asyncHandler.js';

/** Paths a user who must change their password may still call. */
const PASSWORD_CHANGE_ALLOWED = new Set(['/auth/me', '/auth/change-password', '/auth/logout']);

/**
 * Verifies the access-token cookie and loads the user (so deactivation and password
 * changes take effect immediately, not after the 15-minute token expires).
 */
export const requireAuth: RequestHandler = ah(async (req, _res, next) => {
  const token: unknown = req.cookies?.[ACCESS_COOKIE];
  if (typeof token !== 'string' || !token) throw AppError.unauthenticated();

  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub).lean();
  if (!user || !user.isActive || user.refreshTokenVersion !== payload.ver) {
    throw AppError.unauthenticated('Session is no longer valid');
  }

  req.user = {
    id: String(user._id),
    role: user.role,
    email: user.email,
    mustChangePassword: user.mustChangePassword,
  };

  const path = `${req.baseUrl}${req.path}`.replace(/^\/api\/v1/, '');
  if (user.mustChangePassword && !PASSWORD_CHANGE_ALLOWED.has(path)) {
    throw new AppError(403, 'PASSWORD_CHANGE_REQUIRED', 'Change your password to continue');
  }
  next();
});

/**
 * Role guard. Editors: content. Admins: content + settings + messages. Superadmin: users.
 * Superadmin always passes.
 */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(AppError.unauthenticated());
    if (req.user.role === 'superadmin' || roles.includes(req.user.role)) return next();
    next(AppError.forbidden());
  };

export const CONTENT_ROLES: Role[] = ['editor', 'admin', 'superadmin'];
export const ADMIN_ROLES: Role[] = ['admin', 'superadmin'];
