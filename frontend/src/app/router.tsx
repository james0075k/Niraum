import type { RouteRecord } from 'vite-react-ssg';
import App from './App';

/**
 * Route table. Public routes are prerendered; /admin/* is client-only (excluded in
 * vite.config.ts ssgOptions.includedRoutes) and lazy-loaded behind auth.
 *
 * Planned (see docs/ARCHITECTURE.md §5):
 *   /  /about  /operations  /projects  /projects/:slug  /sustainability
 *   /news  /news/:slug  /careers  /careers/:slug  /contact  /legal/:page
 *   /admin/login  /admin  /admin/{settings,projects,news,jobs,team,media,messages,users}
 */
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <App />,
    entry: 'src/app/App.tsx',
    children: [
      {
        index: true,
        lazy: () => import('@/pages/public/Home').then((m) => ({ Component: m.default })),
      },
      {
        path: '*',
        lazy: () => import('@/pages/public/NotFound').then((m) => ({ Component: m.default })),
      },
    ],
  },
];
