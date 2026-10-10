import type { RouteRecord } from 'vite-react-ssg';
import { legalPages } from '@/content/legal';
import { posts } from '@/content/posts';
import { projects } from '@/content/projects';
import App from './App';
import { LANGS, type Lang } from './i18n';

/**
 * Route table. Public routes are prerendered; /admin/* (Phase 5) is client-only
 * (excluded in vite.config.ts ssgOptions.includedRoutes) and lazy-loaded behind auth.
 *
 * Phase 4.5: every public page lives under `/en/…` and `/ne/…` (same components; the language
 * comes from the URL — see app/i18n.ts). `/` and the old unprefixed URLs are prerendered as
 * redirect pages to the visitor's language, so existing links keep working.
 *
 * getStaticPaths lists slugs from local content (relative to the language prefix).
 * vite.config.ts adds the published project/post/job slugs from the API (SSG_API_URL) so
 * admin-created pages are prerendered too.
 */
const page = (load: () => Promise<{ default: React.ComponentType }>) => () =>
  load().then((m) => ({ Component: m.default }));

const redirect = page(() => import('@/pages/public/LangRedirect'));

/** The public site for one language (paths relative to `/<lang>`). */
const publicRoutes = (): RouteRecord[] => [
  { index: true, lazy: page(() => import('@/pages/public/Home')) },
  { path: 'about', lazy: page(() => import('@/pages/public/About')) },
  // Phase 4.5 pages
  { path: 'our-project', lazy: page(() => import('@/pages/public/OurProject')) },
  { path: 'products', lazy: page(() => import('@/pages/public/Products')) },
  { path: 'technical-data', lazy: page(() => import('@/pages/public/TechnicalData')) },
  { path: 'investors', lazy: page(() => import('@/pages/public/Investors')) },
  { path: 'operations', lazy: page(() => import('@/pages/public/Operations')) },
  { path: 'projects', lazy: page(() => import('@/pages/public/Projects')) },
  {
    path: 'projects/:slug',
    lazy: page(() => import('@/pages/public/ProjectDetail')),
    getStaticPaths: () => projects.map((p) => `projects/${p.slug}`),
  },
  { path: 'sustainability', lazy: page(() => import('@/pages/public/Sustainability')) },
  { path: 'news', lazy: page(() => import('@/pages/public/News')) },
  {
    path: 'news/:slug',
    lazy: page(() => import('@/pages/public/Article')),
    getStaticPaths: () => posts.map((p) => `news/${p.slug}`),
  },
  { path: 'careers', lazy: page(() => import('@/pages/public/Careers')) },
  // No local vacancies; open jobs are prerendered from the API (vite.config.ts).
  { path: 'careers/:slug', lazy: page(() => import('@/pages/public/Job')) },
  { path: 'contact', lazy: page(() => import('@/pages/public/Contact')) },
  {
    path: 'legal/:page',
    lazy: page(() => import('@/pages/public/Legal')),
    getStaticPaths: () => legalPages.map((p) => `legal/${p.slug}`),
  },
  { path: '*', lazy: page(() => import('@/pages/public/NotFound')) },
];

/** Pre-4.5 URLs without a language prefix → redirect pages. */
const legacyRoutes: RouteRecord[] = [
  ...[
    'about',
    'our-project',
    'products',
    'technical-data',
    'investors',
    'operations',
    'projects',
    'sustainability',
    'news',
    'careers',
    'contact',
  ].map((path) => ({ path, lazy: redirect })),
  {
    path: 'projects/:slug',
    lazy: redirect,
    getStaticPaths: () => projects.map((p) => `projects/${p.slug}`),
  },
  {
    path: 'news/:slug',
    lazy: redirect,
    getStaticPaths: () => posts.map((p) => `news/${p.slug}`),
  },
  { path: 'careers/:slug', lazy: redirect },
  {
    path: 'legal/:page',
    lazy: redirect,
    getStaticPaths: () => legalPages.map((p) => `legal/${p.slug}`),
  },
];

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <App />,
    entry: 'src/app/App.tsx',
    children: [
      { index: true, lazy: redirect },
      ...LANGS.map((lang: Lang) => ({ path: lang, children: publicRoutes() })),
      ...legacyRoutes,
      { path: '404', lazy: page(() => import('@/pages/public/NotFound')) },
      { path: '*', lazy: page(() => import('@/pages/public/NotFound')) },
    ],
  },
];
