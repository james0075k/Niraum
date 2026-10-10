import { createHash } from 'node:crypto';
import {
  SETTINGS_ID,
  SiteSettings,
  type Address,
  type ISiteSettings,
} from '../models/SiteSettings.js';
import { rebuild } from '../jobs/rebuild.js';
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
function toPublic(s: ISiteSettings) {
  return {
    companyName: s.companyName,
    legalName: s.legalName,
    motto: s.motto,
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
    footer: { about: s.footer.about, links: s.footer.links.map((l) => ({ ...l })) },
    theme: { defaultMode: s.theme.defaultMode },
  };
}

let cache: { body: PublicSettings; etag: string; expires: number } | null = null;

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

  /** Public projection with a strong ETag, cached in memory for 60 s. */
  async getPublic(): Promise<{ body: PublicSettings; etag: string }> {
    if (cache && cache.expires > Date.now()) return cache;
    const body = toPublic(await settingsService.get());
    const etag = `"${createHash('sha1').update(JSON.stringify(body)).digest('base64url')}"`;
    cache = { body, etag, expires: Date.now() + CACHE_TTL_MS };
    return cache;
  },

  invalidate(): void {
    cache = null;
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

    const { address, location, logo, contact, seo, footer, ...rest } = input;
    doc.set(rest);
    if (logo) doc.set('logo', { ...before.logo, ...logo });
    if (contact) doc.set('contact', { ...before.contact, ...contact });
    if (seo) doc.set('seo', { ...before.seo, ...seo });
    if (footer) doc.set('footer', { ...before.footer, ...footer });

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
    return { settings: after, warnings };
  },
};
