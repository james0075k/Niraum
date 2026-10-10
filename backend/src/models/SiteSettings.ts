import { Schema, model, type Types } from 'mongoose';
import {
  LANGS,
  localizedPath,
  type Lang,
  type LocalizedString,
} from './schemas/LocalizedString.js';

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

export interface Address {
  line1: string;
  city: string;
  district: string;
  province: string;
  country: string;
  postalCode: string;
}

export interface SiteLocation {
  lat: number;
  lng: number;
  zoom: number;
  /** True when the admin dropped the pin by hand — address changes never move it. */
  manualOverride: boolean;
  /** True while the pin is a city-level fallback, not the confirmed office. */
  approximate: boolean;
  geocodedAt: Date | null;
}

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  isActive: boolean;
  order: number;
}

export interface ISiteSettings {
  _id: string;
  companyName: string;
  legalName: string;
  motto: LocalizedString;
  logo: { light: string | null; dark: string | null };
  contact: { phone: string[]; email: string[]; whatsapp: string | null };
  address: Address;
  location: SiteLocation;
  officeHours: string;
  social: SocialLink[];
  seo: { defaultTitle: string; defaultDescription: string; ogImage: string; keywords: string[] };
  footer: { about: LocalizedString; links: { label: string; href: string }[] };
  theme: { defaultMode: 'light' | 'dark' | 'system' };
  /** Phase 4.5: sample-level assay rows are public only when this is on (default off). */
  publicAssayDetail: boolean;
  /** Phase 4.5: language for visitors with no saved or detectable preference. */
  defaultLanguage: Lang;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const SETTINGS_ID = 'site';

/** Seed defaults (docs/ARCHITECTURE.md §6). Contact details are placeholders until confirmed. */
export const defaultAddress: Address = {
  line1: 'Lalitpur-13',
  city: 'Lalitpur',
  district: 'Lalitpur',
  province: 'Bagmati',
  country: 'Nepal',
  postalCode: '',
};

/** Lalitpur city centre — used only until geocoding / the admin confirms the pin. */
export const fallbackLocation = { lat: 27.6588, lng: 85.3247, zoom: 14 };

const settingsSchema = new Schema<ISiteSettings>(
  {
    _id: { type: String, default: SETTINGS_ID },
    companyName: { type: String, default: 'Niraum Metals' },
    legalName: { type: String, default: 'Niraum Metals Pvt. Ltd.' },
    motto: localizedPath({ maxlength: 150, default: 'Strength Forged For Generations' }),
    logo: { light: { type: String, default: null }, dark: { type: String, default: null } },
    contact: {
      phone: { type: [String], default: ['[PLACEHOLDER: phone]'] },
      email: { type: [String], default: ['[PLACEHOLDER: email]'] },
      whatsapp: { type: String, default: null },
    },
    address: {
      line1: { type: String, default: defaultAddress.line1 },
      city: { type: String, default: defaultAddress.city },
      district: { type: String, default: defaultAddress.district },
      province: { type: String, default: defaultAddress.province },
      country: { type: String, default: defaultAddress.country },
      postalCode: { type: String, default: '' },
    },
    location: {
      lat: { type: Number, default: fallbackLocation.lat, min: -90, max: 90 },
      lng: { type: Number, default: fallbackLocation.lng, min: -180, max: 180 },
      zoom: { type: Number, default: fallbackLocation.zoom, min: 1, max: 20 },
      manualOverride: { type: Boolean, default: false },
      approximate: { type: Boolean, default: true },
      geocodedAt: { type: Date, default: null },
    },
    officeHours: { type: String, default: '[PLACEHOLDER: office hours]' },
    social: {
      type: [
        new Schema<SocialLink>(
          {
            platform: { type: String, enum: SOCIAL_PLATFORMS, required: true },
            url: { type: String, required: true },
            isActive: { type: Boolean, default: true },
            order: { type: Number, default: 0 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    seo: {
      defaultTitle: { type: String, default: 'Niraum Metals — Mining & Metals, Nepal' },
      defaultDescription: {
        type: String,
        default: 'Iron ore, metal minerals and stone aggregates from Nepal.',
      },
      ogImage: { type: String, default: '/og-image.jpg' },
      keywords: { type: [String], default: [] },
    },
    footer: {
      about: localizedPath({ maxlength: 600 }),
      links: {
        type: [new Schema({ label: String, href: String }, { _id: false })],
        default: [],
      },
    },
    theme: {
      defaultMode: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    },
    publicAssayDetail: { type: Boolean, default: false },
    defaultLanguage: { type: String, enum: LANGS, default: 'en' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, versionKey: false },
);

export const SiteSettings = model<ISiteSettings>('SiteSettings', settingsSchema, 'sitesettings');
