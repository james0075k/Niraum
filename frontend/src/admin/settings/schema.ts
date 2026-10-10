import { z } from 'zod';

/**
 * Settings form schemas (one per tab) and the mapping between the admin API shape and form
 * values. Mirrors backend/src/validators/settings.ts — `PUT /admin/settings` is `.strict()`,
 * so payload builders only ever emit known keys.
 */

export const SOCIAL_PLATFORMS = [
  'facebook',
  'instagram',
  'linkedin',
  'youtube',
  'x',
  'tiktok',
  'whatsapp',
  'viber',
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  x: 'X',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
  viber: 'Viber',
};

export type ThemeMode = 'light' | 'dark' | 'system';
export type Lang = 'en' | 'ne';

export interface LocalizedValue {
  en: string;
  ne?: string;
}

export interface Address {
  line1: string;
  city: string;
  district: string;
  province: string;
  country: string;
  postalCode: string;
}

/** `GET /admin/settings` → `data`: English strings plus `translations` with `{ en, ne }`. */
export interface AdminSettings {
  companyName: string;
  legalName: string;
  motto: string;
  logo: { light: string | null; dark: string | null };
  contact: { phone: string[]; email: string[]; whatsapp: string | null };
  address: Address;
  location: {
    lat: number;
    lng: number;
    zoom: number;
    manualOverride: boolean;
    approximate: boolean;
    geocodedAt?: string | null;
  };
  officeHours: string;
  social: { platform: SocialPlatform; url: string; isActive: boolean; order: number }[];
  seo: { defaultTitle: string; defaultDescription: string; ogImage: string; keywords: string[] };
  footer: { about: string; links: { label: string; href: string }[] };
  theme: { defaultMode: ThemeMode };
  publicAssayDetail: boolean;
  defaultLanguage: Lang;
  translations?: { motto?: LocalizedValue; footer?: { about?: LocalizedValue } };
}

export interface SettingsWarning {
  code: 'GEOCODE_FAILED' | 'GEOCODE_APPROXIMATE';
  message: string;
}

export const SETTINGS_KEY = ['admin', 'settings'] as const;

export const WARNING_TEXT = {
  GEOCODE_APPROXIMATE: 'Pin placed at city level — drag it to the exact spot',
  GEOCODE_FAILED: "Couldn't find that address — the pin wasn't moved. Drag it to set the location.",
} as const;

// ---- shared field rules (mirror the backend) ----

const text = (max: number) => z.string().trim().max(max, `At most ${max} characters`);
const required = (max: number) => text(max).min(1, 'Required');

/** https:// URL, a site path (/logo.svg) or empty — backend `urlOrPath`. */
export const urlOrPath = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || v.startsWith('/') || /^https:\/\//.test(v), 'Use https:// or a /path');

const localizedForm = (max: number) => z.object({ en: required(max), ne: text(max) });

/** Form value for a localized field: `translations` wins, else the English string. */
function localizedValue(english: string, full: LocalizedValue | undefined) {
  return { en: full?.en ?? english ?? '', ne: full?.ne ?? '' };
}

/**
 * Payload for a localized field: `{ en }` keeps the stored Nepali; `{ en, ne }` only when the
 * Nepali input was touched (so saving English never wipes Nepali).
 */
export function localizedPayload(
  value: { en: string; ne: string },
  dirty: { en?: boolean; ne?: boolean } | boolean | undefined,
): LocalizedValue {
  const neDirty = typeof dirty === 'object' ? !!dirty.ne : false;
  return neDirty ? { en: value.en, ne: value.ne } : { en: value.en };
}

const orNull = (v: string) => (v.trim() === '' ? null : v.trim());

// ---- Company ----

export const companySchema = z.object({
  companyName: required(100),
  legalName: required(150),
  motto: localizedForm(150),
  logo: z.object({ light: urlOrPath, dark: urlOrPath }),
});
export type CompanyValues = z.infer<typeof companySchema>;

export const toCompanyValues = (s: AdminSettings): CompanyValues => ({
  companyName: s.companyName ?? '',
  legalName: s.legalName ?? '',
  motto: localizedValue(s.motto, s.translations?.motto),
  logo: { light: s.logo?.light ?? '', dark: s.logo?.dark ?? '' },
});

export const companyPayload = (v: CompanyValues, dirty: { motto?: { ne?: boolean } }) => ({
  companyName: v.companyName,
  legalName: v.legalName,
  motto: localizedPayload(v.motto, dirty.motto),
  logo: { light: orNull(v.logo.light), dark: orNull(v.logo.dark) },
});

// ---- Contact ----

const listItem = <T extends z.ZodTypeAny>(value: T) => z.object({ value });

export const contactSchema = z.object({
  phones: z.array(listItem(text(30))).max(5, 'Up to 5 phone numbers'),
  emails: z
    .array(
      listItem(
        text(254).refine(
          (v) => v === '' || z.string().email().safeParse(v).success,
          'Enter a valid email',
        ),
      ),
    )
    .max(5, 'Up to 5 emails'),
  whatsapp: text(30),
  officeHours: text(200),
});
export type ContactValues = z.infer<typeof contactSchema>;

export const toContactValues = (s: AdminSettings): ContactValues => ({
  phones: (s.contact?.phone ?? []).map((value) => ({ value })),
  emails: (s.contact?.email ?? []).map((value) => ({ value })),
  whatsapp: s.contact?.whatsapp ?? '',
  officeHours: s.officeHours ?? '',
});

const nonEmpty = (rows: { value: string }[]) =>
  rows.map((r) => r.value.trim()).filter((v) => v !== '');

export const contactPayload = (v: ContactValues) => ({
  contact: { phone: nonEmpty(v.phones), email: nonEmpty(v.emails), whatsapp: orNull(v.whatsapp) },
  officeHours: v.officeHours,
});

// ---- Address & map ----

export const addressSchema = z.object({
  line1: text(200),
  city: text(100),
  district: text(100),
  province: text(100),
  country: text(100),
  postalCode: text(20),
});

export const addressMapSchema = z.object({
  address: addressSchema,
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  zoom: z.number().int().min(1).max(20),
  manualOverride: z.boolean(),
});
export type AddressMapValues = z.infer<typeof addressMapSchema>;

const EMPTY_ADDRESS: Address = {
  line1: '',
  city: '',
  district: '',
  province: '',
  country: '',
  postalCode: '',
};

export const toAddressMapValues = (s: AdminSettings): AddressMapValues => ({
  address: { ...EMPTY_ADDRESS, ...s.address },
  lat: s.location?.lat ?? null,
  lng: s.location?.lng ?? null,
  zoom: s.location?.zoom ?? 15,
  manualOverride: s.location?.manualOverride ?? false,
});

/** Coordinates only when the pin moved (lat/lng are sent together). */
export const addressMapPayload = (v: AddressMapValues, dirty: { lat?: boolean; lng?: boolean }) => {
  const moved = (dirty.lat || dirty.lng) && v.lat !== null && v.lng !== null;
  return {
    address: v.address,
    location: {
      ...(moved ? { lat: v.lat as number, lng: v.lng as number } : {}),
      zoom: v.zoom,
      manualOverride: v.manualOverride,
    },
  };
};

// ---- Social ----

export const socialSchema = z.object({
  social: z
    .array(
      z.object({
        platform: z.enum(SOCIAL_PLATFORMS),
        url: z.string().trim().min(1, 'Required').url('Enter a full URL').max(500),
        isActive: z.boolean(),
      }),
    )
    .max(16, 'Up to 16 links'),
});
export type SocialValues = z.infer<typeof socialSchema>;

export const toSocialValues = (s: AdminSettings): SocialValues => ({
  social: [...(s.social ?? [])]
    .sort((a, b) => a.order - b.order)
    .map(({ platform, url, isActive }) => ({ platform, url, isActive })),
});

/** `order` = row index, so the list order on screen is the order on the site. */
export const socialPayload = (v: SocialValues) => ({
  social: v.social.map((row, order) => ({ ...row, order })),
});

// ---- SEO ----

export const seoSchema = z.object({
  defaultTitle: text(70),
  defaultDescription: text(170),
  ogImage: urlOrPath,
  keywords: z.array(text(50)).max(30, 'Up to 30 keywords'),
});
export type SeoValues = z.infer<typeof seoSchema>;

export const toSeoValues = (s: AdminSettings): SeoValues => ({
  defaultTitle: s.seo?.defaultTitle ?? '',
  defaultDescription: s.seo?.defaultDescription ?? '',
  ogImage: s.seo?.ogImage ?? '',
  keywords: [...(s.seo?.keywords ?? [])],
});

export const seoPayload = (v: SeoValues) => ({ seo: v });

// ---- Footer ----

export const footerSchema = z.object({
  about: localizedForm(600),
  links: z
    .array(z.object({ label: required(60), href: urlOrPath.refine((v) => v !== '', 'Required') }))
    .max(20, 'Up to 20 links'),
});
export type FooterValues = z.infer<typeof footerSchema>;

export const toFooterValues = (s: AdminSettings): FooterValues => ({
  about: localizedValue(s.footer?.about, s.translations?.footer?.about),
  links: (s.footer?.links ?? []).map(({ label, href }) => ({ label, href })),
});

export const footerPayload = (v: FooterValues, dirty: { about?: { ne?: boolean } }) => ({
  footer: { about: localizedPayload(v.about, dirty.about), links: v.links },
});

// ---- Appearance ----

export const appearanceSchema = z.object({
  defaultMode: z.enum(['light', 'dark', 'system']),
  defaultLanguage: z.enum(['en', 'ne']),
  publicAssayDetail: z.boolean(),
});
export type AppearanceValues = z.infer<typeof appearanceSchema>;

export const toAppearanceValues = (s: AdminSettings): AppearanceValues => ({
  defaultMode: s.theme?.defaultMode ?? 'system',
  defaultLanguage: s.defaultLanguage ?? 'en',
  publicAssayDetail: s.publicAssayDetail ?? false,
});

export const appearancePayload = (v: AppearanceValues) => ({
  theme: { defaultMode: v.defaultMode },
  defaultLanguage: v.defaultLanguage,
  publicAssayDetail: v.publicAssayDetail,
});
