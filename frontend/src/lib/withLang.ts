/**
 * Public API path in a language (Phase 4.5): `/projects?limit=50` → `/projects?limit=50&lang=ne`.
 * English is the API default, so English URLs stay unchanged (same cache keys as before).
 */
export function withLang(path: string, lang: string): string {
  if (lang === 'en') return path;
  return `${path}${path.includes('?') ? '&' : '?'}lang=${lang}`;
}
