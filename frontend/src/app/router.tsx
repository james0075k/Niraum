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
/** Retired pre-4.5 pages → closest new page (app/redirects.ts). */
const moved = page(() => import('@/pages/public/Moved'));

/** The public site for one language (paths relative to `/<lang>`). */
const publicRoutes = (): RouteRecord[] => [
  { index: true, lazy: page(() => import('@/pages/public/Home')) },
  { path: 'about', lazy: page(() => import('@/pages/public/About')) },
  // Phase 4.5 pages
  { path: 'our-project', lazy: page(() => import('@/pages/public/OurProject')) },
  { path: 'products', lazy: page(() => import('@/pages/public/Products')) },
  { path: 'technical-data', lazy: page(() => import('@/pages/public/TechnicalData')) },
  { path: 'investors', lazy: page(() => import('@/pages/public/Investors')) },
  { path: 'sustainability', lazy: page(() => import('@/pages/public/Sustainability')) },
  // Retired (no blueprint content) → closest new page. Old slugs keep a redirect stub.
  { path: 'operations', lazy: moved },
  { path: 'projects', lazy: moved },
  {
    path: 'projects/:slug',
    lazy: moved,
    getStaticPaths: () => projects.map((p) => `projects/${p.slug}`),
  },
  { path: 'news', lazy: moved },
  { path: 'news/:slug', lazy: moved, getStaticPaths: () => posts.map((p) => `news/${p.slug}`) },
  { path: 'careers', lazy: moved },
  { path: 'careers/:slug', lazy: moved },
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
    'sustainability',
    'contact',
  ].map((path) => ({ path, lazy: redirect })),
  // Retired pages go straight to their replacement (one hop).
  ...['operations', 'projects', 'news', 'careers'].map((path) => ({ path, lazy: moved })),
  {
    path: 'projects/:slug',
    lazy: moved,
    getStaticPaths: () => projects.map((p) => `projects/${p.slug}`),
  },
  { path: 'news/:slug', lazy: moved, getStaticPaths: () => posts.map((p) => `news/${p.slug}`) },
  { path: 'careers/:slug', lazy: moved },
  {
    path: 'legal/:page',
    lazy: redirect,
    getStaticPaths: () => legalPages.map((p) => `legal/${p.slug}`),
  },
];

/** Client-only admin app, a sibling of the public tree so Navbar/Footer never render. */
export const adminRoute: RouteRecord = {
  path: '/admin/*',
  lazy: () => import('@/admin/AdminRoot').then((m) => ({ Component: m.default })),
};

export const routes: RouteRecord[] = [
  adminRoute,
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
