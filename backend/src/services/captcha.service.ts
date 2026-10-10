import { env, isProd } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';

interface VerifyResponse {
  success: boolean;
  score?: number;
  'error-codes'?: string[];
}

const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RECAPTCHA_URL = 'https://www.google.com/recaptcha/api/siteverify';

export const captchaService = {
  /**
   * Verifies a Cloudflare Turnstile (preferred) or Google reCAPTCHA token. With neither secret
   * configured (development/test) verification is skipped; production refuses to boot that way.
   */
  async verify(token: string | undefined, ip: string): Promise<void> {
    const secret = env.TURNSTILE_SECRET ?? env.RECAPTCHA_SECRET;
    if (!secret) {
      if (isProd) throw new AppError(500, 'INTERNAL', 'Captcha not configured');
      return;
    }
    if (!token) throw new AppError(400, 'CAPTCHA_FAILED', 'Please complete the verification');

    const url = env.TURNSTILE_SECRET ? TURNSTILE_URL : RECAPTCHA_URL;
    let body: VerifyResponse;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: token, remoteip: ip }),
        signal: AbortSignal.timeout(5000),
      });
      body = (await res.json()) as VerifyResponse;
    } catch (err) {
      logger.error({ err }, 'Captcha verification request failed');
      throw new AppError(503, 'CAPTCHA_FAILED', 'Verification service unavailable — try again');
    }
    // reCAPTCHA v3 returns a score; v2 and Turnstile only success.
    if (!body.success || (body.score !== undefined && body.score < 0.5)) {
      throw new AppError(400, 'CAPTCHA_FAILED', 'Verification failed — please try again');
    }
  },
};
