import { Navigate, type RouteObject } from 'react-router-dom';
import React, { Suspense } from 'react';
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

/** Children of `/admin/*` (paths are relative to `/admin`). */
export const adminRoutes: RouteObject[] = [
  { path: 'login', element: lazyPage(() => import('./pages/Login')) },
  { path: '*', element: <Navigate to="/admin" replace /> },
];
