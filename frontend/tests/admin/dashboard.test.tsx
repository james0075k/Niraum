import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { vi } from 'vitest';
import type { AdminUser } from '@/admin/auth/useMe';
import { api } from '@/lib/api';
import { admin, axiosError, editor, ok, renderAdmin } from './utils';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock('@/components/common/Captcha', () => import('./captchaMock'));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }));

Element.prototype.scrollIntoView ??= vi.fn();

const apiGet = vi.mocked(api.get);
const apiPost = vi.mocked(api.post);
const user = userEvent.setup();

const content = {
  products: { published: 1, draft: 1 },
  deposits: { published: 1, draft: 0 },
  team: { published: 2, draft: 0 },
  services: { published: 3, draft: 1 },
};
const assay = { samples: 40, summaries: 6, publicDetail: false };
const editorStats = { content, assay };
const adminStats = {
  content,
  assay,
  inbox: { inquiriesNew: 1, messagesNew: 2, applicationsNew: 3 },
  recent: [
    {
      id: 'a1',
      action: 'update',
      entity: 'Product',
      entityId: 'p1',
      at: '2026-10-10T08:00:00.000Z',
      user: { id: 'u1', name: 'admin 1', email: 'a@x.test', role: 'admin' },
    },
  ],
};

function mockApi(who: AdminUser, stats: unknown) {
  apiGet.mockImplementation((url: string) => {
    if (url === '/auth/me') return Promise.resolve(ok(who));
    if (url === '/admin/dashboard') return Promise.resolve(ok(stats));
    return new Promise(() => {});
  });
}

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

describe('admin dashboard', () => {
  it('shows skeletons while loading', async () => {
    apiGet.mockImplementation((url: string) =>
      url === '/auth/me' ? Promise.resolve(ok(admin)) : new Promise(() => {}),
    );
    renderAdmin('/admin');
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByLabelText('Loading dashboard')).toBeInTheDocument();
  });

  it('admin sees content, inbox cards and recent activity', async () => {
    mockApi(admin, adminStats);
    renderAdmin('/admin');
    expect(await screen.findByText('1 published · 1 draft')).toBeInTheDocument();
    const products = screen.getByText('1 published · 1 draft').closest('a');
    expect(products).toHaveAttribute('href', '/admin/products');
    const inquiries = screen.getByRole('link', { name: /New inquiries/ });
    expect(inquiries).toHaveAttribute('href', '/admin/inquiries?status=new');
    expect(within(inquiries).getByText('1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /New messages/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /New applications/ })).toBeInTheDocument();
    expect(screen.getByText(/admin 1 updated Product/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rebuild public site' })).toBeInTheDocument();
  });

  it('editor gets no inbox cards, activity or rebuild button', async () => {
    mockApi(editor, editorStats);
    renderAdmin('/admin');
    expect(await screen.findByText('1 published · 1 draft')).toBeInTheDocument();
    expect(screen.queryByText('New inquiries')).toBeNull();
    expect(screen.queryByText(/Recent activity/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Rebuild public site' })).toBeNull();
  });

  it('rebuild posts to the API and toasts', async () => {
    mockApi(admin, adminStats);
    apiPost.mockResolvedValueOnce({ data: { data: { triggered: true } } });
    renderAdmin('/admin');
    await user.click(await screen.findByRole('button', { name: 'Rebuild public site' }));
    expect(apiPost).toHaveBeenCalledWith('/admin/rebuild');
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('explains when no deploy hook is configured and toasts failures', async () => {
    mockApi(admin, adminStats);
    apiPost.mockResolvedValueOnce({ data: { data: { triggered: false } } });
    renderAdmin('/admin');
    await user.click(await screen.findByRole('button', { name: 'Rebuild public site' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/hook/i)));

    apiPost.mockRejectedValueOnce(axiosError(500, 'INTERNAL'));
    await user.click(screen.getByRole('button', { name: 'Rebuild public site' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(2));
  });
});
