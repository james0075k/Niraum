import type { Job, Post, SiteSettings } from './types';

/** SEO helpers. Defaults are overridden at runtime by SiteSettings.seo from the API. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'http://localhost:5173').replace(
  /\/$/,
  '',
);

export const seoDefaults = {
  siteName: 'Niraum Metals',
  legalName: 'Niraum Metals Pvt. Ltd.',
  title: 'Mining Company in Nepal | Niraum Metals',
  description:
    'Niraum Metals is a mining company in Nepal supplying iron ore, metal minerals and stone aggregates to construction, steel and cement industries.',
  ogImage: '/og-image.jpg',
  locale: 'en_NP',
} as const;

export const absoluteUrl = (path = '/') =>
  /^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

/** "Page | Niraum Metals Nepal" — keep the page part short so the whole title is ≤ 60 chars. */
export const pageTitle = (title?: string) =>
  title ? `${title} | Niraum Metals Nepal` : seoDefaults.title;

export interface Crumb {
  name: string;
  path: string;
}

type Ld = Record<string, unknown>;

export function organizationLd(s: SiteSettings): Ld {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: s.legalName,
    alternateName: s.companyName,
    slogan: s.motto,
    url: SITE_URL,
    logo: absoluteUrl(s.logo.light ?? '/favicon.svg'),
    address: postalAddress(s),
    sameAs: s.social.filter((x) => x.isActive && x.url).map((x) => x.url),
    ...(s.contact.email[0] && { email: s.contact.email[0] }),
    ...(s.contact.phone[0] && { telephone: s.contact.phone[0] }),
  };
}

function postalAddress(s: SiteSettings): Ld {
  return {
    '@type': 'PostalAddress',
    streetAddress: s.address.line1,
    addressLocality: s.address.city,
    addressRegion: s.address.province,
    addressCountry: 'NP',
    ...(s.address.postalCode && { postalCode: s.address.postalCode }),
  };
}

export function localBusinessLd(s: SiteSettings): Ld {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/contact#business`,
    name: s.legalName,
    url: absoluteUrl('/contact'),
    image: absoluteUrl(s.seo.ogImage),
    address: postalAddress(s),
    geo: { '@type': 'GeoCoordinates', latitude: s.location.lat, longitude: s.location.lng },
    parentOrganization: { '@id': `${SITE_URL}/#organization` },
    ...(s.contact.phone[0] && { telephone: s.contact.phone[0] }),
    ...(s.contact.email[0] && { email: s.contact.email[0] }),
  };
}

export function breadcrumbLd(crumbs: Crumb[]): Ld {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export function articleLd(p: Post): Ld {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title,
    description: p.excerpt,
    image: [absoluteUrl(p.coverImage.src)],
    datePublished: p.publishedAt,
    author: { '@type': 'Organization', name: p.author },
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: absoluteUrl(`/news/${p.slug}`),
  };
}

export function jobPostingLd(j: Job, s: SiteSettings): Ld {
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: j.title,
    description: j.description,
    employmentType: j.type.toUpperCase().replace(/[\s-]+/g, '_'),
    hiringOrganization: { '@type': 'Organization', name: s.legalName, sameAs: SITE_URL },
    jobLocation: {
      '@type': 'Place',
      address: { ...postalAddress(s), addressLocality: j.location },
    },
    ...(j.createdAt && { datePosted: j.createdAt.slice(0, 10) }),
    ...(j.deadline && { validThrough: j.deadline }),
  };
}
