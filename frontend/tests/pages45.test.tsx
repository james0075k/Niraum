import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { vi } from 'vitest';
import { InquiryForm } from '@/components/sections/InquiryForm';
import { api } from '@/lib/api';
import OurProject from '@/pages/public/OurProject';
import Products from '@/pages/public/Products';
import TechnicalData from '@/pages/public/TechnicalData';
import { renderWithProviders } from './utils';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockRejectedValue(new AxiosError('Network Error')),
    post: vi.fn().mockResolvedValue({ data: { data: { id: 'x' } } }),
  },
}));

describe('Technical Data', () => {
  it('rebuilds Table 14 as HTML with the data-origin note under every table', () => {
    renderWithProviders(<TechnicalData />, { route: '/en/technical-data' });
    const table = screen.getByRole('table', { name: /Length-weighted average grade by section/ });
    const rows = within(table).getAllByRole('row');
    // header + 5 sections + weighted average
    expect(rows).toHaveLength(7);
    expect(within(rows[6]!).getByText('Weighted average')).toBeInTheDocument();
    expect(within(rows[6]!).getByText('33.59')).toBeInTheDocument();
    expect(within(rows[6]!).getByText('62.55')).toBeInTheDocument();
    expect(screen.getAllByTestId('data-origin').length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByTestId('data-origin')[0]).toHaveTextContent(
      /not a JORC\/NI 43-101 reserve statement/,
    );
  });

  it('keeps sample rows private by default and offers the full assay report form', () => {
    renderWithProviders(<TechnicalData />, { route: '/en/technical-data' });
    expect(screen.queryByRole('table', { name: /Sample-level assay results/ })).toBeNull();
    const form = screen.getByRole('form', { name: 'Bulk supply inquiry form' });
    expect(within(form).getByText(/Request: Full assay report/)).toBeInTheDocument();
    for (const link of screen.getAllByRole('link', { name: /Request full assay report/ })) {
      expect(link).toHaveAttribute('href', '/en/contact?topic=technical_report#inquiry');
    }
  });
});

describe('InquiryForm', () => {
  beforeEach(() => vi.mocked(api.post).mockClear());

  async function fill(user: ReturnType<typeof userEvent.setup>, labels: Record<string, string>) {
    for (const [label, value] of Object.entries(labels)) {
      await user.type(screen.getByLabelText(new RegExp(`^${label}`)), value);
    }
  }

  it('validates in English, then sends lang, page and quantity', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InquiryForm />, { route: '/en/contact' });
    await user.click(screen.getByRole('button', { name: 'Send inquiry' }));
    expect(await screen.findByText('Please enter your company name.')).toBeInTheDocument();
    expect(screen.getByText('Please choose a buyer type.')).toBeInTheDocument();

    await fill(user, {
      'Company name': 'Himal Cement',
      'Contact person': 'Sita Sharma',
      Email: 'sita@example.com',
      Phone: '+977 1 5555555',
      'Required quantity': '500',
    });
    await user.selectOptions(screen.getByLabelText(/^Buyer type/), 'cement');
    await user.click(screen.getByRole('button', { name: 'Send inquiry' }));
    expect(await screen.findByText('Choose tonnes per month or one-off.')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/^Unit/), 'tpm');
    await user.click(screen.getByRole('button', { name: 'Send inquiry' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.post).mock.calls[0]).toEqual([
      '/inquiries',
      expect.objectContaining({
        companyName: 'Himal Cement',
        buyerType: 'cement',
        topic: 'supply',
        quantity: 500,
        quantityUnit: 'tpm',
        lang: 'en',
        sourcePage: '/en/contact',
      }),
    ]);
  });

  it('renders in Nepali and submits with lang=ne', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InquiryForm topic="investor_deck" defaultBuyerType="investor" />, {
      route: '/ne/investors',
    });
    expect(screen.getByRole('button', { name: 'सोधपुछ पठाउनुहोस्' })).toBeInTheDocument();
    await fill(user, {
      'कम्पनीको नाम': 'Capital Partners',
      'सम्पर्क व्यक्ति': 'Ram',
      इमेल: 'ram@example.com',
      फोन: '9800000000',
    });
    await user.click(screen.getByRole('button', { name: 'सोधपुछ पठाउनुहोस्' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    expect(vi.mocked(api.post).mock.calls[0]?.[1]).toMatchObject({
      topic: 'investor_deck',
      buyerType: 'investor',
      lang: 'ne',
      sourcePage: '/ne/investors',
    });
  });
});

describe('Products and Our Project', () => {
  it('shows typical chemistry from Table 14, flags unconfirmed supply terms, never "high-grade"', () => {
    const { container } = renderWithProviders(<Products />, { route: '/en/products' });
    const table = screen.getByRole('table', { name: /Typical chemistry/ });
    expect(within(table).getByText('33.59 %')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Cement industry — iron corrective' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/To be confirmed/)).toHaveLength(3);
    expect(container.textContent).not.toMatch(/high[- ]grade/i);
  });

  it('shows the local-grid location, never unconfirmed land figures, and four maps', () => {
    const { container } = renderWithProviders(<OurProject />, { route: '/en/our-project' });
    expect(screen.getByText(/E 627,755\.00 · N 3,033,300\.00/)).toBeInTheDocument();
    expect(screen.getByText(/not latitude\/longitude/)).toBeInTheDocument();
    // Map No. 1 land figures are [CONFIRM] in the blueprint: not published as fact.
    expect(container.textContent).not.toMatch(/20\.68|3\.41 ha|Survey area/);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual([
      'Satellite',
      'Topo sheet',
      'Lease areas A, B, C',
      'Regional geology',
    ]);
  });
});
