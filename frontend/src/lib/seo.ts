/** SEO helpers. Defaults are overridden at runtime by SiteSettings.seo from the API. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'http://localhost:5173').replace(
  /\/$/,
  '',
);

export const seoDefaults = {
  siteName: 'Niraum Metals',
  legalName: 'Niraum Metals Pvt. Ltd.',
  title: 'Niraum Metals — Strength Forged For Generations',
  description: 'Iron ore, metal minerals and stone/aggregate supply in Nepal.',
  ogImage: '/og-image.jpg',
  locale: 'en_NP',
} as const;

export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const pageTitle = (title?: string) =>
  title ? `${title} | ${seoDefaults.siteName}` : seoDefaults.title;
