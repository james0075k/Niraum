import { Navigate, type RouteObject } from 'react-router-dom';
import React, { Suspense } from 'react';
import { RequireAuth } from './auth/RequireAuth';
import { RequireRole } from './auth/RequireRole';
import { PageSpinner } from './components/PageSpinner';
import { AdminLayout } from './layout/AdminLayout';
import { NAV } from './nav';

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
 * Sections without a real page yet: a role-gated "coming soon" placeholder at each NAV path,
 * so links never 404. Later tasks replace entries here with their pages.
 */
const placeholders: RouteObject[] = NAV.filter((n) => n.to !== '/admin').map((n) => ({
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
          ...placeholders,
        ],
      },
      { path: '*', element: <Navigate to="/admin" replace /> },
    ],
  },
];
