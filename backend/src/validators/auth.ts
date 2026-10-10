import { z } from 'zod';
import { ROLES } from '../models/User.js';

export const email = z.string().trim().toLowerCase().email().max(254);

/** Length beats complexity rules (NIST 800-63B); 12 is the floor, 128 the DoS ceiling. */
export const password = z
  .string()
  .min(12, 'Use at least 12 characters')
  .max(128, 'Use at most 128 characters');

export const loginBody = z.object({
  email,
  password: z.string().min(1).max(128),
  captchaToken: z.string().max(2048).optional(),
});
export const forgotBody = z.object({ email });
export const resetBody = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), password });
export const changePasswordBody = z
  .object({ currentPassword: z.string().min(1).max(128), newPassword: password })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: 'New password must differ from the current one',
    path: ['newPassword'],
  });

export const userCreateBody = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  role: z.enum(ROLES).default('editor'),
  password,
});

export const userUpdateBody = z
  .object({
    name: z.string().trim().min(2).max(100),
    role: z.enum(ROLES),
    isActive: z.boolean(),
  })
  .partial();

export type LoginBody = z.infer<typeof loginBody>;
export type UserCreateBody = z.infer<typeof userCreateBody>;
export type UserUpdateBody = z.infer<typeof userUpdateBody>;
