import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { RouteObject } from 'react-router-dom';
import { RequireAuth } from '@/admin/auth/RequireAuth';
import { Providers } from '@/app/providers';
import { api } from '@/lib/api';
import { axiosError, editor, ok, renderAdmin } from './utils';

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

  it('keeps form input when the session expires and the user signs in again', async () => {
    function Draft() {
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
        children: [{ index: true, element: <Draft /> }],
      },
    ];
    apiGet.mockResolvedValueOnce(ok(editor));
    renderAdmin('/admin', routes);
    await user.type(await screen.findByLabelText('Notes'), 'draft text');

    act(() => {
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
    expect(apiPost).toHaveBeenCalledWith('/auth/login', {
      email: editor.email,
      password: 'a-long-password-1',
    });
  });
});
