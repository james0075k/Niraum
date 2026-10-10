import i18n, { type Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

/**
 * Bilingual setup (Phase 4.5). The language comes from the URL prefix (`/en/…`, `/ne/…`), not
 * from global state: components call `useT(ns)` (hooks/useLang.ts), which binds `t` to the
 * route's language with `getFixedT`, so prerendering both trees in one process is safe.
 *
 * Locale files: src/locales/<lang>/<namespace>.json, bundled eagerly so the first render
 * (and the prerender) is complete. Missing Nepali keys fall back to English.
 */
export const LANGS = ['en', 'ne'] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = import.meta.env.VITE_DEFAULT_LANG === 'ne' ? 'ne' : 'en';
/** localStorage key for the visitor's choice (the language toggle writes it). */
export const LANG_STORAGE_KEY = 'niraum-lang';

export const LANG_LABELS: Record<Lang, { short: string; native: string; locale: string }> = {
  en: { short: 'EN', native: 'English', locale: 'en_NP' },
  ne: { short: 'ने', native: 'नेपाली', locale: 'ne_NP' },
};

export const isLang = (v: unknown): v is Lang => (LANGS as readonly unknown[]).includes(v);

const files = import.meta.glob<Record<string, unknown>>('../locales/*/*.json', {
  eager: true,
  import: 'default',
});

const resources: Resource = {};
for (const [path, data] of Object.entries(files)) {
  const [, lang, ns] = /locales\/([a-z]+)\/([a-z-]+)\.json$/.exec(path) ?? [];
  if (!lang || !ns) continue;
  resources[lang] = { ...resources[lang], [ns]: data };
}
export const NAMESPACES = Object.keys(resources.en ?? {});

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANG,
  fallbackLng: 'en',
  supportedLngs: [...LANGS],
  ns: NAMESPACES,
  defaultNS: 'common',
  interpolation: { escapeValue: false }, // React escapes
  returnNull: false,
  // Resources are bundled: initialise synchronously so the prerender has every string.
  initAsync: false,
});

export { i18n };

/** First path segment when it is a language, e.g. `/ne/about` → `ne`. */
export function langFromPath(pathname: string): Lang | null {
  const first = pathname.split('/')[1];
  return isLang(first) ? first : null;
}

/** Path without its language prefix: `/ne/about` → `/about`, `/en` → `/`. */
export function stripLang(pathname: string): string {
  const lang = langFromPath(pathname);
  if (!lang) return pathname || '/';
  const rest = pathname.slice(lang.length + 1);
  return rest === '' ? '/' : rest;
}

/**
 * Site-relative path in `lang`: `/about` → `/ne/about`, `/` → `/ne`. External URLs, hash-only
 * links, `/admin` and already-prefixed paths are returned unchanged.
 */
export function localePath(lang: Lang, to: string): string {
  if (!to.startsWith('/') || to.startsWith('//') || to.startsWith('/admin')) return to;
  if (langFromPath(to)) return to;
  const cut = to.search(/[?#]/);
  const path = cut < 0 ? to : to.slice(0, cut);
  const tail = cut < 0 ? '' : to.slice(cut);
  return `/${lang}${path === '/' ? '' : path}${tail}`;
}

/** Same page in another language (keeps query and hash). */
export const switchLangPath = (pathname: string, lang: Lang) =>
  localePath(lang, stripLang(pathname));
