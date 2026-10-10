/**
 * Unknown business facts are never invented. They render as "[PLACEHOLDER: Label]"
 * (docs/ARCHITECTURE.md §11), styled by <Tbc>/<TbcText> so they stay obvious, and the
 * pre-release check `grep PLACEHOLDER dist/` blocks go-live until all are replaced.
 */
export const TBC_RE = /\[PLACEHOLDER: [^\]]+\]/g;

export const tbc = (label: string) => `[PLACEHOLDER: ${label}]`;

/** No hero video supplied yet — hero falls back to the poster photograph. */
export const HERO_VIDEO_URL: string | null = null;

/** True for a "[PLACEHOLDER: …]" value (non-global regex, safe to reuse). */
export const isPlaceholder = (v: string | null | undefined): boolean =>
  !!v && /\[PLACEHOLDER: [^\]]+\]/.test(v);
