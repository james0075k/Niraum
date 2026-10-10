import { render } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { HelmetProvider } from 'react-helmet-async';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom';
import type { AdminUser } from '@/admin/auth/useMe';
import { adminRoute } from '@/app/router';

/**
 * Shared admin test helpers. Each test file still declares its own mocks (vi.mock is hoisted
 * per file), typically:
 *   vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
 *   vi.mock('@/components/common/Captcha', () => captchaMock);
 */

/** Renders the real `/admin/*` route (AdminRoot brings its own providers) or custom routes. */
export function renderAdmin(path: string, routes: RouteObject[] = [adminRoute as RouteObject]) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const utils = render(
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>,
  );
  return { router, ...utils };
}

/** An axios error with the API's error envelope. */
export function axiosError(status: number, code: string, details?: unknown) {
  const headers = new AxiosHeaders();
  const config = { headers };
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, {
    status,
    statusText: String(status),
    headers: {},
    config,
    data: { error: { code, message: code, ...(details === undefined ? {} : { details }) } },
  });
}

const base = { mustChangePassword: false, lastLoginAt: '2026-10-09T08:00:00.000Z' };
export const editor: AdminUser = {
  ...base,
  id: 'u-editor',
  name: 'Edna Editor',
  email: 'editor@niraum.test',
  role: 'editor',
};
export const admin: AdminUser = {
  ...base,
  id: 'u-admin',
  name: 'Ada Admin',
  email: 'admin@niraum.test',
  role: 'admin',
};
export const superadmin: AdminUser = {
  ...base,
  id: 'u-super',
  name: 'Sam Super',
  email: 'super@niraum.test',
  role: 'superadmin',
};

/** `{ data: { data: user } }` — the shape `api.get('/auth/me')` resolves with. */
export const ok = <T,>(data: T) => ({ data: { data: data } });
