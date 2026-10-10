import { z } from 'zod';
import { APPLICATION_STATUSES } from '../models/Application.js';
import { MESSAGE_STATUSES } from '../models/Message.js';
import {
  BUYER_TYPES,
  INQUIRY_STATUSES,
  INQUIRY_TOPICS,
  QUANTITY_UNITS,
} from '../models/Inquiry.js';
import { LANGS } from '../models/schemas/LocalizedString.js';
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

// ── Bulk supply inquiry (Phase 4.5) ─────────────────────────────────────────
/** Mirrors frontend/src/features/inquiries/schemas.ts. */
export const inquiryBody = z
  .object({
    companyName: z.string().trim().min(2).max(150),
    contactName: z.string().trim().min(2).max(100),
    email,
    phone: phone.min(7),
    buyerType: z.enum(BUYER_TYPES),
    topic: z.enum(INQUIRY_TOPICS).default('supply'),
    quantity: z.coerce.number().positive().max(10_000_000).optional(),
    quantityUnit: z.enum(QUANTITY_UNITS).optional(),
    deliveryLocation: z.string().trim().max(200).optional().or(z.literal('')),
    specRequirement: z.string().trim().max(500).optional().or(z.literal('')),
    message: z.string().trim().max(5000).optional().or(z.literal('')),
    lang: z.enum(LANGS).default('en'),
    sourcePage: z.string().trim().max(200).optional().or(z.literal('')),
    website: honeypot,
    captchaToken,
  })
  .refine((v) => v.quantity === undefined || v.quantityUnit !== undefined, {
    message: 'Choose tonnes per month or a one-off tonnage',
    path: ['quantityUnit'],
  });
export type InquiryBody = z.infer<typeof inquiryBody>;

export const inquiryStatusBody = z.object({ status: z.enum(INQUIRY_STATUSES) });
export const inquiryListQuery = paginationQuery.extend({
  status: z.enum(INQUIRY_STATUSES).optional(),
  buyerType: z.enum(BUYER_TYPES).optional(),
});
