import { randomUUID } from 'node:crypto';
import type { CookieOptions, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { Role } from '../models/User.js';
import { AppError } from '../utils/AppError.js';

export const ACCESS_COOKIE = 'na_at';
export const REFRESH_COOKIE = 'na_rt';
const ACCESS_PATH = '/api';
const REFRESH_PATH = '/api/v1/auth';

export interface AccessPayload {
  sub: string;
  role: Role;
  ver: number;
  typ: 'access';
}
export interface RefreshPayload {
  sub: string;
  ver: number;
  typ: 'refresh';
  jti: string;
}

const UNITS: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

/** "15m" → 900000. Accepts s/m/h/d or plain seconds. */
export function ttlToMs(ttl: string): number {
  const m = /^(\d+)\s*([smhd])?$/.exec(ttl.trim());
  if (!m?.[1]) throw new Error(`Invalid TTL: ${ttl}`);
  return Number(m[1]) * (UNITS[m[2] ?? 's'] ?? 1000);
}

const sign = (payload: object, secret: string, ttl: string) =>
  jwt.sign(payload, secret, {
    expiresIn: Math.floor(ttlToMs(ttl) / 1000),
    algorithm: 'HS256',
    issuer: 'niraum-api',
  } satisfies SignOptions);

export function signAccessToken(user: { id: string; role: Role; ver: number }): string {
  const payload: AccessPayload = { sub: user.id, role: user.role, ver: user.ver, typ: 'access' };
  return sign(payload, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_TTL);
}

export function signRefreshToken(user: { id: string; ver: number }): string {
  const payload: RefreshPayload = {
    sub: user.id,
    ver: user.ver,
    typ: 'refresh',
    jti: randomUUID(),
  };
  return sign(payload, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_TTL);
}

function verify<T extends { typ: string }>(token: string, secret: string, typ: T['typ']): T {
  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'], issuer: 'niraum-api' });
  if (typeof decoded !== 'object' || decoded === null || decoded.typ !== typ) {
    throw AppError.unauthenticated('Invalid session');
  }
  return decoded as unknown as T;
}

export const verifyAccessToken = (token: string) =>
  verify<AccessPayload>(token, env.JWT_ACCESS_SECRET, 'access');
export const verifyRefreshToken = (token: string) =>
  verify<RefreshPayload>(token, env.JWT_REFRESH_SECRET, 'refresh');

const baseCookie = (): CookieOptions => ({
  httpOnly: true,
  // Browsers treat http://localhost as a secure context, so Secure works in development too.
  secure: true,
  sameSite: 'strict',
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
});

export function setAuthCookies(res: Response, user: { id: string; role: Role; ver: number }): void {
  res.cookie(ACCESS_COOKIE, signAccessToken(user), {
    ...baseCookie(),
    path: ACCESS_PATH,
    maxAge: ttlToMs(env.JWT_ACCESS_TTL),
  });
  res.cookie(REFRESH_COOKIE, signRefreshToken(user), {
    ...baseCookie(),
    path: REFRESH_PATH,
    maxAge: ttlToMs(env.JWT_REFRESH_TTL),
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...baseCookie(), path: ACCESS_PATH });
  res.clearCookie(REFRESH_COOKIE, { ...baseCookie(), path: REFRESH_PATH });
}
