export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'PASSWORD_CHANGE_REQUIRED'
  | 'ACCOUNT_LOCKED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'CAPTCHA_FAILED'
  | 'CAPTCHA_REQUIRED'
  | 'RATE_LIMITED'
  | 'STORAGE_UNAVAILABLE'
  | 'STORAGE_ERROR'
  | 'INTERNAL';

/** Operational error with a stable `code` — mapped 1:1 to the error envelope. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(400, 'VALIDATION_ERROR', message, details);
  }
  static unauthenticated(message = 'Authentication required', details?: unknown) {
    return new AppError(401, 'UNAUTHENTICATED', message, details);
  }
  static forbidden(message = 'You do not have permission to do that') {
    return new AppError(403, 'FORBIDDEN', message);
  }
  static notFound(what = 'Resource') {
    return new AppError(404, 'NOT_FOUND', `${what} not found`);
  }
  static conflict(message: string) {
    return new AppError(409, 'CONFLICT', message);
  }
}
