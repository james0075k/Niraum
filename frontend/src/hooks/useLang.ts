import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { DEFAULT_LANG, langFromPath, localePath, type Lang } from '@/app/i18n';

/** The page's language, from the URL prefix (unprefixed legacy URLs → default language). */
export function useLang(): Lang {
  const { pathname } = useLocation();
  return langFromPath(pathname) ?? DEFAULT_LANG;
}

/** `lp('/contact')` → `/ne/contact` on a Nepali page. */
export function useLocalePath() {
  const lang = useLang();
  return useCallback((to: string) => localePath(lang, to), [lang]);
}

/**
 * `t` bound to the route's language (getFixedT under the hood), so SSR and both language trees
 * stay independent of the global i18next language.
 */
export function useT(ns: string | string[] = 'common') {
  const lang = useLang();
  return useTranslation(ns, { lng: lang });
}
