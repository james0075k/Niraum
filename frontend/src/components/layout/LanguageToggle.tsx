import { Link, useLocation } from 'react-router-dom';
import { LANG_LABELS, LANG_STORAGE_KEY, LANGS, switchLangPath } from '@/app/i18n';
import { useLang, useT } from '@/hooks/useLang';
import { cn } from '@/lib/utils';

/** Remembers the visitor's choice so `/` and old links open in that language next time. */
function saveLang(lang: string) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Storage blocked — the URL still carries the language.
  }
}

/** EN | नेपाली — links to the same page in the other language (keeps query and hash). */
export function LanguageToggle({ className }: { className?: string }) {
  const lang = useLang();
  const { pathname, search, hash } = useLocation();
  const { t } = useT();

  return (
    <nav aria-label={t('lang.label')} className={cn('flex items-center', className)}>
      <ul className="flex items-center rounded-full border border-foreground/15 p-0.5 text-xs font-semibold">
        {LANGS.map((l) => {
          const active = l === lang;
          return (
            <li key={l}>
              <Link
                to={switchLangPath(pathname, l) + search + hash}
                lang={l}
                hrefLang={l}
                onClick={() => saveLang(l)}
                aria-current={active ? 'true' : undefined}
                aria-label={
                  active
                    ? LANG_LABELS[l].native
                    : t('lang.switchTo', { language: LANG_LABELS[l].native })
                }
                className={cn(
                  'inline-flex h-9 min-w-11 items-center justify-center rounded-full px-2.5 transition-colors',
                  active
                    ? 'bg-copper-gradient text-graphite'
                    : 'text-foreground/75 hover:bg-foreground/10 hover:text-foreground',
                )}
              >
                {l === 'en' ? (
                  LANG_LABELS.en.short
                ) : (
                  // System Devanagari font: this label alone must not make English pages
                  // download Mukta.
                  <span className="[font-family:system-ui,sans-serif]">
                    {LANG_LABELS.ne.native}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
