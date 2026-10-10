import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import type { LocalizedString } from '../models/schemas/LocalizedString.js';
import { langQuery, paginationQuery } from '../utils/pagination.js';

export const objectId = z.string().refine((v) => isValidObjectId(v), 'Invalid id');
export const idParams = z.object({ id: objectId });
export const slugParams = z.object({
  slug: z.string().regex(/^[a-z0-9-]{1,100}$/, 'Invalid slug'),
});

export const slugInput = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and dashes only')
  .max(80);

/** "true"/"false" query strings → boolean. */
export const boolQuery = z.enum(['true', 'false']).transform((v) => v === 'true');

/** Absolute https URL or a site-relative path (local fallback images). */
export const mediaUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v.startsWith('/') || /^https:\/\//.test(v), 'Use https:// or a /path');

export const imageInput = z.object({
  src: mediaUrl,
  alt: z.string().trim().max(200).default(''),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  mediaId: objectId.optional(),
});

export const seoInput = z
  .object({
    title: z.string().trim().max(70),
    description: z.string().trim().max(170),
    ogImage: mediaUrl,
    noindex: z.boolean(),
  })
  .partial();

/** Admin list extras: drafts included by default; `trash=true` lists soft-deleted items. */
export const adminListQuery = paginationQuery.extend({
  state: z.enum(['all', 'draft', 'published']).default('all'),
  trash: boolQuery.optional(),
});

/**
 * LocalizedString input (Phase 4.5): a plain string (English) or `{ en, ne? }`.
 * `en` uses the field's own rules; `ne` may be empty (falls back to English).
 */
export function localized(en: z.ZodString, ne: z.ZodString = z.string().trim().max(100_000)) {
  return z
    .union([en, z.object({ en, ne: ne.optional() }).strict()])
    .transform((v): LocalizedString => (typeof v === 'string' ? { en: v } : v));
}

export { langQuery, paginationQuery };
