import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { vi } from 'vitest';
import type { AdminUser } from '@/admin/auth/useMe';
import { api } from '@/lib/api';
import { admin, editor, ok, renderAdmin } from './utils';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
vi.mock('@/components/common/Captcha', () => import('./captchaMock'));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
  Toaster: () => null,
}));
// Leaflet needs a real layout; the picker is a button that "drags" the pin.
vi.mock('@/admin/components/MapPinPicker', () => ({
  MapPinPicker: (p: {
    lat: number | null;
    lng: number | null;
    onChange(v: { lat: number; lng: number }): void;
  }) => (
    <div>
      <span data-testid="pin">{`${p.lat}, ${p.lng}`}</span>
      <button type="button" onClick={() => p.onChange({ lat: 27.7, lng: 85.3 })}>
        move pin
      </button>
    </div>
  ),
}));

Element.prototype.scrollIntoView ??= vi.fn();

const apiGet = vi.mocked(api.get);
const apiPost = vi.mocked(api.post);
const apiPut = vi.mocked(api.put);
const user = userEvent.setup();

const base = {
  companyName: 'Niraum Metals',
  legalName: 'Niraum Metals Pvt. Ltd.',
  motto: 'Test motto',
  logo: { light: null, dark: null },
  contact: { phone: ['+977 1 5550100'], email: ['info@niraum.test'], whatsapp: null },
  address: {
    line1: 'Lalitpur-13',
    city: 'Lalitpur',
    district: 'Lalitpur',
    province: 'Bagmati',
    country: 'Nepal',
    postalCode: '',
  },
  location: {
    lat: 27.66,
    lng: 85.32,
    zoom: 15,
    manualOverride: false,
    approximate: true,
    geocodedAt: null,
  },
  officeHours: 'Sun–Fri 10:00–17:00',
  social: [
    { platform: 'instagram', url: 'https://instagram.com/niraum', isActive: true, order: 1 },
    { platform: 'facebook', url: 'https://facebook.com/niraum', isActive: true, order: 0 },
    { platform: 'linkedin', url: 'https://linkedin.com/company/niraum', isActive: false, order: 2 },
  ],
  seo: {
    defaultTitle: 'Niraum Metals',
    defaultDescription: 'Test description',
    ogImage: '/og-image.jpg',
    keywords: ['iron ore'],
  },
  footer: { about: 'Test about', links: [{ label: 'Privacy', href: '/legal/privacy' }] },
  theme: { defaultMode: 'system' },
  publicAssayDetail: false,
  defaultLanguage: 'en',
  translations: {
    motto: { en: 'Test motto', ne: 'परीक्षण' },
    footer: { about: { en: 'Test about' } },
  },
};

function mockSettings(settings: unknown, who: AdminUser = admin) {
  apiGet.mockImplementation((url: string) => {
    if (url === '/auth/me') return Promise.resolve(ok(who));
    if (url === '/admin/settings') return Promise.resolve(ok(settings));
    return new Promise(() => {});
  });
}

const saved = (data: unknown = base, warnings: unknown[] = []) => ({
  data: { data, meta: { warnings } },
});

const putBody = (call = 0) => apiPut.mock.calls.at(call)?.[1] as Record<string, unknown>;

// Warm the lazily loaded page once so the first test isn't racing a cold transform.
beforeAll(async () => {
  await import('@/admin/pages/Settings');
});

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
  apiPut.mockReset();
  for (const fn of Object.values(toast)) vi.mocked(fn).mockReset();
  apiPut.mockResolvedValue(saved());
});

describe('admin settings', () => {
  it('dragging the pin saves lat/lng with manualOverride', async () => {
    mockSettings(base);
    renderAdmin('/admin/settings?tab=address');
    await user.click(await screen.findByRole('button', { name: 'move pin' }));
    await user.click(screen.getByRole('button', { name: 'Save address & map' }));
    await waitFor(() => expect(apiPut).toHaveBeenCalled());
    expect(apiPut).toHaveBeenCalledWith(
      '/admin/settings',
      expect.objectContaining({
        location: expect.objectContaining({ lat: 27.7, lng: 85.3, manualOverride: true }),
      }),
    );
    expect(Object.keys(putBody()).sort()).toEqual(['address', 'location']);
  });

  it('GEOCODE_FAILED keeps the old pin and shows a warning', async () => {
    apiPut.mockResolvedValueOnce(
      saved(base, [{ code: 'GEOCODE_FAILED', message: 'Address could not be located.' }]),
    );
    mockSettings(base);
    renderAdmin('/admin/settings?tab=address');
    const city = await screen.findByLabelText('City');
    await user.clear(city);
    await user.type(city, 'Nowhereville');
    await user.click(screen.getByRole('button', { name: 'Save address & map' }));
    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith(expect.stringMatching(/pin wasn't moved/i)),
    );
    const body = putBody();
    expect(body.address).toEqual(expect.objectContaining({ city: 'Nowhereville' }));
    // The pin wasn't touched, so no coordinates are sent.
    expect(body.location).not.toHaveProperty('lat');
    expect(screen.getByTestId('pin')).toHaveTextContent('27.66, 85.32');
  });

  it('GEOCODE_APPROXIMATE on save shows an info toast', async () => {
    apiPut.mockResolvedValueOnce(saved(base, [{ code: 'GEOCODE_APPROXIMATE', message: '…' }]));
    mockSettings(base);
    renderAdmin('/admin/settings?tab=address');
    const line1 = await screen.findByLabelText('Street / ward');
    await user.type(line1, ' Ward');
    await user.click(screen.getByRole('button', { name: 'Save address & map' }));
    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith(
        'Pin placed at city level — drag it to the exact spot',
      ),
    );
  });

  it('"Find on map" previews the address and moves the pin without saving', async () => {
    apiPost.mockResolvedValueOnce({
      data: {
        data: {
          ok: true,
          lat: 27.123456,
          lng: 85.654321,
          displayName: 'Lalitpur',
          approximate: false,
          cached: false,
          query: 'x',
        },
      },
    });
    mockSettings(base);
    renderAdmin('/admin/settings?tab=address');
    await user.click(await screen.findByRole('button', { name: 'Find on map' }));
    await waitFor(() =>
      expect(screen.getByTestId('pin')).toHaveTextContent('27.123456, 85.654321'),
    );
    expect(apiPost).toHaveBeenCalledWith('/admin/settings/geocode', {
      address: expect.objectContaining({ city: 'Lalitpur' }),
    });
    expect(apiPut).not.toHaveBeenCalled();
  });

  it('"Find on map" failure leaves the pin and warns', async () => {
    apiPost.mockResolvedValueOnce({ data: { data: { ok: false, reason: 'not_found' } } });
    mockSettings(base);
    renderAdmin('/admin/settings?tab=address');
    await user.click(await screen.findByRole('button', { name: 'Find on map' }));
    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith(
        "Couldn't find that address — the pin wasn't moved. Drag it to set the location.",
      ),
    );
    expect(screen.getByTestId('pin')).toHaveTextContent('27.66, 85.32');
  });

  it('"Reset to address" geocodes and saves with manualOverride false', async () => {
    apiPost.mockResolvedValueOnce({
      data: {
        data: {
          ok: true,
          lat: 27.5,
          lng: 85.5,
          displayName: 'Lalitpur',
          approximate: false,
          cached: true,
          query: 'x',
        },
      },
    });
    mockSettings({ ...base, location: { ...base.location, manualOverride: true } });
    renderAdmin('/admin/settings?tab=address');
    expect(await screen.findByRole('switch', { name: 'Pin set manually' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Reset to address' }));
    await user.click(await screen.findByRole('button', { name: 'Reset and save' }));
    await waitFor(() => expect(apiPut).toHaveBeenCalled());
    expect(putBody()).toEqual({
      address: base.address,
      location: { lat: 27.5, lng: 85.5, manualOverride: false },
    });
  });

  it('turning Instagram off sends isActive false and keeps order', async () => {
    mockSettings(base);
    renderAdmin('/admin/settings?tab=social');
    await user.click(await screen.findByRole('switch', { name: 'Instagram active' }));
    await user.click(screen.getByRole('button', { name: 'Save social links' }));
    await waitFor(() => expect(apiPut).toHaveBeenCalled());
    expect(putBody()).toEqual({
      social: [
        { platform: 'facebook', url: 'https://facebook.com/niraum', isActive: true, order: 0 },
        { platform: 'instagram', url: 'https://instagram.com/niraum', isActive: false, order: 1 },
        {
          platform: 'linkedin',
          url: 'https://linkedin.com/company/niraum',
          isActive: false,
          order: 2,
        },
      ],
    });
  });

  it('reordering moves a row down and saves order = index', async () => {
    mockSettings(base);
    renderAdmin('/admin/settings?tab=social');
    await user.click(await screen.findByRole('button', { name: 'Move Facebook down' }));
    await user.click(screen.getByRole('button', { name: 'Save social links' }));
    await waitFor(() => expect(apiPut).toHaveBeenCalled());
    const social = putBody().social as { platform: string; order: number }[];
    expect(social.map((s) => [s.platform, s.order])).toEqual([
      ['instagram', 0],
      ['facebook', 1],
      ['linkedin', 2],
    ]);
  });

  it('saving the Company tab sends only company fields and keeps Nepali', async () => {
    mockSettings(base);
    renderAdmin('/admin/settings');
    const name = await screen.findByLabelText('Company name');
    await user.clear(name);
    await user.type(name, 'Niraum Metals Co');
    await user.click(screen.getByRole('button', { name: 'Save company' }));
    await waitFor(() => expect(apiPut).toHaveBeenCalled());
    const body = putBody();
    expect(Object.keys(body).sort()).toEqual(['companyName', 'legalName', 'logo', 'motto']);
    expect(body.companyName).toBe('Niraum Metals Co');
    // Nepali untouched → only English is sent, so the API keeps the stored Nepali.
    expect(body.motto).toEqual({ en: 'Test motto' });
    expect(body.logo).toEqual({ light: null, dark: null });
    // Saved → clean again.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save company' })).toBeDisabled(),
    );
    expect(toast.success).toHaveBeenCalled();
  });

  it('editing the Nepali motto sends { en, ne }', async () => {
    mockSettings(base);
    renderAdmin('/admin/settings?tab=company');
    await user.click(await screen.findByRole('tab', { name: /नेपाली/ }));
    const ne = screen.getByLabelText('Motto (Nepali)');
    expect(ne).toHaveAttribute('lang', 'ne');
    await user.clear(ne);
    await user.type(ne, 'नयाँ');
    await user.click(screen.getByRole('button', { name: 'Save company' }));
    await waitFor(() => expect(apiPut).toHaveBeenCalled());
    expect(putBody().motto).toEqual({ en: 'Test motto', ne: 'नयाँ' });
  });

  it('rejects a logo that is not https:// or a /path', async () => {
    mockSettings(base);
    renderAdmin('/admin/settings?tab=company');
    await user.type(await screen.findByLabelText('Logo (light)'), 'http://x.test/logo.png');
    await user.click(screen.getByRole('button', { name: 'Save company' }));
    expect(await screen.findByText('Use https:// or a /path')).toBeInTheDocument();
    expect(apiPut).not.toHaveBeenCalled();
  });

  it('appearance: the assay switch sends publicAssayDetail and shows the permission reminder', async () => {
    mockSettings(base);
    renderAdmin('/admin/settings?tab=appearance');
    expect(
      await screen.findByText(
        '[CONFIRM] Client permission to publish sample-level assay data is pending.',
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Show sample-level assay data publicly' }));
    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    await user.click(screen.getByRole('button', { name: 'Save appearance' }));
    await waitFor(() => expect(apiPut).toHaveBeenCalled());
    expect(putBody()).toEqual({
      theme: { defaultMode: 'dark' },
      defaultLanguage: 'en',
      publicAssayDetail: true,
    });
  });

  it('SEO: keywords chips and a character counter; sends only seo', async () => {
    mockSettings(base);
    renderAdmin('/admin/settings?tab=seo');
    expect(await screen.findByText('13 / 70')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Add keyword'), 'hematite{Enter}');
    await user.click(screen.getByRole('button', { name: 'Remove keyword iron ore' }));
    await user.click(screen.getByRole('button', { name: 'Save SEO' }));
    await waitFor(() => expect(apiPut).toHaveBeenCalled());
    expect(putBody()).toEqual({
      seo: {
        defaultTitle: 'Niraum Metals',
        defaultDescription: 'Test description',
        ogImage: '/og-image.jpg',
        keywords: ['hematite'],
      },
    });
  });

  it('footer: sends about + links only', async () => {
    mockSettings(base);
    renderAdmin('/admin/settings?tab=footer');
    await user.click(await screen.findByRole('button', { name: 'Add link' }));
    const rows = screen.getAllByLabelText(/^Link label/);
    await user.type(rows[1] as HTMLElement, 'Contact');
    await user.type(screen.getAllByLabelText(/^Link URL/)[1] as HTMLElement, '/contact');
    await user.click(screen.getByRole('button', { name: 'Save footer' }));
    await waitFor(() => expect(apiPut).toHaveBeenCalled());
    expect(putBody()).toEqual({
      footer: {
        about: { en: 'Test about' },
        links: [
          { label: 'Privacy', href: '/legal/privacy' },
          { label: 'Contact', href: '/contact' },
        ],
      },
    });
  });

  it('contact: sends contact + office hours', async () => {
    mockSettings(base);
    renderAdmin('/admin/settings?tab=contact');
    await user.type(await screen.findByLabelText('WhatsApp'), '+977 9800000000');
    await user.click(screen.getByRole('button', { name: 'Save contact' }));
    await waitFor(() => expect(apiPut).toHaveBeenCalled());
    expect(putBody()).toEqual({
      contact: {
        phone: ['+977 1 5550100'],
        email: ['info@niraum.test'],
        whatsapp: '+977 9800000000',
      },
      officeHours: 'Sun–Fri 10:00–17:00',
    });
  });

  it('switching tabs keeps the selected tab in the URL', async () => {
    mockSettings(base);
    const { router } = renderAdmin('/admin/settings');
    const tabs = await screen.findByRole('tablist', { name: 'Settings sections' });
    await user.click(within(tabs).getByRole('tab', { name: 'Social' }));
    await waitFor(() => expect(router.state.location.search).toBe('?tab=social'));
    expect(await screen.findByRole('button', { name: 'Save social links' })).toBeInTheDocument();
  });

  it('editor is blocked from settings', async () => {
    mockSettings(base, editor);
    renderAdmin('/admin/settings');
    expect(
      await screen.findByRole('heading', { name: "You don't have access" }),
    ).toBeInTheDocument();
    expect(apiGet).not.toHaveBeenCalledWith('/admin/settings');
  });
});
