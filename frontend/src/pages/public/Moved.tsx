import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Head } from 'vite-react-ssg';
import { localePath, stripLang } from '@/app/i18n';
import { movedTarget } from '@/app/redirects';
import { Link } from '@/components/common/LangLink';
import { useLang, useT } from '@/hooks/useLang';
import { absoluteUrl } from '@/lib/seo';

/**
 * Retired page (Operations, Projects, News, Careers — see app/redirects.ts): prerendered as a
 * noindex stub that sends visitors to the closest new page in the same language. nginx
 * answers these URLs with a 301 in production; this covers static hosting and old links.
 */
export default function Moved() {
  const { pathname } = useLocation();
  const lang = useLang();
  const navigate = useNavigate();
  const { t } = useT();
  const target = localePath(lang, movedTarget(stripLang(pathname)) ?? '/');

  useEffect(() => {
    navigate(target, { replace: true });
  }, [navigate, target]);

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={absoluteUrl(target)} />
        <meta httpEquiv="refresh" content={`0; url=${target}`} />
        <script>{`location.replace(${JSON.stringify(target)});`}</script>
      </Head>
      <section className="container-site flex min-h-[60svh] items-center justify-center pt-32 text-center">
        <p className="text-muted-foreground">
          {t('redirect.moved')}{' '}
          <Link to={target} className="text-copper-ink underline">
            {t('redirect.continue')}
          </Link>
        </p>
      </section>
    </>
  );
}
