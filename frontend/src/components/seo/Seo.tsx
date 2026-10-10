import { Head } from 'vite-react-ssg';
import { useLocation } from 'react-router-dom';
import { LANG_LABELS, LANGS, localePath, switchLangPath } from '@/app/i18n';
import { useSettings } from '@/features/settings/useSettings';
import { useLang } from '@/hooks/useLang';
import { absoluteUrl, breadcrumbLd, pageTitle, seoDefaults, type Crumb } from '@/lib/seo';
import { JsonLd } from './JsonLd';

interface SeoProps {
  /** Page part of the title — rendered as "Title | Niraum Metals Nepal". Omit on Home. */
  title?: string;
  /** ≤ 155 characters. */
  description?: string;
  /** Canonical path (with or without the language prefix); defaults to the current path. */
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  /** Inner pages pass their trail; emits BreadcrumbList JSON-LD. */
  crumbs?: Crumb[];
  jsonLd?: Record<string, unknown>[];
}

export function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex,
  crumbs,
  jsonLd = [],
}: SeoProps) {
  const settings = useSettings();
  const lang = useLang();
  const { pathname } = useLocation();
  const fullTitle = title ? pageTitle(title) : settings.seo.defaultTitle || seoDefaults.title;
  const desc = description ?? settings.seo.defaultDescription;
  const current = localePath(lang, path ?? pathname);
  const canonical = absoluteUrl(current);
  // Same page in each language; x-default → English.
  const alternates = LANGS.map((l) => [l, absoluteUrl(switchLangPath(current, l))] as const);
  const ogImage = absoluteUrl(image ?? settings.seo.ogImage ?? seoDefaults.ogImage);

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonical} />
        {alternates.map(([l, href]) => (
          <link key={l} rel="alternate" hrefLang={l} href={href} />
        ))}
        <link
          rel="alternate"
          hrefLang="x-default"
          href={absoluteUrl(switchLangPath(current, 'en'))}
        />
        {noindex && <meta name="robots" content="noindex, follow" />}
        <meta property="og:type" content={type} />
        <meta property="og:site_name" content={seoDefaults.siteName} />
        <meta property="og:locale" content={LANG_LABELS[lang].locale} />
        {LANGS.filter((l) => l !== lang).map((l) => (
          <meta key={l} property="og:locale:alternate" content={LANG_LABELS[l].locale} />
        ))}
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={desc} />
        <meta name="twitter:image" content={ogImage} />
      </Head>
      {crumbs && (
        <JsonLd
          data={breadcrumbLd(crumbs.map((c) => ({ ...c, path: localePath(lang, c.path) })))}
        />
      )}
      {jsonLd.map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
    </>
  );
}
