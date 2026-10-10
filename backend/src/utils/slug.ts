import { randomBytes } from 'node:crypto';
import slugifyLib from 'slugify';

// slugify ships CJS with a default export; normalise for NodeNext ESM interop.
const slugifyFn = (slugifyLib as unknown as { default?: typeof slugifyLib }).default ?? slugifyLib;

export function slugify(input: string): string {
  const s = slugifyFn(input, { lower: true, strict: true, trim: true }).slice(0, 80);
  return s.replace(/-+$/g, '') || 'item';
}

/**
 * Returns `base`, or `base-2`, `base-3`… (then a random suffix) — the first one `exists`
 * reports free. Soft-deleted documents still hold their slug, so links never get reused.
 */
export async function uniqueSlug(
  source: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(source);
  if (!(await exists(base))) return base;
  for (let n = 2; n <= 20; n++) {
    const candidate = `${base}-${n}`;
    if (!(await exists(candidate))) return candidate;
  }
  return `${base}-${randomBytes(3).toString('hex')}`;
}
