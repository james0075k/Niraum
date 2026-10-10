import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Head } from 'vite-react-ssg';
import { DEFAULT_LANG, LANG_STORAGE_KEY, LANGS, localePath, type Lang } from '@/app/i18n';
import { detectLang } from '@/lib/detectLang';
import { absoluteUrl } from '@/lib/seo';

/**
 * `/` and the pre-4.5 unprefixed URLs (`/about`, `/projects/x`…) → the same page under
 * `/en` or `/ne`. The prerendered page redirects with a tiny inline script before the app
 * loads (no-JS: meta refresh to the default language); the React effect covers dev/SPA.
 */
export default function LangRedirect() {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const target = (lang: Lang) => localePath(lang, pathname) + search + hash;
  const fallback = target(DEFAULT_LANG);

  useEffect(() => {
    navigate(target(detectLang()), { replace: true });
    // Runs once per redirect page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Skips /admin and already-prefixed paths: nginx also serves this page as the app shell.
  const script =
    `try{if(!/^\\/(admin|en|ne)(\\/|$)/.test(location.pathname)){` +
    `var l=localStorage.getItem('${LANG_STORAGE_KEY}');` +
    `if(${JSON.stringify(LANGS)}.indexOf(l)<0){l=(navigator.language||'').slice(0,2).toLowerCase();}` +
    `if(${JSON.stringify(LANGS)}.indexOf(l)<0){l='${DEFAULT_LANG}';}` +
    `var p=location.pathname==='/'?'':location.pathname;` +
    `location.replace('/'+l+p+location.search+location.hash);}}catch(e){}`;

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={absoluteUrl(fallback)} />
        <meta httpEquiv="refresh" content={`2; url=${fallback}`} />
        <script>{script}</script>
      </Head>
      <section className="container-site flex min-h-[60svh] items-center justify-center pt-32 text-center">
        <p className="text-muted-foreground">
          Opening the English site…{' '}
          <Link to={fallback} className="text-copper-ink underline">
            Continue to the English site
          </Link>
          {' · '}
          <Link to={target('ne')} className="text-copper-ink underline" lang="ne">
            नेपाली साइट
          </Link>
        </p>
      </section>
    </>
  );
}
