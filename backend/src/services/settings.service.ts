import { createHash } from 'node:crypto';
import {
  SETTINGS_ID,
  SiteSettings,
  type Address,
  type ISiteSettings,
} from '../models/SiteSettings.js';
import { rebuild } from '../jobs/rebuild.js';
import {
  mergeLocalized,
  pickLang,
  resolveLocalized,
  type Lang,
} from '../models/schemas/LocalizedString.js';
import { diffFields } from '../utils/diff.js';
import type { SettingsUpdateBody } from '../validators/settings.js';
import { auditService, type Actor } from './audit.service.js';
import { addressToQuery, geocodeService } from './geocode.service.js';

const CACHE_TTL_MS = 60_000;

export interface Warning {
  code: 'GEOCODE_FAILED' | 'GEOCODE_APPROXIMATE';
  message: string;
}

export type PublicSettings = ReturnType<typeof toPublic>;

/** Only what the public site needs — no audit fields, no manualOverride, no inactive socials. */
function toPublic(s: ISiteSettings, lang: Lang) {
  return {
    companyName: s.companyName,
    legalName: s.legalName,
    motto: pickLang(s.motto, lang),
    logo: { light: s.logo?.light ?? null, dark: s.logo?.dark ?? null },
    contact: {
      phone: s.contact.phone,
      email: s.contact.email,
      whatsapp: s.contact.whatsapp ?? null,
    },
    address: { ...s.address },
    location: {
      lat: s.location.lat,
      lng: s.location.lng,
      zoom: s.location.zoom,
      approximate: s.location.approximate,
    },
    officeHours: s.officeHours,
    social: s.social
      .filter((l) => l.isActive === true)
      .sort((a, b) => a.order - b.order)
      .map((l) => ({ platform: l.platform, url: l.url, isActive: l.isActive, order: l.order })),
    seo: { ...s.seo, keywords: [...s.seo.keywords] },
    footer: {
      about: pickLang(s.footer.about, lang),
      links: s.footer.links.map((l) => ({ ...l })),
    },
    theme: { defaultMode: s.theme.defaultMode },
    publicAssayDetail: s.publicAssayDetail ?? false,
    defaultLanguage: s.defaultLanguage ?? 'en',
  };
}

/**
 * Admin shape: English strings where the API used to return strings, plus `translations`
 * with the full `{ en, ne }` values (Phase 4.5 — keeps existing clients working).
 */
export function settingsAdminView(s: ISiteSettings) {
  return {
    ...resolveLocalized(s, 'en'),
    translations: { motto: s.motto, footer: { about: s.footer?.about } },
  };
}

const cache = new Map<Lang, { body: PublicSettings; etag: string; expires: number }>();

export const settingsService = {
  /** The singleton, created with defaults on first access. */
  async get(): Promise<ISiteSettings> {
    const existing = await SiteSettings.findById(SETTINGS_ID).lean<ISiteSettings>();
    if (existing) return existing;
    try {
      return (await SiteSettings.create({ _id: SETTINGS_ID })).toObject();
    } catch {
      // Lost a create race — the other request made it.
      const doc = await SiteSettings.findById(SETTINGS_ID).lean<ISiteSettings>();
      if (!doc) throw new Error('Site settings unavailable');
      return doc;
    }
  },

  /** Public projection for one language with a strong ETag, cached in memory for 60 s. */
  async getPublic(lang: Lang = 'en'): Promise<{ body: PublicSettings; etag: string }> {
    const hit = cache.get(lang);
    if (hit && hit.expires > Date.now()) return hit;
    const body = toPublic(await settingsService.get(), lang);
    const etag = `"${createHash('sha1').update(JSON.stringify(body)).digest('base64url')}"`;
    const entry = { body, etag, expires: Date.now() + CACHE_TTL_MS };
    cache.set(lang, entry);
    return entry;
  },

  invalidate(): void {
    cache.clear();
  },

  /** Admin preview: coordinates for an address, nothing saved. */
  async previewGeocode(address: Partial<Address>) {
    const current = await settingsService.get();
    return geocodeService.geocodeAddress({ ...current.address, ...address });
  },

  /**
   * Updates settings. When the address changes and the pin isn't manually set, the address
   * is geocoded; on failure the old coordinates stay and a warning tells the admin to drop
   * a pin by hand.
   */
  async update(input: SettingsUpdateBody, actor: Actor) {
    await settingsService.get();
    const doc = await SiteSettings.findById(SETTINGS_ID);
    if (!doc) throw new Error('Site settings unavailable');
    const before = doc.toObject();
    const warnings: Warning[] = [];

    const { address, location, logo, contact, seo, footer, motto, ...rest } = input;
    doc.set(rest);
    if (motto) doc.set('motto', mergeLocalized(before.motto, motto));
    if (logo) doc.set('logo', { ...before.logo, ...logo });
    if (contact) doc.set('contact', { ...before.contact, ...contact });
    if (seo) doc.set('seo', { ...before.seo, ...seo });
    if (footer) {
      doc.set('footer', {
        ...before.footer,
        ...footer,
        about: footer.about
          ? mergeLocalized(before.footer.about, footer.about)
          : before.footer.about,
      });
    }

    const nextAddress: Address = { ...before.address, ...address };
    const addressChanged =
      !!address && addressToQuery(nextAddress) !== addressToQuery(before.address);
    if (address) doc.set('address', nextAddress);

    const manualOverride = location?.manualOverride ?? before.location.manualOverride;
    const nextLocation = { ...before.location, ...location, manualOverride };

    if (location?.lat !== undefined && manualOverride) {
      // Admin dropped the pin — that's the confirmed office location.
      nextLocation.approximate = false;
    } else if (addressChanged && !manualOverride) {
      const result = await geocodeService.geocodeAddress(nextAddress);
      if (result.ok) {
        nextLocation.lat = result.lat;
        nextLocation.lng = result.lng;
        nextLocation.approximate = result.approximate;
        nextLocation.geocodedAt = new Date();
        if (result.approximate) {
          warnings.push({
            code: 'GEOCODE_APPROXIMATE',
            message: 'Only the city could be located — check the pin and adjust it if needed.',
          });
        }
      } else {
        // Keep the previous coordinates.
        nextLocation.lat = before.location.lat;
        nextLocation.lng = before.location.lng;
        warnings.push({
          code: 'GEOCODE_FAILED',
          message:
            result.reason === 'not_found'
              ? 'Address could not be located. The map pin was not moved — drop it manually.'
              : 'Geocoding service unavailable. The map pin was not moved — drop it manually.',
        });
      }
    }
    doc.set('location', nextLocation);
    if (actor.userId) doc.set('updatedBy', actor.userId);

    await doc.save();
    settingsService.invalidate();

    const after = doc.toObject();
    await auditService.record(actor, {
      action: 'update',
      entity: 'SiteSettings',
      entityId: SETTINGS_ID,
      diff: diffFields(
        before as unknown as Record<string, unknown>,
        after as unknown as Record<string, unknown>,
      ),
    });
    rebuild.schedule('settings');
    return { settings: settingsAdminView(after), warnings };
  },
};
