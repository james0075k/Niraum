import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { toast } from 'sonner';
import { CsvButton } from '@/admin/components/CsvButton';
import Applications from '@/admin/pages/Applications';
import Inquiries from '@/admin/pages/Inquiries';
import InquiryDetail from '@/admin/pages/InquiryDetail';
import Messages from '@/admin/pages/Messages';
import { api } from '@/lib/api';
import { axiosError } from './utils';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }));

const apiGet = vi.mocked(api.get);
const apiPatch = vi.mocked(api.patch);
const user = userEvent.setup();

const himal = {
  id: '6650a1b2c3d4e5f601234567',
  companyName: 'Himal Cement Ltd',
  contactName: 'Sita Sharma',
  email: 'buyer@example.com',
  phone: '+977 1 5555555',
  buyerType: 'cement',
  topic: 'supply',
  quantity: 500,
  quantityUnit: 'tpm',
  deliveryLocation: 'Hetauda',
  specRequirement: 'Fe2O3 ≥ 40 %',
  message: 'Please quote for monthly supply.',
  lang: 'en',
  sourcePage: '/en/contact',
  status: 'new',
  createdAt: '2026-10-09T08:00:00.000Z',
};
const counts = { new: 3, contacted: 1, quoted: 0, won: 0, lost: 0, spam: 2 };
const listOf = (rows: unknown[], extra: Record<string, unknown> = {}) => ({
  data: { data: rows, meta: { page: 1, limit: 20, total: rows.length, pages: 1, ...extra } },
});

const message = {
  id: '6650a1b2c3d4e5f601234570',
  name: 'Hari Gurung',
  email: 'hari@example.com',
  phone: '',
  company: '',
  subject: 'Site visit',
  message: 'Can we visit the Katujpani site next month?',
  status: 'new',
  createdAt: '2026-10-09T09:00:00.000Z',
};
const application = {
  id: '6650a1b2c3d4e5f601234580',
  name: 'Maya Rai',
  email: 'maya@example.com',
  phone: '9800000000',
  message: 'Geologist with field experience.',
  jobTitle: 'General application',
  cvBytes: 120_000,
  status: 'new',
  createdAt: '2026-10-08T09:00:00.000Z',
};

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/inquiries" element={<Inquiries />} />
          <Route path="/admin/inquiries/:id" element={<InquiryDetail />} />
          <Route path="/admin/messages" element={<Messages />} />
          <Route path="/admin/applications" element={<Applications />} />
          <Route path="/csv" element={<CsvButton path="/admin/x.csv" filename="x.csv" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Params of the last GET to `path`. */
const lastParams = (path: string) =>
  apiGet.mock.calls.filter(([p]) => p === path).at(-1)?.[1]?.params as
    Record<string, unknown> | undefined;

beforeEach(() => {
  apiGet.mockReset();
  apiPatch.mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

describe('Inquiries', () => {
  beforeEach(() => {
    apiGet.mockImplementation(async (path: string) => {
      if (path === '/admin/inquiries') return listOf([himal], { counts });
      throw new Error(`unexpected GET ${path}`);
    });
  });

  it('shows a pipeline chip per status; clicking "New 3" filters to status=new', async () => {
    renderAt('/admin/inquiries');
    expect(await screen.findByRole('heading', { level: 1, name: 'Inquiries' })).toBeVisible();
    const pipeline = screen.getByRole('group', { name: 'Pipeline' });
    const chip = await within(pipeline).findByRole('button', { name: 'New 3' });
    for (const name of ['Contacted 1', 'Quoted 0', 'Won 0', 'Lost 0', 'Spam 2']) {
      expect(within(pipeline).getByRole('button', { name })).toBeInTheDocument();
    }
    expect(lastParams('/admin/inquiries')?.status).toBeUndefined();

    await user.click(chip);
    await waitFor(() => expect(lastParams('/admin/inquiries')?.status).toBe('new'));
    expect(chip).toHaveAttribute('aria-pressed', 'true');

    const row = (await screen.findByRole('link', { name: 'Himal Cement Ltd' })).closest('tr')!;
    expect(row).toHaveTextContent('Sita Sharma');
    expect(row).toHaveTextContent('500 t/month');
    expect(within(row).getByText('New')).toBeInTheDocument();
  });

  it('reads the status filter from the URL (dashboard links)', async () => {
    renderAt('/admin/inquiries?status=spam');
    await waitFor(() => expect(lastParams('/admin/inquiries')?.status).toBe('spam'));
  });

  it('CSV export downloads a blob with the current filters', async () => {
    const blob = new Blob(['id\r\n'], { type: 'text/csv' });
    const createObjectURL = vi.fn(() => 'blob:csv');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    apiGet.mockImplementation(async (path: string) => {
      if (path === '/admin/inquiries') return listOf([himal], { counts });
      if (path === '/admin/inquiries/export.csv') return { data: blob };
      throw new Error(`unexpected GET ${path}`);
    });

    renderAt('/admin/inquiries?status=quoted');
    await user.type(screen.getByRole('searchbox', { name: 'Search inquiries' }), 'himal');
    await waitFor(() => expect(lastParams('/admin/inquiries')?.q).toBe('himal'));
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));

    await waitFor(() =>
      expect(apiGet).toHaveBeenCalledWith('/admin/inquiries/export.csv', {
        params: { status: 'quoted', q: 'himal' },
        responseType: 'blob',
      }),
    );
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalled();
    const anchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toMatch(/^inquiries-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(anchor.href).toBe('blob:csv');
    await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv'));
    click.mockRestore();
  });

  it('CSV failure shows an error toast', async () => {
    apiGet.mockRejectedValueOnce(axiosError(403, 'FORBIDDEN'));
    renderAt('/csv');
    await user.click(screen.getByRole('button', { name: 'Export CSV' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});

describe('InquiryDetail', () => {
  const audit = {
    id: 'a1',
    action: 'update',
    entity: 'Inquiry',
    entityId: himal.id,
    diff: { status: { from: 'new', to: 'contacted' } },
    at: '2026-10-09T10:00:00.000Z',
    user: { name: 'Ada Admin', email: 'admin@niraum.test' },
  };

  beforeEach(() => {
    apiGet.mockImplementation(async (path: string) => {
      if (path === `/admin/inquiries/${himal.id}`) return { data: { data: himal } };
      if (path === '/admin/audit') return listOf([audit]);
      throw new Error(`unexpected GET ${path}`);
    });
  });

  it('shows every field with mailto/tel links and the audit activity', async () => {
    renderAt(`/admin/inquiries/${himal.id}`);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Himal Cement Ltd' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'buyer@example.com' })).toHaveAttribute(
      'href',
      'mailto:buyer@example.com',
    );
    expect(screen.getByRole('link', { name: '+977 1 5555555' })).toHaveAttribute(
      'href',
      'tel:+97715555555',
    );
    for (const text of ['Hetauda', 'Fe2O3 ≥ 40 %', 'Please quote for monthly supply.']) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    const activity = screen.getByRole('region', { name: 'Activity' });
    expect(await within(activity).findByText(/New → Contacted/)).toBeInTheDocument();
    expect(within(activity).getByText(/Ada Admin/)).toBeInTheDocument();
    expect(lastParams('/admin/audit')).toMatchObject({ entity: 'Inquiry', entityId: himal.id });
  });

  it('status select PATCHes and updates the badge optimistically; reverts with a toast', async () => {
    let reject!: (e: unknown) => void;
    apiPatch.mockImplementationOnce(() => new Promise((_, r) => (reject = r)));
    renderAt(`/admin/inquiries/${himal.id}`);
    const select = await screen.findByRole('combobox', { name: 'Status' });
    const badge = () => screen.getByTestId('status-badge');
    expect(badge()).toHaveTextContent('New');

    await user.selectOptions(select, 'quoted');
    expect(apiPatch).toHaveBeenCalledWith(`/admin/inquiries/${himal.id}`, { status: 'quoted' });
    await waitFor(() => expect(badge()).toHaveTextContent('Quoted'));

    reject(axiosError(500, 'INTERNAL'));
    await waitFor(() => expect(badge()).toHaveTextContent('New'));
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/status/i));
    expect(select).toHaveValue('new');
  });

  it('keeps the new status after a successful PATCH', async () => {
    let saved = himal;
    apiGet.mockImplementation(async (path: string) => {
      if (path === `/admin/inquiries/${himal.id}`) return { data: { data: saved } };
      if (path === '/admin/audit') return listOf([]);
      throw new Error(`unexpected GET ${path}`);
    });
    apiPatch.mockImplementationOnce(async () => {
      saved = { ...himal, status: 'won' };
      return { data: { data: saved } };
    });
    renderAt(`/admin/inquiries/${himal.id}`);
    await user.selectOptions(await screen.findByRole('combobox', { name: 'Status' }), 'won');
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Won');
  });
});

describe('Messages', () => {
  beforeEach(() => {
    let stored = message;
    apiGet.mockImplementation(async (path: string) => {
      if (path === '/admin/messages') return listOf([stored]);
      throw new Error(`unexpected GET ${path}`);
    });
    apiPatch.mockImplementation(async (_p: string, body?: unknown) => {
      stored = { ...stored, ...(body as object) };
      return { data: { data: stored } };
    });
  });

  it('opening a new message marks it read', async () => {
    renderAt('/admin/messages');
    await user.click(await screen.findByRole('button', { name: /Site visit/ }));
    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).getByText(message.message)).toBeInTheDocument();
    expect(apiPatch).toHaveBeenCalledTimes(1);
    expect(apiPatch).toHaveBeenCalledWith(`/admin/messages/${message.id}`, { status: 'read' });
    await waitFor(() =>
      expect(within(sheet).getByRole('combobox', { name: 'Status' })).toHaveValue('read'),
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('does not PATCH when opening a message that is already read', async () => {
    apiGet.mockResolvedValue(listOf([{ ...message, status: 'replied' }]));
    renderAt('/admin/messages');
    await user.click(await screen.findByRole('button', { name: /Site visit/ }));
    await screen.findByRole('dialog');
    expect(apiPatch).not.toHaveBeenCalled();
  });

  it('offers new, read, replied and spam', async () => {
    renderAt('/admin/messages');
    await user.click(await screen.findByRole('button', { name: /Site visit/ }));
    const select = within(await screen.findByRole('dialog')).getByRole('combobox', {
      name: 'Status',
    });
    expect(
      within(select)
        .getAllByRole('option')
        .map((o) => (o as HTMLOptionElement).value),
    ).toEqual(['new', 'read', 'replied', 'spam']);
  });
});

describe('Applications', () => {
  beforeEach(() => {
    apiGet.mockImplementation(async (path: string) => {
      if (path === '/admin/applications') return listOf([application]);
      if (path === `/admin/applications/${application.id}`) {
        return { data: { data: { ...application, cvUrl: 'https://cdn.example/cv.pdf?sig=1' } } };
      }
      throw new Error(`unexpected GET ${path}`);
    });
  });

  it('opens the detail with a signed "Open CV" link in a new tab', async () => {
    renderAt('/admin/applications');
    await user.click(await screen.findByRole('button', { name: /Maya Rai/ }));
    const sheet = await screen.findByRole('dialog');
    const cv = await within(sheet).findByRole('link', { name: /Open CV/ });
    expect(cv).toHaveAttribute('href', 'https://cdn.example/cv.pdf?sig=1');
    expect(cv).toHaveAttribute('target', '_blank');
    expect(cv).toHaveAttribute('rel', 'noopener noreferrer');
    expect(within(sheet).getByText(application.message)).toBeInTheDocument();
  });
});
