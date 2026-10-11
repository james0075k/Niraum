import type { FieldDef, ResourceConfig } from './config';
import { toFormValues, toPayload } from './localize';

/**
 * Field-kind conversions between admin docs, react-hook-form values and request bodies.
 * Localized values are handled by localize.ts; this file covers everything else (string
 * lists ↔ `{ value }` rows for useFieldArray, null image ↔ empty src, dates, SEO, slug).
 */

type Plain = Record<string, unknown>;

const PAIRS_DEFAULT: FieldDef[] = [
  { name: 'label', label: 'Label', kind: 'text' },
  { name: 'value', label: 'Value', kind: 'text' },
];

/** Item fields of a `list` / `pairs` field (undefined → list of strings). */
export const itemFieldsOf = (f: FieldDef): FieldDef[] | undefined =>
  f.itemFields ?? (f.kind === 'pairs' ? PAIRS_DEFAULT : undefined);

const EMPTY_IMAGE = { src: '', alt: '' };
const EMPTY_SEO = { title: '', description: '', ogImage: '', noindex: false };

/** Empty form value for one field. */
export function emptyValue(f: FieldDef): unknown {
  if (f.localized && !['list', 'pairs', 'group'].includes(f.kind)) return { en: '', ne: '' };
  switch (f.kind) {
    case 'number':
      return f.required || f.nullable ? undefined : 0;
    case 'group':
      return Object.fromEntries((f.itemFields ?? []).map((i) => [i.name, emptyValue(i)]));
    case 'switch':
      return false;
    case 'select':
      return f.options?.[0]?.value ?? '';
    case 'image':
      return { ...EMPTY_IMAGE };
    case 'images':
    case 'list':
    case 'pairs':
      return [];
    default:
      return '';
  }
}

/** A new row for a `list` / `pairs` field. */
export function emptyItem(f: FieldDef): Plain {
  const items = itemFieldsOf(f);
  if (!items) return { value: '' };
  return Object.fromEntries(items.map((i) => [i.name, emptyValue(i)]));
}

/** `datetime-local` value (local time) ↔ ISO string. */
export const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function fieldToForm(f: FieldDef, value: unknown): unknown {
  if (value === undefined || value === null) return emptyValue(f);
  switch (f.kind) {
    case 'group':
      // Keys the form doesn't show (a project's lat/lng) ride along so saving keeps them.
      return {
        ...(value as Plain),
        ...Object.fromEntries(
          (f.itemFields ?? []).map((i) => [i.name, fieldToForm(i, (value as Plain)[i.name])]),
        ),
      };
    case 'image':
      return { ...EMPTY_IMAGE, ...(value as Plain) };
    case 'images':
      return (value as Plain[]).map((v) => ({ ...EMPTY_IMAGE, ...v }));
    case 'list':
      return itemFieldsOf(f) ? value : (value as string[]).map((v) => ({ value: v }));
    case 'date':
      return typeof value === 'string' ? value.slice(0, 10) : '';
    default:
      return value;
  }
}

/** Form defaults for a new document. */
export function emptyValues(cfg: ResourceConfig): Plain {
  const out: Plain = Object.fromEntries(cfg.fields.map((f) => [f.name, emptyValue(f)]));
  out[cfg.visibleField] = false;
  if (cfg.slug) out.slug = '';
  if (cfg.seo) out.seo = { ...EMPTY_SEO };
  if (cfg.schedulable) out.publishedAt = '';
  return out;
}

/** Admin doc → form values (only the keys the form edits). */
export function docToForm(cfg: ResourceConfig, doc: Plain): Plain {
  const filled = toFormValues(doc, cfg.localized);
  const out: Plain = Object.fromEntries(
    cfg.fields.map((f) => [f.name, fieldToForm(f, filled[f.name])]),
  );
  out[cfg.visibleField] = doc[cfg.visibleField] === true;
  if (cfg.slug) out.slug = typeof doc.slug === 'string' ? doc.slug : '';
  if (cfg.seo) out.seo = { ...EMPTY_SEO, ...((doc.seo as Plain | undefined) ?? {}) };
  if (cfg.schedulable) {
    out.publishedAt = typeof doc.publishedAt === 'string' ? toLocalInput(doc.publishedAt) : '';
  }
  return out;
}

/** One `list` / `pairs` row or `group` object → body shape, field by field. */
const objectToBody = (items: FieldDef[], value: Plain): Plain => ({
  ...value,
  ...Object.fromEntries(items.map((i) => [i.name, fieldToBody(i, value[i.name])])),
});

function fieldToBody(f: FieldDef, value: unknown): unknown {
  if (f.nullable && (value === undefined || value === '' || Number.isNaN(value))) return null;
  switch (f.kind) {
    case 'group':
      return objectToBody(f.itemFields ?? [], (value as Plain) ?? {});
    case 'image': {
      const img = value as { src?: string } & Plain;
      return img?.src ? img : null;
    }
    case 'images':
      return ((value as { src?: string }[]) ?? []).filter((i) => i.src);
    case 'pairs':
      return ((value as Plain[]) ?? []).map((row) => objectToBody(itemFieldsOf(f) ?? [], row));
    case 'list': {
      const items = itemFieldsOf(f);
      if (items) return ((value as Plain[]) ?? []).map((row) => objectToBody(items, row));
      return ((value as { value: string }[]) ?? [])
        .map((r) => r.value.trim())
        .filter((v) => v !== '');
    }
    case 'date':
      return value ? value : null;
    default:
      return value;
  }
}

/** Parsed form values → body-shaped values (localized fields still `{ en, ne }`). */
export function formToBody(cfg: ResourceConfig, values: Plain): Plain {
  const out: Plain = Object.fromEntries(
    cfg.fields.map((f) => [f.name, fieldToBody(f, values[f.name])]),
  );
  out[cfg.visibleField] = values[cfg.visibleField] === true;
  if (cfg.slug) out.slug = values.slug ? values.slug : undefined;
  if (cfg.seo) {
    const seo = Object.fromEntries(
      Object.entries((values.seo as Plain) ?? {}).filter(
        ([k, v]) => !(k === 'ogImage' && v === ''),
      ),
    );
    out.seo = seo;
  }
  if (cfg.schedulable) {
    const at = values.publishedAt as string | undefined;
    out.publishedAt = at ? new Date(at).toISOString() : undefined;
  }
  return out;
}

/** Request body: every field on create, only dirty ones on update. */
export function buildBody(cfg: ResourceConfig, values: Plain, dirty: Plain, isNew: boolean): Plain {
  const body = formToBody(cfg, values);
  const seo = body.seo as Plain | undefined;
  // A new document with no SEO overrides sends none (the site uses its defaults).
  if (isNew && seo && !seo.title && !seo.description && !seo.ogImage && !seo.noindex) {
    delete body.seo;
  }
  return toPayload(body, cfg.localized, dirty, { all: isNew });
}

/** Server `fieldErrors` path → form path (localized fields point at their English input). */
export function formPathFor(cfg: ResourceConfig, path: string): string {
  const top = path.split('.')[0];
  const field = cfg.fields.find((f) => f.name === top);
  if (field?.localized && !['list', 'pairs', 'group'].includes(field.kind) && path === top) {
    return `${path}.en`;
  }
  return path;
}
