import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'sonner';
import { generatePassword, PASSWORD_MAX, PASSWORD_MIN } from '@/admin/auth/passwordRules';
import { ME_KEY } from '@/admin/auth/useMe';
import AuditLog from '@/admin/pages/Audit';
import Users from '@/admin/pages/Users';
import { api } from '@/lib/api';
import { admin, axiosError, superadmin } from './utils';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }));
vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const apiGet = vi.mocked(api.get);
const apiPost = vi.mocked(api.post);
const apiPut = vi.mocked(api.put);
const apiDelete = vi.mocked(api.delete);

const meRow = {
  id: superadmin.id,
  name: superadmin.name,
  email: superadmin.email,
  role: 'superadmin',
  isActive: true,
  mustChangePassword: false,
  lastLoginAt: '2026-10-09T08:00:00.000Z',
};
const adaRow = {
  id: '6650a1b2c3d4e5f601234570',
  name: 'Ada Admin',
  email: 'admin@niraum.test',
  role: 'admin',
  isActive: true,
  mustChangePassword: false,
  lastLoginAt: null,
};
const list = (data: unknown[]) => ({
  data: { data, meta: { page: 1, limit: 50, total: data.length, pages: 1 } },
});

function wrap(children: ReactNode, me = superadmin) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(ME_KEY, me);
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>,
  );
}

const user = userEvent.setup();

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
  apiPut.mockReset();
  apiDelete.mockReset();
  vi.mocked(toast.error).mockReset();
});

describe('generatePassword', () => {
  it('makes 20 random characters that satisfy the password rules', () => {
    const a = generatePassword();
    const b = generatePassword();
    expect(a).toHaveLength(20);
    expect(a.length).toBeGreaterThanOrEqual(PASSWORD_MIN);
    expect(a.length).toBeLessThanOrEqual(PASSWORD_MAX);
    expect(a).toMatch(/[a-z]/);
    expect(a).toMatch(/[A-Z]/);
    expect(a).toMatch(/[0-9]/);
    expect(a).toMatch(/[^a-zA-Z0-9]/);
    expect(a).not.toBe(b);
  });
});

describe('Users', () => {
  beforeEach(() => {
    apiGet.mockResolvedValue(list([meRow, adaRow]));
  });

  it('lists users and disables the role and active controls on your own row', async () => {
    wrap(<Users />);
    const ownRow = (await screen.findByText('super@niraum.test')).closest('tr')!;
    expect(within(ownRow).getByRole('combobox', { name: /Role of Sam Super/ })).toBeDisabled();
    expect(within(ownRow).getByRole('switch', { name: /Sam Super active/ })).toBeDisabled();

    const adaTr = screen.getByText('admin@niraum.test').closest('tr')!;
    expect(within(adaTr).getByRole('combobox', { name: /Role of Ada Admin/ })).toBeEnabled();
    expect(within(adaTr).getByRole('switch', { name: /Ada Admin active/ })).toBeEnabled();
    expect(within(adaTr).getByText('Never')).toBeInTheDocument();
    expect(apiGet).toHaveBeenCalledWith('/admin/users', { params: { page: 1, limit: 50 } });
  });

  it('invites a user with a generated 20-character password', async () => {
    apiPost.mockResolvedValue({ data: { data: { ...adaRow, id: 'new', name: 'Nita New' } } });
    wrap(<Users />);
    await user.click(await screen.findByRole('button', { name: 'Invite user' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/They must change it at first sign-in/)).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Name'), 'Nita New');
    await user.type(within(dialog).getByLabelText('Email'), 'nita@niraum.test');
    await user.selectOptions(within(dialog).getByLabelText('Role'), 'admin');
    await user.click(within(dialog).getByRole('button', { name: 'Generate' }));
    const pw = within(dialog).getByLabelText('Temporary password') as HTMLInputElement;
    const generated = pw.value;
    expect(generated).toHaveLength(20);

    await user.click(within(dialog).getByRole('button', { name: 'Create user' }));
    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith('/admin/users', {
        name: 'Nita New',
        email: 'nita@niraum.test',
        role: 'admin',
        password: generated,
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('does not submit a temporary password shorter than 12 characters', async () => {
    wrap(<Users />);
    await user.click(await screen.findByRole('button', { name: 'Invite user' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Name'), 'Nita New');
    await user.type(within(dialog).getByLabelText('Email'), 'nita@niraum.test');
    await user.type(within(dialog).getByLabelText('Temporary password'), 'short');
    await user.click(within(dialog).getByRole('button', { name: 'Create user' }));
    expect(await within(dialog).findByText('Use at least 12 characters.')).toBeInTheDocument();
    expect(apiPost).not.toHaveBeenCalled();
  });

  it('changes a role and shows a conflict message verbatim', async () => {
    apiPut.mockRejectedValue(
      Object.assign(axiosError(409, 'CONFLICT'), {
        response: {
          status: 409,
          data: {
            error: { code: 'CONFLICT', message: 'Cannot remove the last active superadmin' },
          },
        },
      }),
    );
    wrap(<Users />);
    const adaTr = (await screen.findByText('admin@niraum.test')).closest('tr')!;
    await user.selectOptions(within(adaTr).getByRole('combobox', { name: /Role/ }), 'editor');
    expect(apiPut).toHaveBeenCalledWith(`/admin/users/${adaRow.id}`, { role: 'editor' });
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Cannot remove the last active superadmin'),
    );
  });

  it('deactivates after confirmation', async () => {
    apiDelete.mockResolvedValue({ data: { data: { ...adaRow, isActive: false } } });
    wrap(<Users />);
    const adaTr = (await screen.findByText('admin@niraum.test')).closest('tr')!;
    await user.click(within(adaTr).getByRole('switch', { name: /Ada Admin active/ }));
    const confirm = await screen.findByRole('alertdialog');
    expect(apiDelete).not.toHaveBeenCalled();
    await user.click(within(confirm).getByRole('button', { name: 'Deactivate' }));
    await waitFor(() => expect(apiDelete).toHaveBeenCalledWith(`/admin/users/${adaRow.id}`));
  });
});

describe('Audit log', () => {
  const entry = {
    id: 'a1',
    action: 'update',
    entity: 'Product',
    entityId: '6650a1b2c3d4e5f601234599',
    at: '2026-10-09T08:00:00.000Z',
    ip: '127.0.0.1',
    user: { id: adaRow.id, name: 'Ada Admin', email: 'admin@niraum.test', role: 'admin' },
    diff: { title: { from: 'Old', to: 'New' } },
  };

  beforeEach(() => {
    apiGet.mockResolvedValue(list([entry]));
  });

  it('expands a row to show the field diff and links the entity to its editor', async () => {
    wrap(<AuditLog />, admin);
    const row = (await screen.findByText('Ada Admin')).closest('tr')!;
    expect(within(row).getByRole('link', { name: /6650a1b2c3d4e5f601234599/ })).toHaveAttribute(
      'href',
      '/admin/products/6650a1b2c3d4e5f601234599',
    );
    expect(screen.queryByText(/"Old" → "New"/)).toBeNull();
    await user.click(within(row).getByRole('button', { name: /Show changes/ }));
    expect(await screen.findByText(/"Old" → "New"/)).toHaveTextContent('title: "Old" → "New"');
  });

  it('links inquiries to their detail page and other inbox entries to their list', async () => {
    apiGet.mockResolvedValue(
      list([
        { ...entry, id: 'a2', entity: 'Inquiry', entityId: '6650a1b2c3d4e5f6012345aa' },
        { ...entry, id: 'a3', entity: 'Message', entityId: '6650a1b2c3d4e5f6012345bb' },
      ]),
    );
    wrap(<AuditLog />, admin);
    expect(await screen.findByRole('link', { name: /6650a1b2c3d4e5f6012345aa/ })).toHaveAttribute(
      'href',
      '/admin/inquiries/6650a1b2c3d4e5f6012345aa',
    );
    expect(screen.getByRole('link', { name: /6650a1b2c3d4e5f6012345bb/ })).toHaveAttribute(
      'href',
      '/admin/messages',
    );
  });

  it('filters by entity', async () => {
    wrap(<AuditLog />, admin);
    await screen.findByText('Ada Admin');
    await user.selectOptions(screen.getByLabelText('Entity'), 'Product');
    await waitFor(() =>
      expect(apiGet).toHaveBeenLastCalledWith('/admin/audit', {
        params: { page: 1, limit: 50, entity: 'Product' },
      }),
    );
  });

  it('filters by user from a row', async () => {
    wrap(<AuditLog />, admin);
    const row = (await screen.findByText('Ada Admin')).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: 'Only show Ada Admin' }));
    await waitFor(() =>
      expect(apiGet).toHaveBeenLastCalledWith('/admin/audit', {
        params: { page: 1, limit: 50, user: adaRow.id },
      }),
    );
  });
});
