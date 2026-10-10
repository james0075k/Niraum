import LanguageDetector from 'i18next-browser-languagedetector';
import { DEFAULT_LANG, LANG_STORAGE_KEY, isLang, type Lang } from '@/app/i18n';

/** Saved choice → browser language → default. */
export function detectLang(): Lang {
  try {
    const detector = new LanguageDetector(null, {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: [],
    });
    const found = detector.detect();
    for (const l of Array.isArray(found) ? found : [found]) {
      const base = l?.toLowerCase().split('-')[0];
      if (isLang(base)) return base;
    }
  } catch {
    // Storage blocked (private mode) — fall through.
  }
  return DEFAULT_LANG;
}
