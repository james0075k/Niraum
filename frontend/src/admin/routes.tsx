import { Navigate, type RouteObject } from 'react-router-dom';
import React, { Suspense } from 'react';
import { RequireAuth } from './auth/RequireAuth';
import { PageSpinner } from './components/PageSpinner';

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
 * Children of `/admin/*` (paths are relative to `/admin`). Only the signed-out screens sit
 * outside RequireAuth; unknown paths fall through to its `*` so they are gated too.
 */
export const adminRoutes: RouteObject[] = [
  { path: 'login', element: lazyPage(() => import('./pages/Login')) },
  { path: 'forgot-password', element: lazyPage(() => import('./pages/ForgotPassword')) },
  { path: 'reset-password', element: lazyPage(() => import('./pages/ResetPassword')) },
  {
    element: <RequireAuth />,
    children: [
      { index: true, element: lazyPage(() => import('./pages/Dashboard')) },
      // Allowed (and forced) while mustChangePassword.
      { path: 'change-password', element: lazyPage(() => import('./pages/ChangePassword')) },
      { path: '*', element: <Navigate to="/admin" replace /> },
    ],
  },
];
