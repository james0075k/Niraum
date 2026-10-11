import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { vi } from 'vitest';
import type { AdminUser } from '@/admin/auth/useMe';
import { defaultSettings } from '@/content/site';
import { api } from '@/lib/api';
import { admin, axiosError, editor, ok, renderAdmin } from './utils';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/components/common/Captcha', () => import('./captchaMock'));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
  Toaster: () => null,
}));

Element.prototype.scrollIntoView ??= vi.fn();

const apiGet = vi.mocked(api.get);
const apiPost = vi.mocked(api.post);
const apiPut = vi.mocked(api.put);
const user = userEvent.setup();

// Test fixtures only (made-up IDs and numbers); real figures come from assay_data.json.
const row = (id: string, sample: string, Fe: number, dataset = 'grab_B_C') => ({
  id,
  sample,
  dataset,
  SiO2: 40,
  LOI: null,
  Fe,
  Fe2O3: 50,
  Al2O3: 3,
  CaO: null,
  MgO: null,
  lengthM: null,
  note: '',
  order: 0,
});
const samples = [row('s1', 'T-1', 30), row('s2', 'T-2', 31), row('s3', 'T-CH-1', 20, 'channel_B')];
const summary = [
  {
    id: 'm1',
    section: 'A',
    thicknessM: 10,
    SiO2: 50,
    Fe: 20,
    Fe2O3: 30,
    Al2O3: 3,
    isOverall: false,
    order: 0,
  },
  {
    id: 'm9',
    section: 'Deposit weighted average',
    thicknessM: 10,
    SiO2: 50,
    Fe: 20,
    Fe2O3: 30,
    Al2O3: 3,
    isOverall: true,
    order: 99,
  },
];

function mockApi(who: AdminUser, publicAssayDetail = false) {
  apiGet.mockImplementation((url: string, config?: AxiosRequestConfig) => {
    if (url === '/auth/me') return Promise.resolve(ok(who));
    if (url === '/admin/assay/summary') return Promise.resolve(ok(summary));
    if (url === '/admin/assay/samples') {
      const data = samples.filter(
        (s) => s.dataset === (config?.params as { dataset?: string } | undefined)?.dataset,
      );
      return Promise.resolve({ data: { data, meta: { total: data.length } } });
    }
    if (url === '/admin/settings') return Promise.resolve(ok({ publicAssayDetail }));
    // The public site shell reads the same endpoint, so answer with full settings.
    if (url === '/settings/public') {
      return Promise.resolve(ok({ ...defaultSettings, publicAssayDetail }));
    }
    return new Promise(() => {});
  });
}

const csvFile = (text: string) => new File([text], 'samples.csv', { type: 'text/csv' });

beforeAll(async () => {
  await import('@/admin/pages/Assay');
});

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
  apiPut.mockReset();
  for (const fn of Object.values(toast)) vi.mocked(fn).mockReset();
});

describe('admin assay data', () => {
  it('shows dataset tabs and the summary with the source-document note', async () => {
    mockApi(editor);
    renderAdmin('/admin/assay');
    expect(await screen.findByRole('heading', { name: 'Assay data' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Numbers come from the assay report — change them only to match the source document.',
      ),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: 'Deposit weighted average' }),
    ).toBeInTheDocument();

    const tabs = screen.getByRole('tablist', { name: 'Dataset' });
    expect(within(tabs).getAllByRole('tab')).toHaveLength(5);
    expect(await screen.findByRole('cell', { name: 'T-1' })).toBeInTheDocument();
    await user.click(within(tabs).getByRole('tab', { name: /Channel — section B/ }));
    expect(await screen.findByRole('cell', { name: 'T-CH-1' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'T-1' })).toBeNull();
    expect(document.body.textContent).not.toMatch(/high[- ]grade/i);
  });

  it('edits a Fe cell inline; Enter saves with PUT', async () => {
    mockApi(editor);
    apiPut.mockResolvedValue(ok({ ...samples[0], Fe: 30.5 }));
    renderAdmin('/admin/assay');
    await user.click(await screen.findByRole('button', { name: 'Edit Fe of T-1' }));
    const input = screen.getByRole('spinbutton', { name: 'Fe of T-1' });
    await user.clear(input);
    await user.type(input, '30.5{Enter}');
    await waitFor(() =>
      expect(apiPut).toHaveBeenCalledWith('/admin/assay/samples/s1', { Fe: 30.5 }),
    );
    expect(toast.success).toHaveBeenCalled();
  });

  it('refuses an out-of-range value without calling the API', async () => {
    mockApi(editor);
    renderAdmin('/admin/assay');
    await user.click(await screen.findByRole('button', { name: 'Edit Fe of T-1' }));
    const input = screen.getByRole('spinbutton', { name: 'Fe of T-1' });
    await user.clear(input);
    await user.type(input, '120{Enter}');
    expect(await screen.findByText('Fe must be between 0 and 100')).toBeInTheDocument();
    expect(apiPut).not.toHaveBeenCalled();
  });

  it('edits a summary number and PUTs it to the summary row', async () => {
    mockApi(editor);
    apiPut.mockResolvedValue(ok({ ...summary[0], Fe: 20.1 }));
    renderAdmin('/admin/assay');
    await user.click(await screen.findByRole('button', { name: 'Edit Fe of A' }));
    const input = screen.getByRole('spinbutton', { name: 'Fe of A' });
    await user.clear(input);
    await user.type(input, '20.1{Enter}');
    await waitFor(() =>
      expect(apiPut).toHaveBeenCalledWith('/admin/assay/summary/m1', { Fe: 20.1 }),
    );
  });

  it('imports a CSV: preview, replace confirm, POST as text/csv', async () => {
    mockApi(editor);
    apiPost.mockResolvedValue(ok({ inserted: 2, replaced: 2 }));
    renderAdmin('/admin/assay');
    await user.click(await screen.findByRole('button', { name: 'Import CSV' }));
    const dialog = await screen.findByRole('dialog');
    const text = 'sample,SiO2,Fe,Fe2O3,Al2O3\nT-5,40,30,42.9,3\nT-6,41,29,41.5,3\n';
    await user.upload(within(dialog).getByLabelText('CSV file'), csvFile(text));
    expect(await within(dialog).findByRole('cell', { name: 'T-6' })).toBeInTheDocument();
    expect(within(dialog).getByText(/2 rows/)).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole('button', { name: 'Replace all samples in Grab — areas B & C' }),
    );
    await waitFor(() => expect(apiPost).toHaveBeenCalled());
    expect(apiPost).toHaveBeenCalledWith('/admin/assay/import', text, {
      params: { dataset: 'grab_B_C', mode: 'replace' },
      headers: { 'Content-Type': 'text/csv' },
    });
    expect(toast.success).toHaveBeenCalledWith('Imported 2 samples (replaced 2)');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('lists every bad line from a 400 and keeps the dialog open', async () => {
    mockApi(editor);
    apiPost.mockRejectedValue(
      axiosError(400, 'VALIDATION_ERROR', {
        formErrors: [],
        rows: [
          { line: 2, errors: ['Fe must be ≤ 100'] },
          { line: 3, errors: ['sample is required'] },
        ],
      }),
    );
    renderAdmin('/admin/assay');
    await user.click(await screen.findByRole('button', { name: 'Import CSV' }));
    const dialog = await screen.findByRole('dialog');
    await user.upload(
      within(dialog).getByLabelText('CSV file'),
      csvFile('sample,SiO2,Fe,Fe2O3,Al2O3\nT-5,40,101,42.9,3\n,40,30,42.9,3\n'),
    );
    await user.click(await within(dialog).findByRole('button', { name: /Replace all samples/ }));
    const errors = await within(dialog).findByRole('list', { name: 'Import errors' });
    expect(within(errors).getByText('Line 2: Fe must be ≤ 100')).toBeInTheDocument();
    expect(within(errors).getByText('Line 3: sample is required')).toBeInTheDocument();
  });

  it('admins switch public sample data on; editors see it read-only', async () => {
    mockApi(admin);
    apiPut.mockResolvedValue(ok({ publicAssayDetail: true }));
    const { unmount } = renderAdmin('/admin/assay');
    const toggle = await screen.findByRole('switch', {
      name: 'Show sample-level data on the public site',
    });
    await waitFor(() => expect(toggle).toBeEnabled());
    await user.click(toggle);
    await waitFor(() =>
      expect(apiPut).toHaveBeenCalledWith('/admin/settings', { publicAssayDetail: true }),
    );
    unmount();
    apiGet.mockClear();

    mockApi(editor, true);
    renderAdmin('/admin/assay');
    const readOnly = await screen.findByRole('switch', {
      name: 'Show sample-level data on the public site',
    });
    await waitFor(() => expect(readOnly).toBeChecked());
    expect(readOnly).toBeDisabled();
    expect(screen.getByText(/Only admins can change this/)).toBeInTheDocument();
    expect(apiGet).not.toHaveBeenCalledWith('/admin/settings');
  });

  it('downloads the current rows as CSV', async () => {
    mockApi(editor);
    const createObjectURL = vi.fn(() => 'blob:assay');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderAdmin('/admin/assay');
    await screen.findByRole('cell', { name: 'T-1' });
    fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }));
    expect(click).toHaveBeenCalled();
    const blob = (createObjectURL.mock.calls[0] as unknown as [Blob])[0];
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsText(blob);
    });
    expect(text.split('\n')[0]).toBe('sample,SiO2,LOI,Fe,Fe2O3,Al2O3,CaO,MgO,lengthM,note');
    expect(text).toContain('T-1,40,,30,50,3,,,,');
    click.mockRestore();
  });

  it('shows a 403 on save as a toast', async () => {
    mockApi(editor);
    apiPut.mockRejectedValue(axiosError(403, 'FORBIDDEN'));
    renderAdmin('/admin/assay');
    await user.click(await screen.findByRole('button', { name: 'Edit Fe of T-2' }));
    await user.type(screen.getByRole('spinbutton', { name: 'Fe of T-2' }), '{Backspace}2{Enter}');
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
