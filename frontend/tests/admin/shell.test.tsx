import { act, screen, waitFor, within } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { vi } from 'vitest';
import type { RouteObject } from 'react-router-dom';
import type { AdminUser } from '@/admin/auth/useMe';
import { useUnsavedGuard } from '@/admin/hooks/useUnsavedGuard';
import { useBreadcrumb } from '@/admin/hooks/useBreadcrumb';
import { AdminLayout } from '@/admin/layout/AdminLayout';
import { RequireAuth } from '@/admin/auth/RequireAuth';
import { Providers } from '@/app/providers';
import { api } from '@/lib/api';
import { admin, axiosError, editor, ok, renderAdmin, superadmin } from './utils';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock('@/components/common/Captcha', () => import('./captchaMock'));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }));

// cmdk scrolls the selected item into view; jsdom has no layout.
Element.prototype.scrollIntoView ??= vi.fn();

const apiGet = vi.mocked(api.get);
const apiPost = vi.mocked(api.post);
const user = userEvent.setup();

/** `/auth/me` answers with `who`; every other GET stays pending. */
function mockMe(who: AdminUser) {
  apiGet.mockImplementation((url: string) =>
    url === '/auth/me' ? Promise.resolve(ok(who)) : new Promise(() => {}),
  );
}

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
  vi.mocked(toast.error).mockReset();
});

/** The shell around custom pages (same tree as routes.tsx: Providers → RequireAuth → layout). */
function shellRoutes(children: RouteObject[]): RouteObject[] {
  return [
    {
      path: '/admin',
      element: (
        <Providers>
          <RequireAuth />
        </Providers>
      ),
      children: [{ element: <AdminLayout />, children }],
    },
  ];
}

describe('admin shell', () => {
  it('editor sees content items but not Settings, Inquiries or Users', async () => {
    mockMe(editor);
    renderAdmin('/admin');
    const nav = await screen.findByRole('navigation', { name: 'Admin' });
    expect(within(nav).getByRole('link', { name: 'Products' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Assay data' })).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Settings' })).toBeNull();
    expect(within(nav).queryByRole('link', { name: 'Inquiries' })).toBeNull();
    expect(within(nav).queryByRole('link', { name: 'Users' })).toBeNull();
    expect(within(nav).queryByRole('link', { name: 'Audit log' })).toBeNull();
  });

  it('admin sees the inbox and Settings but not Users', async () => {
    mockMe(admin);
    renderAdmin('/admin');
    const nav = await screen.findByRole('navigation', { name: 'Admin' });
    expect(within(nav).getByRole('link', { name: 'Inquiries' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Users' })).toBeNull();
  });

  it('superadmin sees Users and Audit log', async () => {
    mockMe(superadmin);
    renderAdmin('/admin');
    const nav = await screen.findByRole('navigation', { name: 'Admin' });
    expect(within(nav).getByRole('link', { name: 'Users' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Audit log' })).toBeInTheDocument();
  });

  it('keeps retired sections in a collapsed "Archived sections" group', async () => {
    mockMe(editor);
    renderAdmin('/admin');
    const nav = await screen.findByRole('navigation', { name: 'Admin' });
    const toggle = within(nav).getByRole('button', { name: /Archived sections/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(within(nav).queryByRole('link', { name: 'Projects' })).toBeNull();
    await user.click(toggle);
    expect(within(nav).getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Posts' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Jobs' })).toBeInTheDocument();
    expect(
      within(nav).getByText('Not shown on the public site (retired in Phase 4.5)'),
    ).toBeInTheDocument();
  });

  it('editor opening /admin/settings directly sees No access', async () => {
    mockMe(editor);
    renderAdmin('/admin/settings');
    expect(
      await screen.findByRole('heading', { name: "You don't have access" }),
    ).toBeInTheDocument();
  });

  it('admin opening /admin/settings sees the page, not No access', async () => {
    mockMe(admin);
    renderAdmin('/admin/settings');
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: "You don't have access" })).toBeNull();
  });

  it('Ctrl+K opens the command palette and Enter navigates', async () => {
    mockMe(admin);
    const { router } = renderAdmin('/admin');
    await screen.findByRole('navigation', { name: 'Admin' });
    await user.keyboard('{Control>}k{/Control}');
    await user.type(await screen.findByPlaceholderText('Search admin…'), 'inquir');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/inquiries'));
  });

  it('command palette only lists areas the role can open', async () => {
    mockMe(editor);
    renderAdmin('/admin');
    await screen.findByRole('navigation', { name: 'Admin' });
    await user.keyboard('{Control>}k{/Control}');
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('option', { name: /Products/ })).toBeInTheDocument();
    expect(within(dialog).queryByRole('option', { name: /Settings/ })).toBeNull();
  });

  it('mobile menu opens the nav in a sheet and closes after navigating', async () => {
    mockMe(editor);
    const { router } = renderAdmin('/admin');
    await user.click(await screen.findByRole('button', { name: 'Open menu' }));
    const sheet = await screen.findByRole('dialog', { name: 'Admin menu' });
    await user.click(within(sheet).getByRole('link', { name: 'Media' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/media'));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Admin menu' })).toBeNull());
  });

  it('sidebar collapse persists', async () => {
    mockMe(editor);
    renderAdmin('/admin');
    await user.click(await screen.findByRole('button', { name: 'Collapse sidebar' }));
    expect(localStorage.getItem('niraum-admin-sidebar')).toBe('collapsed');
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
  });

  it('starts collapsed when the choice was saved', async () => {
    localStorage.setItem('niraum-admin-sidebar', 'collapsed');
    mockMe(editor);
    renderAdmin('/admin');
    expect(await screen.findByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
    // Icons only, but links keep their accessible names.
    const nav = screen.getByRole('navigation', { name: 'Admin' });
    expect(within(nav).getByRole('link', { name: 'Products' })).toBeInTheDocument();
  });

  it('breadcrumbs show the section and the page-set crumb', async () => {
    mockMe(editor);
    function Product() {
      useBreadcrumb('Hematite lump');
      return <h1>Product editor</h1>;
    }
    renderAdmin(
      '/admin/products/p1',
      shellRoutes([{ path: 'products/:id', element: <Product /> }]),
    );
    const crumbs = await screen.findByRole('navigation', { name: 'breadcrumb' });
    expect(within(crumbs).getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/admin',
    );
    expect(within(crumbs).getByRole('link', { name: 'Products' })).toHaveAttribute(
      'href',
      '/admin/products',
    );
    expect(within(crumbs).getByText('Hematite lump')).toHaveAttribute('aria-current', 'page');
  });

  it('avatar menu shows the user and signs out', async () => {
    mockMe(admin);
    apiPost.mockResolvedValue({ data: {} });
    const { router } = renderAdmin('/admin');
    await user.click(await screen.findByRole('button', { name: 'Account menu' }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByText('Ada Admin')).toBeInTheDocument();
    expect(within(menu).getByText('admin')).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Change password' })).toBeInTheDocument();
    await user.click(within(menu).getByRole('menuitem', { name: 'Sign out' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/login'));
    expect(apiPost).toHaveBeenCalledWith('/auth/logout');
  });

  it('unsaved guard asks before leaving a dirty page', async () => {
    mockMe(editor);
    function Dirty() {
      useUnsavedGuard(true);
      return <h1>Editing</h1>;
    }
    const { router } = renderAdmin(
      '/admin/draft',
      shellRoutes([
        { index: true, element: <h1>Home</h1> },
        { path: 'draft', element: <Dirty /> },
        { path: 'products', element: <h1>Products page</h1> },
      ]),
    );
    const nav = await screen.findByRole('navigation', { name: 'Admin' });
    await user.click(within(nav).getByRole('link', { name: 'Products' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Discard unsaved changes?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(router.state.location.pathname).toBe('/admin/draft');
    expect(screen.getByRole('heading', { name: 'Editing' })).toBeInTheDocument();

    await user.click(within(nav).getByRole('link', { name: 'Products' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Discard' }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/products'));
  });

  it('unsaved guard does nothing on a clean page and warns on unload when dirty', async () => {
    mockMe(editor);
    function Page({ dirty }: { dirty: boolean }) {
      useUnsavedGuard(dirty);
      return <h1>{dirty ? 'Dirty' : 'Clean'}</h1>;
    }
    const { router } = renderAdmin(
      '/admin/clean',
      shellRoutes([
        { path: 'clean', element: <Page dirty={false} /> },
        { path: 'dirty', element: <Page dirty /> },
        { path: 'products', element: <h1>Products page</h1> },
      ]),
    );
    const nav = await screen.findByRole('navigation', { name: 'Admin' });
    await user.click(within(nav).getByRole('link', { name: 'Products' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/products'));
    expect(screen.queryByRole('alertdialog')).toBeNull();

    await act(() => router.navigate('/admin/dirty'));
    await screen.findByRole('heading', { name: 'Dirty' });
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('toasts once when a request is forbidden', async () => {
    mockMe(editor);
    function Forbidden() {
      useQuery({
        queryKey: ['admin', 'forbidden'],
        queryFn: () => Promise.reject(axiosError(403, 'FORBIDDEN')),
        retry: false,
      });
      return <h1>Forbidden page</h1>;
    }
    renderAdmin('/admin/x', shellRoutes([{ path: 'x', element: <Forbidden /> }]));
    await screen.findByRole('heading', { name: 'Forbidden page' });
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("You don't have permission for that", {
        id: 'admin-forbidden',
      }),
    );
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it('keeps the shell and a role-gated page when the session expires', async () => {
    mockMe(editor);
    renderAdmin('/admin/products');
    expect(await screen.findByRole('heading', { name: 'Products' })).toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new Event('niraum:auth-expired'));
    });
    expect(await screen.findByText('Session expired — sign in again')).toBeInTheDocument();
    // The modal hides the page from the accessibility tree, but it stays mounted.
    expect(screen.getByRole('heading', { name: 'Products', hidden: true })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: "You don't have access", hidden: true }),
    ).toBeNull();
    const nav = screen.getByRole('navigation', { name: 'Admin', hidden: true });
    expect(within(nav).getByRole('link', { name: 'Products', hidden: true })).toBeInTheDocument();
  });
});
