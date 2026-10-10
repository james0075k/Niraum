import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { GeocodeCache } from '../models/GeocodeCache.js';
import type { Address } from '../models/SiteSettings.js';

export interface GeoPoint {
  lat: number;
  lng: number;
  displayName: string;
}

export type GeocodeOutcome =
  | (GeoPoint & { ok: true; query: string; approximate: boolean; cached: boolean })
  | { ok: false; reason: 'not_found' | 'unavailable'; query: string };

interface NominatimHit {
  lat: string;
  lon: string;
  display_name?: string;
}

const MIN_INTERVAL_MS = 1000; // Nominatim usage policy: max 1 request per second.
let queue: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

/** Serialises calls and spaces them ≥ 1 s apart, process-wide. */
function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = async () => {
    const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
    return fn();
  };
  const result = queue.then(run, run);
  queue = result.catch(() => undefined);
  return result;
}

const normalise = (q: string) => q.trim().replace(/\s+/g, ' ').toLowerCase();

/** "Lalitpur-13, Lalitpur, Bagmati, Nepal" — empty parts and duplicates dropped. */
export function addressToQuery(a: Partial<Address>, withLine1 = true): string {
  const parts = [
    withLine1 ? a.line1 : undefined,
    a.city,
    a.district,
    a.province,
    a.postalCode,
    a.country,
  ]
    .map((p) => p?.trim())
    .filter((p): p is string => !!p);
  return [...new Set(parts)].join(', ');
}

export const geocodeService = {
  /**
   * One Nominatim search (format=json, limit=1, countrycodes=np), cached 30 days.
   * Returns null when nothing matched; throws when the service is unreachable.
   */
  async search(query: string): Promise<(GeoPoint & { cached: boolean }) | null> {
    const key = normalise(query);
    const hit = await GeocodeCache.findOne({ query: key }).lean();
    if (hit) return { lat: hit.lat, lng: hit.lng, displayName: hit.displayName, cached: true };

    const url = new URL('/search', env.NOMINATIM_URL);
    url.search = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
      countrycodes: 'np',
    }).toString();

    const res = await throttled(() =>
      fetch(url, {
        headers: { 'User-Agent': env.NOMINATIM_USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      }),
    );
    if (!res.ok) throw new Error(`Nominatim responded ${res.status}`);
    const body = (await res.json()) as unknown;
    const first = Array.isArray(body) ? (body[0] as NominatimHit | undefined) : undefined;
    if (!first) return null;

    const point = {
      lat: Number(first.lat),
      lng: Number(first.lon),
      displayName: first.display_name ?? '',
    };
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return null;
    await GeocodeCache.updateOne(
      { query: key },
      { $setOnInsert: { ...point, query: key, createdAt: new Date() } },
      { upsert: true },
    );
    return { ...point, cached: false };
  },

  /**
   * Full address first; if Nominatim has no match (ward numbers like "Lalitpur-13" often
   * don't), retry without line 1 and flag the result as approximate.
   */
  async geocodeAddress(address: Partial<Address>): Promise<GeocodeOutcome> {
    const attempts: { query: string; approximate: boolean }[] = [
      { query: addressToQuery(address, true), approximate: false },
      { query: addressToQuery(address, false), approximate: true },
    ].filter((a, i, all) => a.query && all.findIndex((b) => b.query === a.query) === i);

    const firstQuery = attempts[0]?.query ?? '';
    try {
      for (const { query, approximate } of attempts) {
        const point = await geocodeService.search(query);
        if (point) return { ok: true, query, approximate, ...point };
      }
      return { ok: false, reason: 'not_found', query: firstQuery };
    } catch (err) {
      logger.warn({ err, query: firstQuery }, 'Geocoding failed');
      return { ok: false, reason: 'unavailable', query: firstQuery };
    }
  },
};
