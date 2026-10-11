import { z } from 'zod';

/** Mirrors backend/src/validators/auth.ts `password` (12–128 characters). */
export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

/**
 * Checks for a new password + confirmation (+ optional current password). Runs as one
 * superRefine over plain strings so every message shows at once — object-level refines in Zod
 * are skipped while any field fails.
 */
export function newPasswordSchema<T extends boolean>(withCurrent: T) {
  return z
    .object({
      currentPassword: withCurrent ? z.string() : z.string().optional(),
      newPassword: z.string(),
      confirmPassword: z.string(),
    })
    .superRefine((v, ctx) => {
      if (withCurrent && !v.currentPassword) {
        ctx.addIssue({
          code: 'custom',
          path: ['currentPassword'],
          message: 'Enter your current password.',
        });
      }
      if (v.newPassword.length < PASSWORD_MIN) {
        ctx.addIssue({
          code: 'custom',
          path: ['newPassword'],
          message: `Use at least ${PASSWORD_MIN} characters.`,
        });
      } else if (v.newPassword.length > PASSWORD_MAX) {
        ctx.addIssue({
          code: 'custom',
          path: ['newPassword'],
          message: `Use at most ${PASSWORD_MAX} characters.`,
        });
      } else if (withCurrent && v.currentPassword && v.newPassword === v.currentPassword) {
        ctx.addIssue({
          code: 'custom',
          path: ['newPassword'],
          message: 'Choose a password different from the current one.',
        });
      }
      if (v.confirmPassword !== v.newPassword) {
        ctx.addIssue({
          code: 'custom',
          path: ['confirmPassword'],
          message: 'The passwords do not match.',
        });
      }
    });
}

export type NewPasswordValues = {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
};

/** Character classes of generated passwords (no look-alikes such as 0/O, 1/l/I). */
const GEN_CLASSES = [
  'abcdefghijkmnopqrstuvwxyz',
  'ABCDEFGHJKLMNPQRSTUVWXYZ',
  '23456789',
  '!@#$%^&*-_=+?',
];
const GEN_CHARS = GEN_CLASSES.join('');

/** A uniform random index below `n` from `crypto.getRandomValues` (rejection sampling). */
function randomIndex(n: number): number {
  const limit = Math.floor(0x1_0000_0000 / n) * n;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    const v = buf[0] as number;
    if (v < limit) return v % n;
  }
}

/**
 * A random temporary password (default 20 characters) with at least one lowercase, uppercase,
 * digit and symbol, so it passes the 12–128 rule and scores "Strong".
 */
export function generatePassword(length = 20): string {
  for (;;) {
    let out = '';
    for (let i = 0; i < length; i += 1) out += GEN_CHARS[randomIndex(GEN_CHARS.length)];
    if (GEN_CLASSES.every((set) => [...out].some((c) => set.includes(c)))) return out;
  }
}
