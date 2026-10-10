import { Schema } from 'mongoose';

/** Site languages. `en` is required everywhere; `ne` falls back to `en` until translated. */
export const LANGS = ['en', 'ne'] as const;
export type Lang = (typeof LANGS)[number];

/** A user-facing text field stored in both languages (Phase 4.5). */
export interface LocalizedString {
  en: string;
  ne?: string;
}

/**
 * Mongoose sub-schema for one LocalizedString path. The setter accepts a plain string
 * (stored as `{ en }`), so seeds, tests and legacy writers keep working.
 */
export function localizedPath(
  opts: { maxlength?: number; required?: boolean; default?: string } = {},
) {
  const text = { type: String, trim: true, ...(opts.maxlength && { maxlength: opts.maxlength }) };
  const schema = new Schema<LocalizedString>(
    {
      en: { ...text, default: '', ...(opts.required && { required: true }) },
      ne: text,
    },
    { _id: false },
  );
  return {
    type: schema,
    set: (v: unknown) => (typeof v === 'string' ? { en: v } : v),
    ...(opts.required ? { required: true } : { default: () => ({ en: opts.default ?? '' }) }),
  };
}

const LOCALIZED_KEYS = new Set(['en', 'ne']);

/** `{ en: '…', ne?: '…' }` and nothing else. */
export function isLocalized(value: unknown): value is LocalizedString {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return (
    keys.length > 0 &&
    keys.every((k) => LOCALIZED_KEYS.has(k)) &&
    typeof (value as LocalizedString).en === 'string'
  );
}

/** One LocalizedString → the text for `lang`, falling back to English when untranslated. */
export function pickLang(value: LocalizedString | string | null | undefined, lang: Lang): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return (lang === 'ne' && value.ne?.trim() ? value.ne : value.en) ?? '';
}

/**
 * Deep-resolves every LocalizedString in an API document to plain text for `lang`.
 * Public responses keep the shapes they had before Phase 4.5 (strings, not objects).
 */
export function resolveLocalized<T>(value: T, lang: Lang): T {
  if (isLocalized(value)) return pickLang(value, lang) as T;
  if (Array.isArray(value)) return value.map((v: unknown) => resolveLocalized(v, lang)) as T;
  if (value instanceof Date || !value || typeof value !== 'object') return value;
  // ObjectIds and other class instances are left alone.
  const proto = Object.getPrototypeOf(value) as unknown;
  if (proto !== Object.prototype && proto !== null) return value;
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, resolveLocalized(v, lang)]),
  ) as T;
}

/**
 * Admin view: the same English strings as before (existing clients and tests unchanged) plus
 * `translations` holding the full `{ en, ne }` value of every localized field.
 */
export function adminLocalized(
  doc: Record<string, unknown>,
  fields: readonly string[],
): Record<string, unknown> {
  const translations: Record<string, unknown> = {};
  for (const f of fields) if (doc[f] !== undefined) translations[f] = doc[f];
  return { ...resolveLocalized(doc, 'en'), translations };
}

/**
 * Update merge: a string or `{ en }` write keeps the existing Nepali text unless `ne`
 * is sent explicitly (send `ne: ''` to clear it).
 */
export function mergeLocalized(before: unknown, next: unknown): unknown {
  if (!isLocalized(next)) return next;
  const prev = isLocalized(before) ? before : { en: '' };
  return { ...prev, ...next };
}
