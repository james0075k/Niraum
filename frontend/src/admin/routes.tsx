import { Navigate, type RouteObject } from 'react-router-dom';
import React, { Suspense } from 'react';
import { RequireAuth } from './auth/RequireAuth';
import { RequireRole } from './auth/RequireRole';
import { PageSpinner } from './components/PageSpinner';
import { AdminLayout } from './layout/AdminLayout';
import { NAV } from './nav';
import type { ResourceKey } from './resources/config';

/** Wraps a dynamic import in Suspense so each admin page is its own chunk. */
export const lazyPage = (load: () => Promise<{ default: React.ComponentType }>) => {
  const C = React.lazy(load);
  return (
    <Suspense fallback={<PageSpinner />}>
      <C />
    </Suspense>
  );
};

/**
 * Admin paths (relative to /admin) of the resources served by the generic ResourceList /
 * ResourceEdit pages. Must match `adminPathOf(RESOURCES[key])`; kept here so the shell chunk
 * doesn't load the resource configs (they load with the pages). Task 9 adds the deposit.
 */
export const RESOURCE_PATHS: Partial<Record<ResourceKey, string>> = {
  products: 'products',
  team: 'team',
  services: 'services',
  projects: 'projects',
  posts: 'posts',
  jobs: 'jobs',
};

/** List, new and edit routes of one resource, role-gated like the rest of the content area. */
export function resourceRoutes(key: ResourceKey, path: string): RouteObject[] {
  const gate = (el: React.ReactNode) => <RequireRole area="content">{el}</RequireRole>;
  const list = lazyPage(() =>
    import('./pages/ResourceList').then((m) => ({ default: () => <m.default resource={key} /> })),
  );
  const edit = lazyPage(() =>
    import('./pages/ResourceEdit').then((m) => ({ default: () => <m.default resource={key} /> })),
  );
  return [
    { path, element: gate(list) },
    { path: `${path}/new`, element: gate(edit) },
    { path: `${path}/:id`, element: gate(edit) },
  ];
}

const resourceEntries = Object.entries(RESOURCE_PATHS) as [ResourceKey, string][];
const resources = resourceEntries.flatMap(([key, path]) => resourceRoutes(key, path));
const resourcePaths = new Set(resourceEntries.map(([, path]) => `/admin/${path}`));

/**
 * Sections without a real page yet: a role-gated "coming soon" placeholder at each NAV path,
 * so links never 404. Later tasks replace entries here with their pages.
 */
const BUILT = new Set(['/admin', '/admin/settings', '/admin/media']);
const placeholders: RouteObject[] = NAV.filter(
  (n) => !BUILT.has(n.to) && !resourcePaths.has(n.to),
).map((n) => ({
  path: n.to.slice('/admin/'.length),
  element: <RequireRole area={n.area}>{lazyPage(() => import('./pages/ComingSoon'))}</RequireRole>,
}));

/**
 * Children of `/admin/*` (paths are relative to `/admin`). Only the signed-out screens sit
 * outside RequireAuth; unknown paths fall through to its `*` so they are gated too. Every
 * signed-in page renders inside AdminLayout (sidebar, topbar, palette, unsaved guard).
 */
export const adminRoutes: RouteObject[] = [
  { path: 'login', element: lazyPage(() => import('./pages/Login')) },
  { path: 'forgot-password', element: lazyPage(() => import('./pages/ForgotPassword')) },
  { path: 'reset-password', element: lazyPage(() => import('./pages/ResetPassword')) },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: lazyPage(() => import('./pages/Dashboard')) },
          // Allowed (and forced) while mustChangePassword.
          { path: 'change-password', element: lazyPage(() => import('./pages/ChangePassword')) },
          {
            path: 'settings',
            element: (
              <RequireRole area="settings">
                {lazyPage(() => import('./pages/Settings'))}
              </RequireRole>
            ),
          },
          {
            path: 'media',
            element: (
              <RequireRole area="media">{lazyPage(() => import('./pages/Media'))}</RequireRole>
            ),
          },
          ...resources,
          ...placeholders,
        ],
      },
      { path: '*', element: <Navigate to="/admin" replace /> },
    ],
  },
];
