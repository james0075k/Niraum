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
