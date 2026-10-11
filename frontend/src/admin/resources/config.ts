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
    | 'pairs'
    | 'group';
  localized?: boolean;
  required?: boolean;
  max?: number;
  options?: { value: string; label: string }[];
  help?: string;
  section?: string;
  /**
   * `group`: the fields of a nested object (e.g. a project's `location`).
   * `list` / `pairs` rows: the fields of one item. A `list` without `itemFields` is a list of
   * plain strings (`max` applies to each). `pairs` without `itemFields` is `{ label, value }`.
   */
  itemFields?: FieldDef[];
  /** `list` / `pairs` / `images`: most items allowed (backend `.max()`). */
  maxItems?: number;
  /** Empty is sent as `null` (backend `.nullable()`), e.g. an optional number or URL. */
  nullable?: boolean;
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

// ── Shared bits for the remaining content types ─────────────────────────────

const updatedColumn = {
  key: 'updatedAt',
  label: 'Updated',
  sortable: true,
  render: (row: { updatedAt?: string }) => (row.updatedAt ? formatDate(row.updatedAt) : '—'),
};

const optionsOf = (values: readonly string[], labels: Record<string, string>) =>
  values.map((value) => ({ value, label: labels[value] ?? value }));

/** Backend `title`: localized, English 2–150 characters. */
const titleField: FieldDef = {
  name: 'title',
  label: 'Title',
  kind: 'text',
  localized: true,
  required: true,
  max: 150,
  section: 'Basics',
};

const imagesRule = (max: number) => z.array(imageRule).max(max, `Up to ${max} images`);
const stringList = (max: number, items: number, what: string) =>
  z.array(z.object({ value: textRule(max) })).max(items, `Up to ${items} ${what}`);
/** `YYYY-MM-DD` from a date input, or empty. */
const dateRule = z
  .string()
  .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Use a valid date');
/** Backend `z.string().url()`; empty = none. */
const urlRule = z
  .string()
  .trim()
  .max(300, tooLong(300))
  .refine((v) => {
    if (v === '') return true;
    try {
      return ['http:', 'https:'].includes(new URL(v).protocol);
    } catch {
      return false;
    }
  }, 'Enter a full URL, starting with https://');

// ── Team (backend teamCreate) ───────────────────────────────────────────────

const team: ResourceConfig = {
  key: 'team',
  label: 'Team',
  singular: 'team member',
  apiPath: '/admin/team',
  titleField: 'name',
  visibleField: 'published',
  localized: LOCALIZED.team,
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
    { key: 'order', label: 'Order', sortable: true },
    updatedColumn,
  ],
  fields: [
    { name: 'name', label: 'Name', kind: 'text', required: true, max: 100, section: 'Basics' },
    { name: 'role', label: 'Role', kind: 'text', localized: true, max: 100, section: 'Basics' },
    { name: 'bio', label: 'Bio', kind: 'textarea', localized: true, max: 2000, section: 'Basics' },
    {
      name: 'isFounder',
      label: 'Founder',
      kind: 'switch',
      help: 'Shown in the founder card on About and Investors.',
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
      name: 'linkedin',
      label: 'LinkedIn URL',
      kind: 'text',
      max: 300,
      nullable: true,
      section: 'Basics',
    },
    { name: 'photo', label: 'Photo', kind: 'image', section: 'Photo' },
    {
      name: 'otherVentures',
      label: 'Other ventures',
      kind: 'list',
      localized: true,
      maxItems: 20,
      section: 'Other ventures',
      itemFields: [
        { name: 'company', label: 'Company', kind: 'text', required: true, max: 150 },
        { name: 'role', label: 'Role', kind: 'text', localized: true, max: 100 },
        { name: 'sector', label: 'Sector', kind: 'text', localized: true, max: 100 },
        { name: 'since', label: 'Since (year)', kind: 'number', nullable: true },
      ],
    },
  ],
  schema: z.object({
    name: requiredText(100).min(2, 'At least 2 characters'),
    role: localizedRule(100),
    bio: localizedRule(2000),
    isFounder: z.boolean(),
    order: numberRule(0, 1000, true),
    linkedin: urlRule,
    photo: imageRule,
    otherVentures: z
      .array(
        z.object({
          company: requiredText(150),
          role: localizedRule(100),
          sector: localizedRule(100),
          since: numberRule(1900, 2100, true).optional(),
        }),
      )
      .max(20, 'Up to 20 ventures'),
    published: z.boolean(),
  }),
  publicUrl: (_doc, lang) => `/${lang}/about`,
};

// ── Services (backend serviceCreate) ────────────────────────────────────────

const SERVICE_ICONS = ['pickaxe', 'gem', 'mountain', 'truck'] as const;

const services: ResourceConfig = {
  key: 'services',
  label: 'Services',
  singular: 'service',
  apiPath: '/admin/services',
  titleField: 'title',
  visibleField: 'published',
  localized: LOCALIZED.services,
  columns: [
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status' },
    { key: 'order', label: 'Order', sortable: true },
    updatedColumn,
  ],
  fields: [
    titleField,
    {
      name: 'icon',
      label: 'Icon',
      kind: 'select',
      options: optionsOf(SERVICE_ICONS, {
        pickaxe: 'Pickaxe',
        gem: 'Gem',
        mountain: 'Mountain',
        truck: 'Truck',
      }),
      section: 'Basics',
    },
    {
      name: 'summary',
      label: 'Summary',
      kind: 'textarea',
      localized: true,
      max: 300,
      section: 'Basics',
    },
    {
      name: 'order',
      label: 'Order',
      kind: 'number',
      help: 'Lower numbers are listed first.',
      section: 'Basics',
    },
    { name: 'body', label: 'Body', kind: 'richtext', localized: true, section: 'Body' },
    {
      name: 'highlights',
      label: 'Highlights',
      kind: 'list',
      max: 200,
      maxItems: 12,
      section: 'Body',
    },
    {
      name: 'stats',
      label: 'Stats',
      kind: 'pairs',
      maxItems: 8,
      help: 'Leave Value empty and fill Placeholder for a figure that is still [CONFIRM].',
      section: 'Stats',
      itemFields: [
        { name: 'label', label: 'Label', kind: 'text', max: 60 },
        { name: 'value', label: 'Value', kind: 'number', nullable: true },
        { name: 'suffix', label: 'Suffix', kind: 'text', max: 10 },
        { name: 'placeholder', label: 'Placeholder', kind: 'text', max: 60 },
      ],
    },
    { name: 'image', label: 'Image', kind: 'image', section: 'Images' },
    { name: 'gallery', label: 'Gallery', kind: 'images', maxItems: 20, section: 'Images' },
  ],
  schema: z.object({
    title: localizedRule(150, 2),
    slug: slugRule,
    icon: z.enum(SERVICE_ICONS),
    summary: localizedRule(300),
    order: numberRule(0, 1000, true),
    body: localizedRule(100_000),
    highlights: stringList(200, 12, 'highlights'),
    stats: z
      .array(
        z.object({
          label: textRule(60),
          value: z.number({ invalid_type_error: 'Enter a number' }).optional(),
          suffix: textRule(10),
          placeholder: textRule(60),
        }),
      )
      .max(8, 'Up to 8 stats'),
    image: imageRule,
    gallery: imagesRule(20),
    published: z.boolean(),
  }),
  slug: true,
};

// ── Projects (backend projectCreate) — retired from the public site ─────────

const MINERALS = ['iron-ore', 'metal-minerals', 'stone-aggregates'] as const;
const PROJECT_STATUSES = ['exploration', 'development', 'operating', 'completed'] as const;
const MINERAL_LABELS: Record<string, string> = {
  'iron-ore': 'Iron ore',
  'metal-minerals': 'Metal minerals',
  'stone-aggregates': 'Stone aggregates',
};
const PROJECT_STATUS_LABELS: Record<string, string> = {
  exploration: 'Exploration',
  development: 'Development',
  operating: 'Operating',
  completed: 'Completed',
};

const projects: ResourceConfig = {
  key: 'projects',
  label: 'Projects',
  singular: 'project',
  apiPath: '/admin/projects',
  titleField: 'title',
  visibleField: 'published',
  localized: LOCALIZED.projects,
  columns: [
    { key: 'title', label: 'Title' },
    {
      key: 'mineral',
      label: 'Mineral',
      render: (row: { mineral?: string }) =>
        (row.mineral && MINERAL_LABELS[row.mineral]) ?? row.mineral ?? '—',
    },
    { key: 'status', label: 'Status' },
    updatedColumn,
  ],
  filters: [
    { key: 'mineral', label: 'Mineral', options: optionsOf(MINERALS, MINERAL_LABELS) },
    {
      key: 'status',
      label: 'Project status',
      options: optionsOf(PROJECT_STATUSES, PROJECT_STATUS_LABELS),
    },
  ],
  fields: [
    titleField,
    {
      name: 'mineral',
      label: 'Mineral',
      kind: 'select',
      required: true,
      options: optionsOf(MINERALS, MINERAL_LABELS),
      section: 'Basics',
    },
    {
      name: 'status',
      label: 'Project status',
      kind: 'select',
      options: optionsOf(PROJECT_STATUSES, PROJECT_STATUS_LABELS),
      section: 'Basics',
    },
    {
      name: 'summary',
      label: 'Summary',
      kind: 'textarea',
      localized: true,
      max: 300,
      section: 'Basics',
    },
    { name: 'featured', label: 'Featured', kind: 'switch', section: 'Basics' },
    {
      name: 'location',
      label: 'Location',
      kind: 'group',
      help: 'The deposit editor holds the map pin; projects only keep a place name.',
      section: 'Basics',
      itemFields: [
        { name: 'name', label: 'Place', kind: 'text', max: 150 },
        { name: 'district', label: 'District', kind: 'text', max: 100 },
      ],
    },
    { name: 'body', label: 'Body', kind: 'richtext', localized: true, section: 'Body' },
    {
      name: 'facts',
      label: 'Facts',
      kind: 'pairs',
      maxItems: 20,
      help: 'Figures only from the blueprint or assay data; unknown → [CONFIRM].',
      section: 'Body',
    },
    { name: 'coverImage', label: 'Cover image', kind: 'image', section: 'Images' },
    { name: 'gallery', label: 'Gallery', kind: 'images', maxItems: 40, section: 'Images' },
  ],
  schema: z.object({
    title: localizedRule(150, 2),
    slug: slugRule,
    mineral: z.enum(MINERALS, { errorMap: () => ({ message: 'Choose a mineral' }) }),
    status: z.enum(PROJECT_STATUSES),
    summary: localizedRule(300),
    featured: z.boolean(),
    // passthrough: keep stored lat/lng, which this form doesn't edit.
    location: z.object({ name: textRule(150), district: textRule(100) }).passthrough(),
    body: localizedRule(100_000),
    facts: z
      .array(z.object({ label: textRule(60), value: textRule(120) }))
      .max(20, 'Up to 20 facts'),
    coverImage: imageRule,
    gallery: imagesRule(40),
    published: z.boolean(),
    publishedAt: z.string(),
    seo: seoRule,
  }),
  seo: true,
  slug: true,
  schedulable: true,
};

// ── Posts (backend postCreate) — retired from the public site ───────────────

const posts: ResourceConfig = {
  key: 'posts',
  label: 'Posts',
  singular: 'post',
  apiPath: '/admin/posts',
  titleField: 'title',
  visibleField: 'published',
  localized: LOCALIZED.posts,
  columns: [
    { key: 'title', label: 'Title' },
    { key: 'status', label: 'Status' },
    {
      key: 'publishedAt',
      label: 'Published',
      sortable: true,
      render: (row: { publishedAt?: string | null }) =>
        row.publishedAt ? formatDate(row.publishedAt) : '—',
    },
    updatedColumn,
  ],
  fields: [
    titleField,
    {
      name: 'excerpt',
      label: 'Excerpt',
      kind: 'textarea',
      localized: true,
      max: 300,
      section: 'Basics',
    },
    { name: 'author', label: 'Author', kind: 'text', max: 100, section: 'Basics' },
    {
      name: 'tags',
      label: 'Tags',
      kind: 'list',
      max: 40,
      maxItems: 12,
      help: 'Saved in lowercase.',
      section: 'Basics',
    },
    { name: 'body', label: 'Body', kind: 'richtext', localized: true, section: 'Body' },
    { name: 'coverImage', label: 'Cover image', kind: 'image', section: 'Image' },
  ],
  schema: z.object({
    title: localizedRule(150, 2),
    slug: slugRule,
    excerpt: localizedRule(300),
    author: textRule(100),
    tags: stringList(40, 12, 'tags'),
    body: localizedRule(100_000),
    coverImage: imageRule,
    published: z.boolean(),
    publishedAt: z.string(),
    seo: seoRule,
  }),
  seo: true,
  slug: true,
  schedulable: true,
};

// ── Jobs (backend jobCreate) — retired from the public site ─────────────────

const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship'] as const;
const JOB_TYPE_LABELS: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
};

const jobs: ResourceConfig = {
  key: 'jobs',
  label: 'Jobs',
  singular: 'job',
  apiPath: '/admin/jobs',
  titleField: 'title',
  visibleField: 'isOpen',
  localized: LOCALIZED.jobs,
  columns: [
    { key: 'title', label: 'Title' },
    { key: 'department', label: 'Department' },
    { key: 'status', label: 'Status' },
    {
      key: 'deadline',
      label: 'Deadline',
      sortable: true,
      render: (row: { deadline?: string | null }) =>
        row.deadline ? formatDate(row.deadline) : '—',
    },
    updatedColumn,
  ],
  filters: [{ key: 'type', label: 'Type', options: optionsOf(JOB_TYPES, JOB_TYPE_LABELS) }],
  fields: [
    titleField,
    { name: 'department', label: 'Department', kind: 'text', max: 100, section: 'Basics' },
    { name: 'location', label: 'Location', kind: 'text', max: 150, section: 'Basics' },
    {
      name: 'type',
      label: 'Type',
      kind: 'select',
      options: optionsOf(JOB_TYPES, JOB_TYPE_LABELS),
      section: 'Basics',
    },
    {
      name: 'deadline',
      label: 'Deadline',
      kind: 'date',
      help: 'The job leaves the site after this day. Leave empty for no deadline.',
      section: 'Basics',
    },
    {
      name: 'description',
      label: 'Description',
      kind: 'richtext',
      localized: true,
      section: 'Description',
    },
    {
      name: 'requirements',
      label: 'Requirements',
      kind: 'list',
      max: 300,
      maxItems: 40,
      section: 'Description',
    },
  ],
  schema: z.object({
    title: localizedRule(150, 2),
    slug: slugRule,
    department: textRule(100),
    location: textRule(150),
    type: z.enum(JOB_TYPES),
    deadline: dateRule,
    description: localizedRule(100_000),
    requirements: stringList(300, 40, 'requirements'),
    isOpen: z.boolean(),
    seo: seoRule,
  }),
  seo: true,
  slug: true,
};

/** Configured resources. Deposits land in Task 9; until then their route stays "coming soon". */
export const RESOURCES: Partial<Record<ResourceKey, ResourceConfig>> = {
  products,
  team,
  services,
  projects,
  posts,
  jobs,
};

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
