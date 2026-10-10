import type { ErrorRequestHandler, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import multer from 'multer';
import { ZodError } from 'zod';
import { isProd } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';

/** 404 for unmatched /api routes. */
export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`));
};

interface MongoServerErrorLike {
  code?: number;
  keyValue?: Record<string, unknown>;
}

interface HttpErrorLike {
  type?: string;
  status?: number;
}

/** Maps any thrown value to an AppError. Unknown errors become 500 INTERNAL. */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof ZodError) {
    return new AppError(400, 'VALIDATION_ERROR', 'Invalid request', err.flatten());
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [path, e] of Object.entries(err.errors)) fieldErrors[path] = [e.message];
    return new AppError(400, 'VALIDATION_ERROR', 'Invalid data', { fieldErrors });
  }
  if (err instanceof mongoose.Error.CastError) {
    return new AppError(400, 'VALIDATION_ERROR', `Invalid value for ${err.path}`);
  }
  const mongoErr = err as MongoServerErrorLike;
  if (mongoErr?.code === 11000) {
    const fields = Object.keys(mongoErr.keyValue ?? {});
    return new AppError(409, 'CONFLICT', `Duplicate value for ${fields.join(', ') || 'field'}`, {
      fields,
    });
  }

  if (err instanceof jwt.TokenExpiredError) {
    return new AppError(401, 'UNAUTHENTICATED', 'Session expired');
  }
  if (err instanceof jwt.JsonWebTokenError) {
    return new AppError(401, 'UNAUTHENTICATED', 'Invalid session');
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return new AppError(413, 'PAYLOAD_TOO_LARGE', 'File is too large');
    }
    return new AppError(400, 'VALIDATION_ERROR', `Upload error: ${err.message}`);
  }

  // body-parser errors
  const httpErr = err as HttpErrorLike;
  if (httpErr?.type === 'entity.too.large') {
    return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
  }
  if (httpErr?.type === 'entity.parse.failed') {
    return new AppError(400, 'VALIDATION_ERROR', 'Malformed JSON body');
  }

  const message = err instanceof Error ? err.message : String(err);
  return new AppError(500, 'INTERNAL', isProd ? 'Something went wrong' : message);
}

/** Single error envelope: { error: { code, message, details? } }. Never leaks stacks in prod. */
export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, _next) => {
  const appErr = toAppError(err);
  const log = req.log ?? logger;
  if (appErr.status >= 500) log.error({ err }, 'Unhandled error');
  else log.debug({ code: appErr.code }, appErr.message);

  const body: { code: string; message: string; details?: unknown; stack?: string } = {
    code: appErr.code,
    message: appErr.message,
  };
  if (appErr.details !== undefined) body.details = appErr.details;
  if (!isProd && appErr.status >= 500 && err instanceof Error && err.stack) body.stack = err.stack;

  res.status(appErr.status).json({ error: body });
};
