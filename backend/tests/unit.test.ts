import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import multer from 'multer';
import { z } from 'zod';
import { parseEnv } from '../src/config/env.js';
import { redactPaths } from '../src/config/logger.js';
import { toAppError } from '../src/middlewares/errorHandler.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { auditService } from '../src/services/audit.service.js';
import { ttlToMs } from '../src/services/token.service.js';
import { AppError } from '../src/utils/AppError.js';
import { diffFields } from '../src/utils/diff.js';
import { parseSort } from '../src/utils/pagination.js';
import { slugify, uniqueSlug } from '../src/utils/slug.js';

describe('toAppError', () => {
  it('maps Zod, Mongoose, Mongo, JWT, multer and body-parser errors', () => {
    const zod = z.object({ a: z.string() }).safeParse({});
    expect(toAppError(zod.success ? null : zod.error)).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
    });

    const validation = new mongoose.Error.ValidationError();
    validation.addError(
      'title',
      new mongoose.Error.ValidatorError({ message: 'required', path: 'title' }),
    );
    const mapped = toAppError(validation);
    expect(mapped).toMatchObject({
      status: 400,
      details: { fieldErrors: { title: ['required'] } },
    });

    const cast = new mongoose.Error.CastError('ObjectId', 'x', '_id');
    expect(toAppError(cast)).toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });

    expect(toAppError({ code: 11000, keyValue: { slug: 'a' } })).toMatchObject({
      status: 409,
      code: 'CONFLICT',
      details: { fields: ['slug'] },
    });
    expect(toAppError(new jwt.TokenExpiredError('jwt expired', new Date()))).toMatchObject({
      status: 401,
      message: 'Session expired',
    });
    expect(toAppError(new jwt.JsonWebTokenError('bad'))).toMatchObject({ status: 401 });
    expect(toAppError(new multer.MulterError('LIMIT_FILE_SIZE'))).toMatchObject({ status: 413 });
    expect(toAppError(new multer.MulterError('LIMIT_UNEXPECTED_FILE'))).toMatchObject({
      status: 400,
    });
    expect(toAppError({ type: 'entity.too.large' })).toMatchObject({ status: 413 });
    expect(toAppError(AppError.forbidden())).toMatchObject({ status: 403, code: 'FORBIDDEN' });
    expect(toAppError(new Error('boom'))).toMatchObject({
      status: 500,
      code: 'INTERNAL',
      message: 'boom',
    });
    expect(toAppError('weird')).toMatchObject({ status: 500 });
  });
});

describe('env', () => {
  const base = {
    NODE_ENV: 'development',
    MONGODB_URI: 'mongodb://localhost/x',
    JWT_ACCESS_SECRET: 'a'.repeat(40),
    JWT_REFRESH_SECRET: 'b'.repeat(40),
  };

  it('crashes on missing required values', () => {
    expect(() => parseEnv({ NODE_ENV: 'development' })).toThrow(/MONGODB_URI/);
    expect(() => parseEnv({ ...base, JWT_ACCESS_SECRET: 'short' })).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('applies development defaults', () => {
    const e = parseEnv(base);
    expect(e).toMatchObject({
      PORT: 4000,
      CLIENT_URL: 'http://localhost:5173',
      CLOUDINARY_FOLDER: 'niraum',
    });
    expect(e.REBUILD_HOOK_URL).toBeUndefined();
  });

  it('requires real secrets and service credentials in production', () => {
    const err = (() => {
      try {
        parseEnv({
          ...base,
          NODE_ENV: 'production',
          JWT_ACCESS_SECRET: `change-me-${'x'.repeat(30)}`,
        });
        return '';
      } catch (e) {
        return (e as Error).message;
      }
    })();
    for (const key of [
      'JWT_ACCESS_SECRET',
      'CLOUDINARY_CLOUD_NAME',
      'SMTP_HOST',
      'TURNSTILE_SECRET',
      'NOMINATIM_USER_AGENT',
    ]) {
      expect(err).toContain(key);
    }
    const ok = parseEnv({
      ...base,
      NODE_ENV: 'production',
      CLOUDINARY_CLOUD_NAME: 'c',
      CLOUDINARY_API_KEY: 'k',
      CLOUDINARY_API_SECRET: 's',
      RESEND_API_KEY: 're_x',
      TURNSTILE_SECRET: 't',
      NOMINATIM_USER_AGENT: 'NiraumMetals/1.0 (it@niraum.com.np)',
    });
    expect(ok.NODE_ENV).toBe('production');
  });
});

describe('utils', () => {
  it('slugify + uniqueSlug', async () => {
    expect(slugify('  Hello, World!  ')).toBe('hello-world');
    expect(slugify('!!!')).toBe('item');
    expect(slugify('a'.repeat(120))).toHaveLength(80);
    const taken = new Set(Array.from({ length: 20 }, (_, i) => (i === 0 ? 'x' : `x-${i + 1}`)));
    const slug = await uniqueSlug('x', async (s) => taken.has(s));
    expect(slug).toMatch(/^x-[a-f0-9]{6}$/);
  });

  it('diffFields omits secrets and truncates long values', () => {
    const d = diffFields(
      { title: 'a', passwordHash: 'x', body: 'same', updatedAt: 1 },
      { title: 'b', passwordHash: 'y', body: 'same', long: 'z'.repeat(500), updatedAt: 2 },
    );
    expect(Object.keys(d).sort()).toEqual(['long', 'title']);
    expect((d.long as { to: string }).to).toHaveLength(201);
  });

  it('parseSort honours the allow-list', () => {
    expect(parseSort('-title', ['title'], { a: 1 })).toEqual({ title: -1 });
    expect(parseSort('secret', ['title'], { a: 1 })).toEqual({ a: 1 });
  });

  it('ttlToMs', () => {
    expect(ttlToMs('15m')).toBe(900_000);
    expect(ttlToMs('7d')).toBe(604_800_000);
    expect(ttlToMs('30')).toBe(30_000);
    expect(() => ttlToMs('soon')).toThrow();
  });

  it('logger redacts credentials', () => {
    expect(redactPaths).toEqual(
      expect.arrayContaining(['req.headers.cookie', '*.password', '*.token']),
    );
  });
});

describe('audit log', () => {
  it('is append-only', async () => {
    await auditService.record({ userId: null, ip: '1.1.1.1' }, { action: 'create', entity: 'X' });
    await expect(AuditLog.updateOne({}, { action: 'delete' })).rejects.toThrow(/append-only/);
    await expect(AuditLog.deleteMany({})).rejects.toThrow(/append-only/);
    expect(await AuditLog.countDocuments()).toBe(1);
  });

  it('never throws when the write fails', async () => {
    vi.spyOn(AuditLog, 'create').mockRejectedValueOnce(new Error('db down'));
    await expect(
      auditService.record({ userId: 'not-an-id', ip: '' }, { action: 'update', entity: 'X' }),
    ).resolves.toBeUndefined();
  });
});
