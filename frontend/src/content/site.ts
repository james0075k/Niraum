import type { SiteSettings, Stat } from '@/lib/types';
import siteContent from '../../../docs/content/data/site_content.json';
import { tbc } from './placeholders';

/**
 * Fallback SiteSettings used until GET /settings/public is live (Phase 4) and when the
 * API is unreachable. Only facts from the Brand Brief are filled in.
 */
export const defaultSettings: SiteSettings = {
  companyName: 'Niraum Metals',
  legalName: 'Niraum Metals Pvt. Ltd.',
  motto: 'Strength Forged For Generations',
  // Logo files not yet supplied (see public/logo/README.md) — the wordmark renders instead.
  logo: { light: null, dark: null },
  // Business email from the blueprint; phone + WhatsApp from site_content.json (founder's number,
  // also the company line).
  contact: {
    phone: [siteContent.settings.phone],
    email: [siteContent.settings.email],
    whatsapp: siteContent.settings.whatsapp,
  },
  address: {
    line1: 'Lalitpur-13',
    city: 'Lalitpur',
    district: 'Lalitpur',
    province: 'Bagmati Province',
    country: 'Nepal',
    postalCode: '',
  },
  // Centre of Lalitpur — the exact office pin is unconfirmed, so the map says so.
  location: { lat: 27.6644, lng: 85.3188, zoom: 14, approximate: true },
  officeHours: tbc('Office hours'),
  social: [],
  seo: {
    defaultTitle: 'Mining Company in Nepal | Niraum Metals',
    defaultDescription:
      'Niraum Metals is a mining company in Nepal supplying iron ore, metal minerals and stone aggregates to construction, steel and cement industries.',
    ogImage: '/og-image.jpg',
    keywords: [
      'mining company in Nepal',
      'iron ore supplier Nepal',
      'metal minerals Lalitpur',
      'stone and aggregate supplier Kathmandu Valley',
      'construction aggregates Nepal',
    ],
  },
  // Empty → the footer shows the blueprint sentence from the locale file (common:footer.about).
  footer: { about: '' },
  theme: { defaultMode: 'system' },
};

export const homeStats: Stat[] = [
  { label: 'Years in operation', value: null, placeholder: tbc('Founding year') },
  { label: 'Tonnes supplied', value: null, placeholder: tbc('Tonnage') },
  { label: 'Active sites', value: null, placeholder: tbc('Site count') },
  { label: 'People on our team', value: null, placeholder: tbc('Staff count') },
];

/** Sectors from the Brand Brief audience — shown until client logos are approved. */
export const sectors = [
  'Construction companies',
  'Steel plants',
  'Cement plants',
  'Government projects',
  'Infrastructure developers',
  'Road and bridge builders',
];

export const processSteps = [
  {
    title: 'Exploration',
    body: 'Field mapping, outcrop sampling and laboratory assays define where ore is and how much it is worth.',
  },
  {
    title: 'Extraction',
    body: 'Planned benches, controlled blasting and modern equipment move material safely and efficiently.',
  },
  {
    title: 'Processing',
    body: 'Crushing, screening and grading turn run-of-mine rock into specified, consistent product.',
  },
  {
    title: 'Delivery',
    body: 'Scheduled haulage and clear paperwork get material to plants and sites on time.',
  },
];

/** `key` → `common:nav.<key>` (labels are translated; `label` is the English fallback). */
export const navLinks = [
  { to: '/', label: 'Home', key: 'home' },
  { to: '/about', label: 'About', key: 'about' },
  { to: '/our-project', label: 'Our Project', key: 'project' },
  { to: '/products', label: 'Products', key: 'products' },
  { to: '/technical-data', label: 'Technical Data', key: 'technical' },
  { to: '/sustainability', label: 'Sustainability', key: 'sustainability' },
  { to: '/investors', label: 'Investors', key: 'investors' },
  { to: '/contact', label: 'Contact', key: 'contact' },
] as const;

export const legalLinks = [
  { to: '/legal/privacy', label: 'Privacy Policy' },
  { to: '/legal/terms', label: 'Terms of Use' },
  { to: '/legal/cookies', label: 'Cookie Policy' },
] as const;
