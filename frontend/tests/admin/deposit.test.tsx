import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { vi } from 'vitest';
import { RESOURCES, type ResourceConfig } from '@/admin/resources/config';
import { docToForm } from '@/admin/resources/form';
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
// Leaflet needs a real layout; the picker shows the pin and a button that "clicks" the map.
vi.mock('@/admin/components/MapPinPicker', () => ({
  MapPinPicker: (p: {
    lat: number | null;
    lng: number | null;
    onChange(v: { lat: number; lng: number }): void;
  }) => (
    <div>
      <span data-testid="pin">{`${p.lat}, ${p.lng}`}</span>
      <button type="button" onClick={() => p.onChange({ lat: 27.9, lng: 84.6 })}>
        place pin
      </button>
    </div>
  ),
}));

Element.prototype.scrollIntoView ??= vi.fn();

const apiGet = vi.mocked(api.get);
const apiPut = vi.mocked(api.put);
const apiPost = vi.mocked(api.post);
const apiDelete = vi.mocked(api.delete);

// Admin shape: English strings + `translations` (values from docs/content/data/site_content.json).
const location = {
  district: { en: 'Makawanpur', ne: 'मकवानपुर' },
  municipality: { en: 'Bakaiya Gaupalika', ne: 'बकैया गाउँपालिका' },
  ward: '09',
  province: { en: 'Bagmati Province', ne: 'बागमती प्रदेश' },
  topoSheet: '2785 10A',
  easting: 627755,
  northing: 3033300,
  spotHeightM: 914,
  lat: null,
  lng: null,
};
const deposit = {
  id: 'd1',
  name: 'Katujpani Iron Deposit',
  slug: 'katujpani-iron-deposit',
  summary: 'Hematite iron deposit at Bakaiya Gaupalika-09.',
  location: {
    ...location,
    district: 'Makawanpur',
    municipality: 'Bakaiya Gaupalika',
    province: 'Bagmati Province',
  },
  areas: [{ code: 'A', label: 'Area A' }],
  land: {
    surveyHa: 20.68,
    quarryHa: 2.88,
    topsoilYardHa: null,
    wasteYardHa: null,
    officeHa: null,
    approachRoadHa: null,
    totalLandUseHa: 3.41,
    landType: 'Forest land',
    confirmed: false,
  },
  geologySummary: 'Middle Siwalik sandstone belt.',
  consultant: { name: 'Shubharambha Mining and Engineering Services Pvt. Ltd.', address: '' },
  status: 'studies',
  statusText: 'Geological studies completed.',
  maps: [],
  published: true,
  isDeleted: false,
  updatedAt: '2026-10-09T08:00:00.000Z',
  translations: {
    name: { en: 'Katujpani Iron Deposit', ne: 'कटुजपानी फलाम निक्षेप' },
    summary: { en: 'Hematite iron deposit at Bakaiya Gaupalika-09.' },
    location,
    areas: [{ code: 'A', label: { en: 'Area A', ne: 'क्षेत्र A' } }],
    geologySummary: { en: 'Middle Siwalik sandstone belt.' },
    statusText: { en: 'Geological studies completed.' },
  },
};

const list = (data: unknown[]) => ({
  data: { data, meta: { page: 1, limit: 20, total: data.length, pages: 1 } },
});

function mockApi(deposits: unknown[] = [deposit]) {
  apiGet.mockImplementation((url: string) => {
    if (url === '/auth/me') return Promise.resolve(ok(editor));
    if (url === '/admin/deposits') return Promise.resolve(list(deposits));
    if (url === '/admin/deposits/d1') return Promise.resolve(ok(deposit));
    return new Promise(() => {});
  });
}

const latInput = () => screen.getByRole('spinbutton', { name: 'Latitude' });
const lngInput = () => screen.getByRole('spinbutton', { name: 'Longitude' });

beforeAll(async () => {
  await import('@/admin/AdminRoot');
  await import('@/admin/pages/DepositEdit');
});

beforeEach(() => {
  for (const fn of [apiGet, apiPut, apiPost, apiDelete]) fn.mockReset();
  for (const fn of Object.values(toast)) vi.mocked(fn).mockReset();
  mockApi();
});

describe('deposit config', () => {
  it('reads nested localized location values from translations', () => {
    const cfg = RESOURCES.deposits as ResourceConfig;
    const values = docToForm(cfg, deposit);
    expect(values.location).toMatchObject({
      district: { en: 'Makawanpur', ne: 'मकवानपुर' },
      ward: '09',
      easting: 627755,
      lat: null,
    });
    expect(values.areas).toEqual([{ code: 'A', label: { en: 'Area A', ne: 'क्षेत्र A' } }]);
  });
});

describe('deposit editor', () => {
  it('opens the only deposit from /admin/deposit', async () => {
    const { router } = renderAdmin('/admin/deposit');
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/deposit/d1'));
    expect(await screen.findByLabelText('Name (English)')).toHaveValue('Katujpani Iron Deposit');
  });

  it('offers to create a deposit when there is none', async () => {
    mockApi([]);
    renderAdmin('/admin/deposit');
    expect(await screen.findByRole('link', { name: 'New deposit' })).toHaveAttribute(
      'href',
      '/admin/deposit/new',
    );
  });

  it('shows the [CONFIRM] notes for a missing pin and unconfirmed land figures', async () => {
    renderAdmin('/admin/deposit/d1');
    expect(await screen.findByText('WGS-84 pin not confirmed ([CONFIRM])')).toBeInTheDocument();
    expect(
      screen.getByText('Land figures are hidden on the public site until confirmed ([CONFIRM])'),
    ).toBeInTheDocument();
    expect(latInput()).toHaveValue(null);
    expect(screen.getByTestId('pin')).toHaveTextContent('null, null');
  });

  it('placing the pin fills the inputs and saves only the location', async () => {
    const user = userEvent.setup();
    apiPut.mockResolvedValue(
      ok({ ...deposit, location: { ...deposit.location, lat: 27.9, lng: 84.6 } }),
    );
    renderAdmin('/admin/deposit/d1');
    await screen.findByText('WGS-84 pin not confirmed ([CONFIRM])');
    await user.click(screen.getByRole('button', { name: 'place pin' }));
    expect(latInput()).toHaveDisplayValue('27.900000');
    expect(lngInput()).toHaveDisplayValue('84.600000');
    expect(screen.queryByText('WGS-84 pin not confirmed ([CONFIRM])')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(apiPut).toHaveBeenCalledTimes(1));
    const [url, body] = apiPut.mock.calls.at(0) as [string, Record<string, unknown>];
    expect(url).toBe('/admin/deposits/d1');
    expect(Object.keys(body)).toEqual(['location']);
    // The whole location is sent (the API replaces it), keeping the Nepali names and grid.
    expect(body.location).toEqual({
      district: { en: 'Makawanpur', ne: 'मकवानपुर' },
      municipality: { en: 'Bakaiya Gaupalika', ne: 'बकैया गाउँपालिका' },
      ward: '09',
      province: { en: 'Bagmati Province', ne: 'बागमती प्रदेश' },
      topoSheet: '2785 10A',
      easting: 627755,
      northing: 3033300,
      spotHeightM: 914,
      lat: 27.9,
      lng: 84.6,
    });
  });

  it('typing coordinates moves the pin', async () => {
    const user = userEvent.setup();
    renderAdmin('/admin/deposit/d1');
    await screen.findByText('WGS-84 pin not confirmed ([CONFIRM])');
    await user.type(latInput(), '27.5');
    await user.type(lngInput(), '84.25');
    expect(screen.getByTestId('pin')).toHaveTextContent('27.5, 84.25');
    expect(latInput()).toHaveDisplayValue('27.5');
  });

  it('rejects a latitude outside -90..90 and sends nothing', async () => {
    const user = userEvent.setup();
    renderAdmin('/admin/deposit/d1');
    await screen.findByText('WGS-84 pin not confirmed ([CONFIRM])');
    await user.type(latInput(), '95');
    await user.type(lngInput(), '84');
    expect(await screen.findByText('Latitude must be between -90 and 90')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(latInput()).toHaveAttribute('aria-invalid', 'true');
    expect(apiPut).not.toHaveBeenCalled();
  });

  it('adds a map from the media library', async () => {
    const user = userEvent.setup();
    const scan = {
      id: '6650a1b2c3d4e5f601234569',
      url: 'https://res.cloudinary.com/demo/image/upload/map-1.jpg',
      publicId: 'niraum/images/map-1',
      type: 'image',
      mime: 'image/jpeg',
      alt: 'Map No. 1',
      size: 200_000,
      width: 2000,
      height: 1400,
      createdAt: '2026-10-09T08:00:00.000Z',
    };
    apiGet.mockImplementation((url: string) => {
      if (url === '/auth/me') return Promise.resolve(ok(editor));
      if (url === '/admin/deposits/d1') return Promise.resolve(ok(deposit));
      if (url === '/admin/media') return Promise.resolve(list([scan]));
      return new Promise(() => {});
    });
    apiPut.mockResolvedValue(ok(deposit));
    renderAdmin('/admin/deposit/d1');
    await user.click(await screen.findByRole('button', { name: 'Choose from library' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(await within(dialog).findByRole('button', { name: /Map No\. 1/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Use image' }));
    expect(await screen.findByDisplayValue(scan.url)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(apiPut).toHaveBeenCalledTimes(1));
    expect(apiPut.mock.calls.at(0)?.[1]).toEqual({
      maps: [{ src: scan.url, alt: 'Map No. 1', width: 2000, height: 1400, mediaId: scan.id }],
    });
  });

  it('hides the land note once the figures are confirmed', async () => {
    const user = userEvent.setup();
    renderAdmin('/admin/deposit/d1');
    const note = await screen.findByText(
      'Land figures are hidden on the public site until confirmed ([CONFIRM])',
    );
    const land = note.closest('section') as HTMLElement;
    await user.click(within(land).getByRole('switch', { name: 'Land figures confirmed' }));
    expect(
      screen.queryByText('Land figures are hidden on the public site until confirmed ([CONFIRM])'),
    ).toBeNull();
  });
});
