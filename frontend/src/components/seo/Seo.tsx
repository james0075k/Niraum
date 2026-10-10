import { Head } from 'vite-react-ssg';
import { useLocation } from 'react-router-dom';
import { useSettings } from '@/features/settings/useSettings';
import { absoluteUrl, breadcrumbLd, pageTitle, seoDefaults, type Crumb } from '@/lib/seo';
import { JsonLd } from './JsonLd';

interface SeoProps {
  /** Page part of the title — rendered as "Title | Niraum Metals Nepal". Omit on Home. */
  title?: string;
  /** ≤ 155 characters. */
  description?: string;
  /** Canonical path; defaults to the current path. */
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
  const { pathname } = useLocation();
  const fullTitle = title ? pageTitle(title) : settings.seo.defaultTitle || seoDefaults.title;
  const desc = description ?? settings.seo.defaultDescription;
  const canonical = absoluteUrl(path ?? pathname);
  const ogImage = absoluteUrl(image ?? settings.seo.ogImage ?? seoDefaults.ogImage);

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={canonical} />
        <link rel="alternate" hrefLang="en" href={canonical} />
        <link rel="alternate" hrefLang="x-default" href={canonical} />
        {noindex && <meta name="robots" content="noindex, follow" />}
        <meta property="og:type" content={type} />
        <meta property="og:site_name" content={seoDefaults.siteName} />
        <meta property="og:locale" content={seoDefaults.locale} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={desc} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={desc} />
        <meta name="twitter:image" content={ogImage} />
      </Head>
      {crumbs && <JsonLd data={breadcrumbLd(crumbs)} />}
      {jsonLd.map((d, i) => (
        <JsonLd key={i} data={d} />
      ))}
    </>
  );
}
