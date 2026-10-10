import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { vi } from 'vitest';
import { RESOURCE_PATHS } from '@/admin/routes';
import { adminPathOf, RESOURCES, type ResourceKey } from '@/admin/resources/config';
import { api } from '@/lib/api';
import { editor, ok, renderAdmin } from './utils';

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
const apiPut = vi.mocked(api.put);
const apiPost = vi.mocked(api.post);
const apiDelete = vi.mocked(api.delete);

const product = {
  id: 'p1',
  name: 'Hematite iron ore',
  slug: 'hematite-iron-ore',
  chemicalFormula: 'Fe₂O₃',
  summary: 'Industrial hematite',
  applications: [{ title: 'Cement', body: 'Iron corrective' }],
  typicalChemistry: [{ oxide: 'Fe2O3', value: 33.59, unit: '%', basis: 'Table 14' }],
  sizes: [],
  minOrder: '',
  packing: '',
  image: null,
  order: 0,
  published: true,
  isDeleted: false,
  updatedAt: '2026-10-09T08:00:00.000Z',
  translations: {
    name: { en: 'Hematite iron ore', ne: 'हेमाटाइट फलाम खनिज' },
    summary: { en: 'Industrial hematite', ne: 'औद्योगिक हेमाटाइट' },
    applications: [{ title: { en: 'Cement', ne: 'सिमेन्ट' }, body: { en: 'Iron corrective' } }],
    typicalChemistry: [{ oxide: 'Fe2O3', value: 33.59, unit: '%', basis: { en: 'Table 14' } }],
  },
};
const draft = {
  ...product,
  id: 'p2',
  name: 'Iron ore fines',
  slug: 'iron-ore-fines',
  published: false,
  translations: { ...product.translations, name: { en: 'Iron ore fines' } },
};

const list = (data: unknown[]) => ({
  data: { data, meta: { page: 1, limit: 20, total: data.length, pages: 1 } },
});

function mockApi() {
  apiGet.mockImplementation((url: string) => {
    if (url === '/auth/me') return Promise.resolve(ok(editor));
    if (url === '/admin/products') return Promise.resolve(list([product, draft]));
    if (url === '/admin/products/p1') return Promise.resolve(ok(product));
    return new Promise(() => {});
  });
}

const listParams = () =>
  apiGet.mock.calls
    .filter(([url]) => url === '/admin/products')
    .map(([, config]) => (config as { params: Record<string, unknown> }).params);

// Warm the lazily loaded shell and pages so the first test isn't racing a cold transform.
beforeAll(async () => {
  await import('@/admin/AdminRoot');
  await import('@/admin/pages/ResourceList');
  await import('@/admin/pages/ResourceEdit');
});

beforeEach(() => {
  for (const fn of [apiGet, apiPut, apiPost, apiDelete]) fn.mockReset();
  for (const fn of Object.values(toast)) vi.mocked(fn).mockReset();
  mockApi();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('resource routes', () => {
  it('route paths match the configured resources', () => {
    for (const [key, path] of Object.entries(RESOURCE_PATHS)) {
      const cfg = RESOURCES[key as ResourceKey];
      expect(cfg, key).toBeDefined();
      expect(`/admin/${path}`).toBe(adminPathOf(cfg!));
    }
    expect(Object.keys(RESOURCE_PATHS).sort()).toEqual(Object.keys(RESOURCES).sort());
  });
});

describe('admin products list', () => {
  it('renders rows from GET /admin/products with their status', async () => {
    renderAdmin('/admin/products');
    const row = (await screen.findByText('Hematite iron ore')).closest('tr') as HTMLElement;
    expect(within(row).getByText('Published')).toBeInTheDocument();
    const draftRow = screen.getByText('Iron ore fines').closest('tr') as HTMLElement;
    expect(within(draftRow).getByText('Draft')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New product' })).toHaveAttribute(
      'href',
      '/admin/products/new',
    );
    expect(listParams()[0]).toMatchObject({ page: 1, limit: 20, state: 'all' });
  });

  it('debounces search by 300 ms and sends q', async () => {
    renderAdmin('/admin/products');
    await screen.findByText('Hematite iron ore');
    vi.useFakeTimers({ shouldAdvanceTime: false });
    const search = screen.getByRole('searchbox', { name: 'Search products' });
    fireEvent.change(search, { target: { value: 'lump' } });
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(listParams().some((p) => p.q === 'lump')).toBe(false);
    await act(async () => {
      vi.advanceTimersByTime(150);
    });
    vi.useRealTimers();
    await waitFor(() => expect(listParams().some((p) => p.q === 'lump')).toBe(true));
  });

  it('sorts by a column header and filters by state', async () => {
    const user = userEvent.setup();
    renderAdmin('/admin/products');
    await screen.findByText('Hematite iron ore');
    await user.click(screen.getByRole('button', { name: /Updated/ }));
    await waitFor(() => expect(listParams().at(-1)).toMatchObject({ sort: 'updatedAt' }));
    await user.click(screen.getByRole('button', { name: /Updated/ }));
    await waitFor(() => expect(listParams().at(-1)).toMatchObject({ sort: '-updatedAt' }));
    await user.click(screen.getByRole('tab', { name: 'Draft' }));
    await waitFor(() => expect(listParams().at(-1)).toMatchObject({ state: 'draft' }));
  });

  it('bulk publish sends one PUT per row and one summary toast', async () => {
    const user = userEvent.setup();
    apiPut.mockResolvedValue(ok(product));
    renderAdmin('/admin/products');
    await screen.findByText('Hematite iron ore');
    await user.click(screen.getByRole('checkbox', { name: 'Select all' }));
    await user.click(screen.getByRole('button', { name: 'Publish' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    expect(apiPut).toHaveBeenCalledWith('/admin/products/p1', { published: true });
    expect(apiPut).toHaveBeenCalledWith('/admin/products/p2', { published: true });
    expect(toast.success).toHaveBeenCalledWith('2 products published');
  });
});

describe('admin product edit', () => {
  it('shows the Nepali summary from translations', async () => {
    const user = userEvent.setup();
    renderAdmin('/admin/products/p1');
    const tabs = await screen.findByRole('tablist', { name: 'Summary language' });
    await user.click(within(tabs).getByRole('tab', { name: /नेपाली/ }));
    expect(screen.getByLabelText('Summary (Nepali)')).toHaveValue('औद्योगिक हेमाटाइट');
  });

  it('saving after an English-only edit sends just { name: { en } }', async () => {
    const user = userEvent.setup();
    apiPut.mockResolvedValue(ok({ ...product, name: 'New' }));
    renderAdmin('/admin/products/p1');
    const name = await screen.findByLabelText('Name (English)');
    await user.clear(name);
    await user.type(name, 'New');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(apiPut).toHaveBeenCalledTimes(1));
    expect(apiPut).toHaveBeenCalledWith('/admin/products/p1', { name: { en: 'New' } });
  });

  it('an empty English name shows a field error and sends nothing', async () => {
    const user = userEvent.setup();
    renderAdmin('/admin/products/p1');
    const name = await screen.findByLabelText('Name (English)');
    await user.clear(name);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Required')).toBeInTheDocument();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(apiPut).not.toHaveBeenCalled();
  });

  it('marks supply terms as [CONFIRM] and has no preview without a public card', async () => {
    renderAdmin('/admin/products/p1');
    await screen.findByLabelText('Name (English)');
    expect(screen.getAllByText('[CONFIRM] with client before publishing').length).toBe(3);
    expect(screen.queryByRole('button', { name: 'Preview' })).toBeNull();
    expect(screen.getByRole('link', { name: /View on site \(EN\)/ })).toHaveAttribute(
      'href',
      '/en/products',
    );
  });

  it('creates a product with every field and opens it', async () => {
    const user = userEvent.setup();
    apiPost.mockResolvedValue(ok({ ...product, id: 'p9', name: 'Lump ore' }));
    const { router } = renderAdmin('/admin/products/new');
    await user.type(await screen.findByLabelText('Name (English)'), 'Lump ore');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(1));
    const [url, body] = apiPost.mock.calls.at(0) ?? [];
    expect(url).toBe('/admin/products');
    expect(body).toMatchObject({
      name: { en: 'Lump ore' },
      summary: { en: '' },
      applications: [],
      typicalChemistry: [],
      sizes: [],
      published: false,
      image: null,
    });
    expect(body).not.toHaveProperty('slug');
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/products/p9'));
  });
});
