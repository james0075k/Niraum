import { z } from 'zod';
import { APPLICATION_STATUSES } from '../models/Application.js';
import { MESSAGE_STATUSES } from '../models/Message.js';
import { email } from './auth.js';
import { paginationQuery, slugInput } from './common.js';

const phone = z
  .string()
  .trim()
  .max(30)
  .regex(/^[+\d\s()-]*$/, 'Use digits, spaces and + ( ) - only.');

/** Honeypot: humans never see this field, so any value means a bot. */
const honeypot = z.string().max(200).optional();
const captchaToken = z.string().max(4096).optional();

/** Mirrors frontend/src/features/contact/schemas.ts. */
export const contactBody = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  phone: phone.optional().or(z.literal('')),
  company: z.string().trim().max(120).optional().or(z.literal('')),
  subject: z.string().trim().min(3).max(150),
  message: z.string().trim().min(10).max(5000),
  website: honeypot,
  captchaToken,
});
export type ContactBody = z.infer<typeof contactBody>;

/** multipart fields — the CV itself is validated by magic bytes. */
export const applicationBody = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  phone: phone.min(7),
  message: z.string().trim().max(3000).optional().or(z.literal('')),
  job: slugInput.optional().or(z.literal('')),
  website: honeypot,
  captchaToken,
});
export type ApplicationBody = z.infer<typeof applicationBody>;

export const newsletterBody = z.object({
  email,
  source: z.string().trim().max(50).optional(),
  website: honeypot,
});

export const tokenQuery = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) });

export const messageStatusBody = z.object({ status: z.enum(MESSAGE_STATUSES) });
export const applicationStatusBody = z.object({ status: z.enum(APPLICATION_STATUSES) });

export const inboxQuery = paginationQuery.extend({
  status: z.string().trim().max(20).optional(),
});
export const auditQuery = paginationQuery.extend({
  entity: z.string().trim().max(40).optional(),
  entityId: z.string().trim().max(64).optional(),
  user: z
    .string()
    .regex(/^[a-f0-9]{24}$/)
    .optional(),
});
