import { z } from 'zod';
import { SOCIAL_PLATFORMS } from '../models/SiteSettings.js';

const text = (max: number) => z.string().trim().max(max);
const urlOrPath = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || v.startsWith('/') || /^https:\/\//.test(v), 'Use https:// or a /path');

export const addressSchema = z
  .object({
    line1: text(200),
    city: text(100),
    district: text(100),
    province: text(100),
    country: text(100),
    postalCode: text(20),
  })
  .partial();

export const locationInput = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    zoom: z.number().int().min(1).max(20),
    manualOverride: z.boolean(),
  })
  .partial()
  .refine((l) => (l.lat === undefined) === (l.lng === undefined), {
    message: 'lat and lng must be sent together',
  });

export const socialSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  url: z.string().trim().url().max(500),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).max(100).default(0),
});

export const settingsUpdateBody = z
  .object({
    companyName: text(100).min(1),
    legalName: text(150).min(1),
    motto: text(150),
    logo: z.object({ light: urlOrPath.nullable(), dark: urlOrPath.nullable() }).partial(),
    contact: z
      .object({
        phone: z.array(text(30)).max(5),
        email: z.array(text(254)).max(5),
        whatsapp: text(30).nullable(),
      })
      .partial(),
    address: addressSchema,
    location: locationInput,
    officeHours: text(200),
    social: z.array(socialSchema).max(16),
    seo: z
      .object({
        defaultTitle: text(70),
        defaultDescription: text(170),
        ogImage: urlOrPath,
        keywords: z.array(text(50)).max(30),
      })
      .partial(),
    footer: z
      .object({
        about: text(600),
        links: z.array(z.object({ label: text(60), href: urlOrPath })).max(20),
      })
      .partial(),
    theme: z.object({ defaultMode: z.enum(['light', 'dark', 'system']) }),
  })
  .partial()
  .strict();

export const geocodeBody = z.object({ address: addressSchema });

export type SettingsUpdateBody = z.infer<typeof settingsUpdateBody>;
