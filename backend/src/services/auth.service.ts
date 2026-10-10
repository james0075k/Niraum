import { createHash, randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { env } from '../config/env.js';
import { mailer } from '../config/mailer.js';
import { User, type IUser, type UserDoc } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { captchaConfigured, captchaService } from './captcha.service.js';
import { auditService, type Actor } from './audit.service.js';
import { verifyAccessToken, verifyRefreshToken } from './token.service.js';

const RESET_TTL_MS = 30 * 60_000;

export const hashPassword = (plain: string) => argon2.hash(plain, { type: argon2.argon2id });
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

// Verified against when the email is unknown, so response time doesn't reveal which emails exist.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= hashPassword('not-a-real-password-xx'));

// `captcha` tells the UI whether to show the widget next time. Unknown emails always get false.
const invalidCredentials = (captcha: boolean) =>
  AppError.unauthenticated('Invalid email or password', { captcha });

export interface SessionUser {
  id: string;
  role: IUser['role'];
  ver: number;
}
const toSession = (u: Pick<UserDoc, '_id' | 'role' | 'refreshTokenVersion'>): SessionUser => ({
  id: String(u._id),
  role: u.role,
  ver: u.refreshTokenVersion,
});

export const authService = {
  async login(email: string, password: string, actor: Actor, captchaToken?: string) {
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.isActive) {
      await argon2.verify(await getDummyHash(), password).catch(() => false);
      await auditService.record(actor, { action: 'login_failed', entity: 'User', diff: { email } });
      throw invalidCredentials(false);
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new AppError(423, 'ACCOUNT_LOCKED', 'Account temporarily locked — try again later', {
        retryAt: user.lockUntil.toISOString(),
      });
    }

    if (user.failedLoginCount >= env.LOGIN_CAPTCHA_AFTER && captchaConfigured()) {
      if (!captchaToken) {
        throw new AppError(400, 'CAPTCHA_REQUIRED', 'Please complete the verification', {
          captcha: true,
        });
      }
      await captchaService.verify(captchaToken, actor.ip ?? '');
    }

    const ok = await argon2.verify(user.passwordHash, password).catch(() => false);
    if (!ok) {
      // Atomic increment so parallel guesses can't skip the lock.
      const updated = await User.findOneAndUpdate(
        { _id: user._id },
        { $inc: { failedLoginCount: 1 } },
        { new: true },
      );
      const attempts = updated?.failedLoginCount ?? 0;
      const locked = attempts >= env.LOGIN_MAX_ATTEMPTS;
      if (locked) {
        await User.updateOne(
          { _id: user._id },
          {
            lockUntil: new Date(Date.now() + env.LOGIN_LOCK_MINUTES * 60_000),
            failedLoginCount: 0,
          },
        );
      }
      await auditService.record(
        { ...actor, userId: String(user._id) },
        {
          action: 'login_failed',
          entity: 'User',
          entityId: String(user._id),
          diff: { attempts, locked },
        },
      );
      if (locked) {
        throw new AppError(423, 'ACCOUNT_LOCKED', 'Too many failed attempts — account locked', {
          minutes: env.LOGIN_LOCK_MINUTES,
        });
      }
      throw invalidCredentials(attempts >= env.LOGIN_CAPTCHA_AFTER);
    }

    user.failedLoginCount = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    await user.save();
    await auditService.record(
      { ...actor, userId: String(user._id) },
      { action: 'login', entity: 'User', entityId: String(user._id) },
    );
    return { user, session: toSession(user) };
  },

  /** Validates the refresh token; the caller issues a fresh pair (rotation). */
  async refresh(token: string) {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive || user.refreshTokenVersion !== payload.ver) {
      throw AppError.unauthenticated('Session is no longer valid');
    }
    return { user, session: toSession(user) };
  },

  /** Ends every session of the user by bumping the token version. Best effort. */
  async logout(tokens: { access?: unknown; refresh?: unknown }, actor: Actor) {
    let userId: string | null = null;
    for (const [value, verify] of [
      [tokens.access, verifyAccessToken],
      [tokens.refresh, verifyRefreshToken],
    ] as const) {
      if (typeof value !== 'string' || userId) continue;
      try {
        userId = verify(value).sub;
      } catch {
        /* expired or invalid — try the next one */
      }
    }
    if (!userId) return;
    await User.updateOne({ _id: userId }, { $inc: { refreshTokenVersion: 1 } });
    await auditService.record(
      { ...actor, userId },
      { action: 'logout', entity: 'User', entityId: userId },
    );
  },

  /** Always resolves the same way whether or not the email exists. */
  async forgotPassword(email: string, actor: Actor): Promise<void> {
    const user = await User.findOne({ email, isActive: true });
    if (!user) return;
    const token = randomBytes(32).toString('hex');
    await User.updateOne(
      { _id: user._id },
      { resetTokenHash: sha256(token), resetTokenExpires: new Date(Date.now() + RESET_TTL_MS) },
    );
    const link = `${env.ADMIN_URL.replace(/\/$/, '')}/admin/reset-password?token=${token}`;
    mailer.sendInBackground({
      to: user.email,
      subject: 'Reset your Niraum Metals admin password',
      text:
        `Hello ${user.name},\n\nSomeone (hopefully you) asked to reset your password.\n` +
        `Open this link within 30 minutes to choose a new one:\n\n${link}\n\n` +
        `If you didn't ask for this, ignore this email — your password stays the same.\n`,
    });
    await auditService.record(
      { ...actor, userId: String(user._id) },
      {
        action: 'update',
        entity: 'User',
        entityId: String(user._id),
        diff: { resetRequested: true },
      },
    );
  },

  async resetPassword(token: string, newPassword: string, actor: Actor): Promise<void> {
    const user = await User.findOneAndUpdate(
      // Matching and clearing in one atomic step makes the token single-use.
      { resetTokenHash: sha256(token), resetTokenExpires: { $gt: new Date() }, isActive: true },
      {
        passwordHash: await hashPassword(newPassword),
        resetTokenHash: null,
        resetTokenExpires: null,
        passwordChangedAt: new Date(),
        mustChangePassword: false,
        failedLoginCount: 0,
        lockUntil: null,
        $inc: { refreshTokenVersion: 1 },
      },
      { new: true },
    );
    if (!user) throw AppError.badRequest('Reset link is invalid or has expired');
    await auditService.record(
      { ...actor, userId: String(user._id) },
      { action: 'password_reset', entity: 'User', entityId: String(user._id) },
    );
  },

  async changePassword(userId: string, current: string, next: string, actor: Actor) {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw AppError.unauthenticated();
    const ok = await argon2.verify(user.passwordHash, current).catch(() => false);
    if (!ok) throw AppError.badRequest('Current password is incorrect');

    user.passwordHash = await hashPassword(next);
    user.mustChangePassword = false;
    user.passwordChangedAt = new Date();
    user.refreshTokenVersion += 1; // signs out other sessions
    await user.save();
    await auditService.record(actor, {
      action: 'password_change',
      entity: 'User',
      entityId: userId,
    });
    return { user, session: toSession(user) };
  },

  async me(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw AppError.unauthenticated();
    return user;
  },
};
