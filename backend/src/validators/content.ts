import { z } from 'zod';
import { DEPOSIT_STATUSES } from '../models/Deposit.js';
import { JOB_TYPES } from '../models/Job.js';
import { MINERALS, PROJECT_STATUSES } from '../models/Project.js';
import { SERVICE_ICONS } from '../models/Service.js';
import {
  adminListQuery,
  boolQuery,
  imageInput,
  localized,
  paginationQuery,
  seoInput,
  slugInput,
} from './common.js';

// Text fields accept a string (English) or `{ en, ne? }` (Phase 4.5 LocalizedString).
const text = (max: number) => z.string().trim().max(max);
const title = localized(z.string().trim().min(2).max(150), text(150));
const html = localized(z.string().max(100_000), z.string().max(100_000));
const short = (max: number) => localized(text(max), text(max));

// ── Projects ────────────────────────────────────────────────────────────────
export const projectCreate = z.object({
  title,
  slug: slugInput.optional(),
  mineral: z.enum(MINERALS),
  status: z.enum(PROJECT_STATUSES).default('exploration'),
  location: z
    .object({
      name: z.string().trim().max(150).default(''),
      district: z.string().trim().max(100).default(''),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
    })
    .default({}),
  summary: short(300).default(''),
  body: html.default(''),
  facts: z
    .array(z.object({ label: z.string().trim().max(60), value: z.string().trim().max(120) }))
    .max(20)
    .default([]),
  coverImage: imageInput.nullable().default(null),
  gallery: z.array(imageInput).max(40).default([]),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  isSample: z.boolean().default(false),
  seo: seoInput.optional(),
});
export const projectUpdate = projectCreate.partial().strict();

const projectFilters = {
  status: z.enum(PROJECT_STATUSES).optional(),
  mineral: z.enum(MINERALS).optional(),
  featured: boolQuery.optional(),
};
export const projectPublicQuery = paginationQuery.extend(projectFilters);
export const projectAdminQuery = adminListQuery.extend(projectFilters);

// ── Posts ───────────────────────────────────────────────────────────────────
export const postCreate = z.object({
  title,
  slug: slugInput.optional(),
  excerpt: short(300).default(''),
  body: html.default(''),
  coverImage: imageInput.nullable().default(null),
  tags: z.array(z.string().trim().toLowerCase().max(40)).max(12).default([]),
  author: z.string().trim().max(100).optional(),
  published: z.boolean().default(false),
  publishedAt: z.coerce.date().optional(),
  isSample: z.boolean().default(false),
  seo: seoInput.optional(),
});
export const postUpdate = postCreate.partial().strict();

const postFilters = { tag: z.string().trim().toLowerCase().max(40).optional() };
export const postPublicQuery = paginationQuery.extend(postFilters);
export const postAdminQuery = adminListQuery.extend(postFilters);

// ── Jobs ────────────────────────────────────────────────────────────────────
export const jobCreate = z.object({
  title,
  slug: slugInput.optional(),
  department: z.string().trim().max(100).default(''),
  location: z.string().trim().max(150).default(''),
  type: z.enum(JOB_TYPES).default('full-time'),
  description: html.default(''),
  requirements: z.array(z.string().trim().max(300)).max(40).default([]),
  deadline: z.coerce.date().nullable().default(null),
  isOpen: z.boolean().default(false),
  seo: seoInput.optional(),
});
export const jobUpdate = jobCreate.partial().strict();

const jobFilters = {
  department: z.string().trim().max(100).optional(),
  type: z.enum(JOB_TYPES).optional(),
};
export const jobPublicQuery = paginationQuery.extend(jobFilters);
export const jobAdminQuery = adminListQuery.extend(jobFilters);

// ── Team ────────────────────────────────────────────────────────────────────
export const teamCreate = z.object({
  name: z.string().trim().min(2).max(100),
  role: short(100).default(''),
  bio: short(2000).default(''),
  photo: imageInput.nullable().default(null),
  order: z.number().int().min(0).max(1000).default(0),
  linkedin: z.string().trim().url().max(300).nullable().default(null),
  published: z.boolean().default(true),
  isSample: z.boolean().default(false),
  isFounder: z.boolean().default(false),
  otherVentures: z
    .array(
      z.object({
        company: text(150).min(1),
        role: short(100).default(''),
        sector: short(100).default(''),
        since: z.number().int().min(1900).max(2100).nullable().default(null),
      }),
    )
    .max(20)
    .default([]),
});
export const teamUpdate = teamCreate.partial().strict();
export const teamPublicQuery = paginationQuery;
export const teamAdminQuery = adminListQuery;

// ── Services / operations ───────────────────────────────────────────────────
export const serviceCreate = z.object({
  title,
  slug: slugInput.optional(),
  icon: z.enum(SERVICE_ICONS).default('pickaxe'),
  summary: short(300).default(''),
  body: html.default(''),
  image: imageInput.nullable().default(null),
  highlights: z.array(z.string().trim().max(200)).max(12).default([]),
  stats: z
    .array(
      z.object({
        label: z.string().trim().max(60),
        value: z.number().nullable(),
        suffix: z.string().trim().max(10).optional(),
        placeholder: z.string().trim().max(60).optional(),
      }),
    )
    .max(8)
    .default([]),
  gallery: z.array(imageInput).max(20).default([]),
  order: z.number().int().min(0).max(1000).default(0),
  published: z.boolean().default(true),
});
export const serviceUpdate = serviceCreate.partial().strict();
export const servicePublicQuery = paginationQuery;
export const serviceAdminQuery = adminListQuery;

// ── Products (Phase 4.5) ────────────────────────────────────────────────────
export const productCreate = z.object({
  name: title,
  slug: slugInput.optional(),
  chemicalFormula: text(40).default(''),
  summary: short(600).default(''),
  applications: z
    .array(z.object({ title: short(150), body: short(2000) }))
    .max(12)
    .default([]),
  typicalChemistry: z
    .array(
      z.object({
        oxide: text(20).min(1),
        value: z.number().min(0).max(100),
        unit: text(10).default('%'),
        basis: short(200).default(''),
      }),
    )
    .max(20)
    .default([]),
  sizes: z.array(text(80)).max(12).default([]),
  minOrder: text(150).default(''),
  packing: text(300).default(''),
  image: imageInput.nullable().default(null),
  order: z.number().int().min(0).max(1000).default(0),
  published: z.boolean().default(false),
  seo: seoInput.optional(),
});
export const productUpdate = productCreate.partial().strict();
export const productPublicQuery = paginationQuery;
export const productAdminQuery = adminListQuery;

// ── Deposits (Phase 4.5) ────────────────────────────────────────────────────
const optNum = z.number().nullable();
export const depositCreate = z.object({
  name: title,
  slug: slugInput.optional(),
  summary: short(1000).default(''),
  location: z
    .object({
      district: short(100).default(''),
      municipality: short(100).default(''),
      ward: text(20).default(''),
      province: short(100).default(''),
      topoSheet: text(40).default(''),
      easting: optNum.default(null),
      northing: optNum.default(null),
      spotHeightM: optNum.default(null),
      // WGS-84 only — never a converted local-grid guess.
      lat: z.number().min(-90).max(90).nullable().default(null),
      lng: z.number().min(-180).max(180).nullable().default(null),
    })
    .default({}),
  areas: z
    .array(z.object({ code: text(10).min(1), label: short(150).default('') }))
    .max(20)
    .default([]),
  land: z
    .object({
      surveyHa: optNum.default(null),
      quarryHa: optNum.default(null),
      topsoilYardHa: optNum.default(null),
      wasteYardHa: optNum.default(null),
      officeHa: optNum.default(null),
      approachRoadHa: optNum.default(null),
      totalLandUseHa: optNum.default(null),
      landType: text(100).default(''),
      confirmed: z.boolean().default(false),
    })
    .default({}),
  geologySummary: short(2000).default(''),
  consultant: z.object({ name: text(200).default(''), address: text(200).default('') }).default({}),
  status: z.enum(DEPOSIT_STATUSES).default('studies'),
  statusText: short(300).default(''),
  maps: z.array(imageInput).max(20).default([]),
  published: z.boolean().default(false),
  seo: seoInput.optional(),
});
export const depositUpdate = depositCreate.partial().strict();
export const depositPublicQuery = paginationQuery;
export const depositAdminQuery = adminListQuery;
