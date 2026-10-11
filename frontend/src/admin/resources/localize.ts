/**
 * Admin API ↔ form values for LocalizedString fields (Phase 4.5).
 *
 * Admin docs arrive as English strings plus `translations: { field: { en, ne? } }` (arrays of
 * objects keep their shape, with each localized sub-value as `{ en, ne? }`). Forms edit
 * `{ en, ne }` with `ne` always a string. Payloads send `{ en }` unless the Nepali input was
 * touched, so saving English never wipes Nepali on the server (`mergeLocalized`).
 */

export type Localized = { en: string; ne: string };

type Plain = Record<string, unknown>;

const isPlain = (v: unknown): v is Plain => !!v && typeof v === 'object' && !Array.isArray(v);

/** `{ en: string, ne?: string }` and nothing else — same rule as the backend `isLocalized`. */
export function isLocalizedValue(v: unknown): v is { en: string; ne?: string } {
  if (!isPlain(v)) return false;
  const keys = Object.keys(v);
  return keys.length > 0 && keys.every((k) => k === 'en' || k === 'ne') && typeof v.en === 'string';
}

const toLocalized = (v: unknown): Localized => {
  if (isLocalizedValue(v)) return { en: v.en ?? '', ne: v.ne ?? '' };
  return { en: typeof v === 'string' ? v : '', ne: '' };
};

/** Deep: every `{ en, ne? }` inside array items becomes `{ en, ne }`. */
const fillItem = (item: unknown): unknown => {
  if (isLocalizedValue(item)) return toLocalized(item);
  if (Array.isArray(item)) return item.map(fillItem);
  if (isPlain(item))
    return Object.fromEntries(Object.entries(item).map(([k, v]) => [k, fillItem(v)]));
  return item;
};

/**
 * Admin doc → form values: each localized field becomes `{ en, ne }` (arrays per item,
 * objects per key).
 */
export function toFormValues<T extends Record<string, unknown>>(
  doc: T & { translations?: Record<string, { en: string; ne?: string } | unknown[]> },
  fields: readonly string[],
): Record<string, unknown> {
  const { translations, ...rest } = doc as Plain & { translations?: Plain };
  const out: Plain = { ...rest };
  for (const field of fields) {
    const full = translations?.[field] ?? rest[field];
    if (full === undefined) continue;
    // An object of localized values (a deposit's `location`) is filled key by key.
    out[field] =
      Array.isArray(full) || (isPlain(full) && !isLocalizedValue(full))
        ? fillItem(full)
        : toLocalized(full);
  }
  return out;
}

/** True when any leaf of a react-hook-form `dirtyFields` entry is true. */
export function isDirtyDeep(d: unknown): boolean {
  if (d === true) return true;
  if (Array.isArray(d)) return d.some(isDirtyDeep);
  if (isPlain(d)) return Object.values(d).some(isDirtyDeep);
  return false;
}

/**
 * Payload for one localized value: `{ en }` keeps the stored Nepali; `{ en, ne }` only when
 * the Nepali input was touched (`ne: ''` then clears it on purpose).
 */
export function localizedPayload(
  value: { en: string; ne?: string },
  dirty: { en?: boolean; ne?: boolean } | boolean | undefined,
): { en: string; ne?: string } {
  const neDirty = typeof dirty === 'object' ? !!dirty.ne : false;
  return neDirty ? { en: value.en, ne: value.ne ?? '' } : { en: value.en };
}

/** A whole value with every `{ en, ne }` reduced to `{ en }` or `{ en, ne }` (Nepali filled). */
const filledOnly = (v: unknown): unknown => {
  if (isLocalizedValue(v)) return v.ne?.trim() ? { en: v.en, ne: v.ne } : { en: v.en };
  if (Array.isArray(v)) return v.map(filledOnly);
  if (isPlain(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, filledOnly(x)]));
  return v;
};

/**
 * Form values → request body.
 * - Update (default): only dirty fields. A localized field sends `{ en }`, or `{ en, ne }` when
 *   its Nepali input was touched. A localized array is replaced whole on the server, so it is
 *   sent whole with each item's Nepali (when filled).
 * - Create (`{ all: true }`): every field; localized values carry `ne` only when filled.
 */
export function toPayload(
  values: Record<string, unknown>,
  fields: readonly string[],
  dirty: Record<string, unknown>,
  opts: { all?: boolean } = {},
): Record<string, unknown> {
  const out: Plain = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    const localized = fields.includes(key);
    if (opts.all) {
      out[key] = localized ? filledOnly(value) : value;
      continue;
    }
    if (!isDirtyDeep(dirty[key])) continue;
    if (localized && isLocalizedValue(value)) {
      out[key] = localizedPayload(value, dirty[key] as { en?: boolean; ne?: boolean });
    } else {
      out[key] = localized ? filledOnly(value) : value;
    }
  }
  return out;
}
