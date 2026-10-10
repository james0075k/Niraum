import { act, screen, waitFor, within } from '@testing-library/react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { vi } from 'vitest';
import type { RouteObject } from 'react-router-dom';
import { ME_KEY } from '@/admin/auth/useMe';
import { RequireAuth } from '@/admin/auth/RequireAuth';
import { Providers } from '@/app/providers';
import { api } from '@/lib/api';
import { admin, axiosError, editor, ok, renderAdmin } from './utils';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock('@/components/common/Captcha', () => import('./captchaMock'));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }));

const apiGet = vi.mocked(api.get);
const apiPost = vi.mocked(api.post);
const user = userEvent.setup();

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
});

/** Admin routes around a page with an input; `client()` exposes the page's QueryClient. */
function draftRoutes() {
  let qc: QueryClient | undefined;
  function Draft() {
    qc = useQueryClient();
    return (
      <label>
        Notes
        <input />
      </label>
    );
  }
  const routes: RouteObject[] = [
    {
      path: '/admin',
      element: (
        <Providers>
          <RequireAuth />
        </Providers>
      ),
      children: [
        { index: true, element: <h1>Dashboard</h1> },
        { path: 'draft', element: <Draft /> },
      ],
    },
  ];
  return { routes, client: () => qc! };
}

describe('RequireAuth', () => {
  it('sends anonymous users to login with ?next=', async () => {
    apiGet.mockRejectedValueOnce(axiosError(401, 'UNAUTHENTICATED'));
    const { router } = renderAdmin('/admin/products');
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/login'));
    expect(router.state.location.search).toBe('?next=%2Fadmin%2Fproducts');
  });

  it('tries a silent refresh when /auth/me is 401 before giving up', async () => {
    apiGet.mockRejectedValueOnce(axiosError(401, 'UNAUTHENTICATED'));
    apiPost.mockResolvedValueOnce(ok(editor)); // /auth/refresh
    renderAdmin('/admin');
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(apiPost).toHaveBeenCalledWith('/auth/refresh');
  });

  it('shows a spinner while the session is checked, then the page', async () => {
    let resolve!: (v: unknown) => void;
    apiGet.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    renderAdmin('/admin');
    expect(await screen.findByRole('status', { name: 'Loading' })).toBeInTheDocument();
    resolve(ok(editor));
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('keeps the page and its input when a background session check fails', async () => {
    const { routes, client } = draftRoutes();
    apiGet.mockResolvedValueOnce(ok(editor));
    renderAdmin('/admin/draft', routes);
    await user.type(await screen.findByLabelText('Notes'), 'draft text');

    apiGet.mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'));
    await act(async () => {
      await client().refetchQueries({ queryKey: ME_KEY });
      await new Promise((r) => setTimeout(r, 20)); // let observers re-render
    });
    expect(client().getQueryState(ME_KEY)?.status).toBe('error');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toHaveValue('draft text');
  });

  it('dispatches from several waiting requests keep the first user for the dialog', async () => {
    const { routes } = draftRoutes();
    apiGet.mockResolvedValueOnce(ok(editor));
    renderAdmin('/admin/draft', routes);
    await screen.findByLabelText('Notes');
    act(() => {
      window.dispatchEvent(new Event('niraum:auth-expired'));
      window.dispatchEvent(new Event('niraum:auth-expired'));
    });
    const dialog = await screen.findByRole('dialog', { name: /Session expired/ });
    expect(within(dialog).getByLabelText('Email')).toHaveValue(editor.email);
  });

  it('closes the dialog when the session comes back some other way', async () => {
    const { routes, client } = draftRoutes();
    apiGet.mockResolvedValueOnce(ok(editor));
    renderAdmin('/admin/draft', routes);
    await user.type(await screen.findByLabelText('Notes'), 'draft text');
    act(() => {
      window.dispatchEvent(new Event('niraum:auth-expired'));
    });
    await screen.findByRole('dialog', { name: /Session expired/ });
    act(() => {
      client().setQueryData(ME_KEY, editor);
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByLabelText('Notes')).toHaveValue('draft text');
  });

  it('a different account signing in drops the old data and leaves the page', async () => {
    const { routes, client } = draftRoutes();
    apiGet.mockResolvedValueOnce(ok(editor));
    const { router } = renderAdmin('/admin/draft', routes);
    await user.type(await screen.findByLabelText('Notes'), 'editor draft');
    act(() => {
      client().setQueryData(['admin', 'products', 'list'], ['editor-only']);
      window.dispatchEvent(new Event('niraum:auth-expired'));
    });
    const dialog = await screen.findByRole('dialog', { name: /Session expired/ });

    apiPost.mockResolvedValueOnce(ok(admin));
    const email = within(dialog).getByLabelText('Email');
    await user.clear(email);
    await user.type(email, admin.email);
    await user.type(within(dialog).getByLabelText('Password'), 'a-long-password-1');
    await user.click(within(dialog).getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'));
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Notes')).not.toBeInTheDocument();
    expect(client().getQueryData(['admin', 'products', 'list'])).toBeUndefined();
    expect(client().getQueryData(ME_KEY)).toEqual(admin);
  });

  it('keeps form input when the session expires and the user signs in again', async () => {
    const { routes, client } = draftRoutes();
    apiGet.mockResolvedValueOnce(ok(editor));
    renderAdmin('/admin/draft', routes);
    await user.type(await screen.findByLabelText('Notes'), 'draft text');

    act(() => {
      client().setQueryData(['admin', 'products', 'list'], ['kept']);
      window.dispatchEvent(new Event('niraum:auth-expired'));
    });
    const dialog = await screen.findByRole('dialog', { name: /Session expired/ });
    expect(dialog).toHaveTextContent('sign in again');

    apiPost.mockResolvedValueOnce(ok(editor));
    // The last user's email is prefilled.
    expect(within(dialog).getByLabelText('Email')).toHaveValue(editor.email);
    await user.type(within(dialog).getByLabelText('Password'), 'a-long-password-1');
    await user.click(within(dialog).getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByLabelText('Notes')).toHaveValue('draft text');
    expect(client().getQueryData(['admin', 'products', 'list'])).toEqual(['kept']);
    expect(apiPost).toHaveBeenCalledWith('/auth/login', {
      email: editor.email,
      password: 'a-long-password-1',
    });
  });
});
