import type { RouteRecord } from 'vite-react-ssg';
import { legalPages } from '@/content/legal';
import { posts } from '@/content/posts';
import { projects } from '@/content/projects';
import App from './App';

/**
 * Route table. Public routes are prerendered; /admin/* (Phase 5) is client-only
 * (excluded in vite.config.ts ssgOptions.includedRoutes) and lazy-loaded behind auth.
 *
 * getStaticPaths lists slugs from local content. vite.config.ts adds the published
 * project/post/job slugs from the API (SSG_API_URL) so admin-created pages are prerendered too.
 */
const page = (load: () => Promise<{ default: React.ComponentType }>) => () =>
  load().then((m) => ({ Component: m.default }));

export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <App />,
    entry: 'src/app/App.tsx',
    children: [
      { index: true, lazy: page(() => import('@/pages/public/Home')) },
      { path: 'about', lazy: page(() => import('@/pages/public/About')) },
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
      { path: '404', lazy: page(() => import('@/pages/public/NotFound')) },
      { path: '*', lazy: page(() => import('@/pages/public/NotFound')) },
    ],
  },
];
