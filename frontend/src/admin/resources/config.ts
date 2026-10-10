import type { ReactNode } from 'react';
import { z } from 'zod';
import { formatDate } from '@/lib/format';
import LOCALIZED from './localized.json';

/**
 * Generic resource manager config: one entry per content type drives the list page
 * (ResourceTable) and the edit page (ResourceForm). Field rules mirror
 * backend/src/validators/content.ts; `localized` lists come from localized.json, which
 * backend/tests/localized-sync.test.ts compares with backend/src/services/resources.ts.
 */

export interface FieldDef {
  name: string;
  label: string;
  kind:
    | 'text'
    | 'textarea'
    | 'richtext'
    | 'number'
    | 'switch'
    | 'select'
    | 'date'
    | 'image'
    | 'images'
    | 'list'
    | 'pairs';
  localized?: boolean;
  required?: boolean;
  max?: number;
  options?: { value: string; label: string }[];
  help?: string;
  section?: string;
  /**
   * `list` / `pairs` rows: the fields of one item. A `list` without `itemFields` is a list of
   * plain strings (`max` applies to each). `pairs` without `itemFields` is `{ label, value }`.
   */
  itemFields?: FieldDef[];
  /** `list` / `pairs` / `images`: most items allowed (backend `.max()`). */
  maxItems?: number;
}

export interface ResourceConfig {
  key: 'products' | 'deposits' | 'team' | 'services' | 'projects' | 'posts' | 'jobs';
  label: string;
  singular: string;
  apiPath: string; // '/admin/products'
  /** Admin UI route when it differs from `apiPath` (e.g. '/admin/deposit'). */
  adminPath?: string;
  titleField: string; // 'name' | 'title'
  visibleField: 'published' | 'isOpen';
  localized: readonly string[]; // mirror backend resources.ts exactly
  /** `key: 'status'` without `render` shows the StatusBadge. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- rows are untyped API docs
  columns: { key: string; label: string; sortable?: boolean; render?: (row: any) => ReactNode }[];
  filters?: { key: string; label: string; options: { value: string; label: string }[] }[];
  fields: FieldDef[];
  schema: z.ZodTypeAny; // client-side mirror of backend *Create (form-value shape)
  seo?: boolean;
  slug?: boolean;
  schedulable?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- rows are untyped API docs
  publicUrl?: (doc: any, lang: 'en' | 'ne') => string;
}

export type ResourceKey = ResourceConfig['key'];

// ── Shared form rules (mirror backend validators) ───────────────────────────

export const CONFIRM_HELP = '[CONFIRM] with client before publishing';

const tooLong = (max: number) => `At most ${max} characters`;

/** Plain text, optional. */
export const textRule = (max: number) => z.string().trim().max(max, tooLong(max));
/** Plain text, required (backend `.min(1)`). */
export const requiredText = (max: number) => textRule(max).min(1, 'Required');

/** Localized form value `{ en, ne }`; English required when `min` > 0 (backend `title` is min 2). */
export const localizedRule = (max: number, min = 0) =>
  z.object({
    en:
      min > 0
        ? textRule(max).min(1, 'Required').min(min, `At least ${min} characters`)
        : textRule(max),
    ne: textRule(max),
  });

/** https:// URL, a site path, or empty (backend `mediaUrl`, empty = none). */
export const urlOrEmpty = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === '' || v.startsWith('/') || /^https:\/\//.test(v), 'Use https:// or a /path');

/** Image form value; an empty `src` means "no image" (sent as null). */
export const imageRule = z.object({
  src: urlOrEmpty,
  alt: textRule(200),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  mediaId: z.string().optional(),
});

/** Backend `slugInput`; empty = generate from the title on create / keep on update. */
export const slugRule = z
  .string()
  .trim()
  .toLowerCase()
  .max(80, tooLong(80))
  .refine(
    (v) => v === '' || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v),
    'Lowercase letters, numbers and dashes only',
  );

/** Backend `seoInput`. */
export const seoRule = z.object({
  title: textRule(70),
  description: textRule(170),
  ogImage: urlOrEmpty,
  noindex: z.boolean(),
});

const numberRule = (min: number, max: number, int = false) => {
  let rule = z.number({ invalid_type_error: 'Enter a number', required_error: 'Required' });
  if (int) rule = rule.int('Whole numbers only');
  return rule.min(min, `At least ${min}`).max(max, `At most ${max}`);
};

// ── Products (backend productCreate) ────────────────────────────────────────

const productSchema = z.object({
  name: localizedRule(150, 2),
  slug: slugRule,
  chemicalFormula: textRule(40),
  summary: localizedRule(600),
  applications: z
    .array(z.object({ title: localizedRule(150), body: localizedRule(2000) }))
    .max(12, 'Up to 12 applications'),
  typicalChemistry: z
    .array(
      z.object({
        oxide: requiredText(20),
        value: numberRule(0, 100),
        unit: textRule(10),
        basis: localizedRule(200),
      }),
    )
    .max(20, 'Up to 20 rows'),
  sizes: z.array(z.object({ value: textRule(80) })).max(12, 'Up to 12 sizes'),
  minOrder: textRule(150),
  packing: textRule(300),
  image: imageRule,
  order: numberRule(0, 1000, true),
  published: z.boolean(),
  seo: seoRule,
});

const products: ResourceConfig = {
  key: 'products',
  label: 'Products',
  singular: 'product',
  apiPath: '/admin/products',
  titleField: 'name',
  visibleField: 'published',
  localized: LOCALIZED.products,
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'chemicalFormula', label: 'Formula' },
    { key: 'status', label: 'Status' },
    { key: 'order', label: 'Order', sortable: true },
    {
      key: 'updatedAt',
      label: 'Updated',
      sortable: true,
      render: (row: { updatedAt?: string }) => (row.updatedAt ? formatDate(row.updatedAt) : '—'),
    },
  ],
  fields: [
    {
      name: 'name',
      label: 'Name',
      kind: 'text',
      localized: true,
      required: true,
      max: 150,
      section: 'Basics',
    },
    {
      name: 'chemicalFormula',
      label: 'Chemical formula',
      kind: 'text',
      max: 40,
      help: 'For example Fe₂O₃.',
      section: 'Basics',
    },
    {
      name: 'summary',
      label: 'Summary',
      kind: 'textarea',
      localized: true,
      max: 600,
      section: 'Basics',
    },
    {
      name: 'order',
      label: 'Order',
      kind: 'number',
      help: 'Lower numbers are listed first.',
      section: 'Basics',
    },
    {
      name: 'applications',
      label: 'Applications',
      kind: 'list',
      localized: true,
      maxItems: 12,
      help: 'Use the blueprint §4 wording.',
      section: 'Applications',
      itemFields: [
        { name: 'title', label: 'Title', kind: 'text', localized: true, max: 150 },
        { name: 'body', label: 'Description', kind: 'textarea', localized: true, max: 2000 },
      ],
    },
    {
      name: 'typicalChemistry',
      label: 'Typical chemistry',
      kind: 'pairs',
      localized: true,
      maxItems: 20,
      help: 'Values from Table 14 of the mine scheme; say where each value comes from in Basis.',
      section: 'Chemistry',
      itemFields: [
        { name: 'oxide', label: 'Oxide', kind: 'text', required: true, max: 20 },
        { name: 'value', label: 'Value', kind: 'number', required: true },
        { name: 'unit', label: 'Unit', kind: 'text', max: 10 },
        { name: 'basis', label: 'Basis', kind: 'text', localized: true, max: 200 },
      ],
    },
    {
      name: 'sizes',
      label: 'Sizes',
      kind: 'list',
      max: 80,
      maxItems: 12,
      help: CONFIRM_HELP,
      section: 'Supply terms',
    },
    {
      name: 'minOrder',
      label: 'Minimum order',
      kind: 'text',
      max: 150,
      help: CONFIRM_HELP,
      section: 'Supply terms',
    },
    {
      name: 'packing',
      label: 'Packing and delivery',
      kind: 'textarea',
      max: 300,
      help: CONFIRM_HELP,
      section: 'Supply terms',
    },
    { name: 'image', label: 'Image', kind: 'image', section: 'Image' },
  ],
  schema: productSchema,
  seo: true,
  slug: true,
  schedulable: false,
  // One public Products page per language (no per-product URL yet).
  publicUrl: (_doc, lang) => `/${lang}/products`,
};

/**
 * Configured resources. Team, services, projects, posts and jobs land in Task 8 and deposits
 * in Task 9; until then their admin routes stay "coming soon".
 */
export const RESOURCES: Partial<Record<ResourceKey, ResourceConfig>> = { products };

export function getResource(key: ResourceKey): ResourceConfig {
  const cfg = RESOURCES[key];
  if (!cfg) throw new Error(`Resource "${key}" is not configured`);
  return cfg;
}

/** Admin UI base path of a resource ('/admin/products'). */
export const adminPathOf = (cfg: ResourceConfig) => cfg.adminPath ?? cfg.apiPath;

export type ResourceStatus = 'draft' | 'published' | 'scheduled' | 'trashed';

/** Status of an admin doc: trashed, draft (not visible), scheduled (future publishedAt) or published. */
export function statusOf(
  doc: { isDeleted?: boolean; publishedAt?: string | null } & Record<string, unknown>,
  cfg: Pick<ResourceConfig, 'visibleField' | 'schedulable'>,
  now = Date.now(),
): ResourceStatus {
  if (doc.isDeleted) return 'trashed';
  if (doc[cfg.visibleField] !== true) return 'draft';
  if (cfg.schedulable && doc.publishedAt && new Date(doc.publishedAt).getTime() > now) {
    return 'scheduled';
  }
  return 'published';
}
