import { screen, within } from '@testing-library/react';
import { AxiosError } from 'axios';
import { vi } from 'vitest';
import { Footer } from '@/components/layout/Footer';
import Developer from '@/pages/public/Developer';
import { renderWithProviders } from './utils';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn().mockRejectedValue(new AxiosError('Network Error')), post: vi.fn() },
}));

describe('Developer credit', () => {
  it('lists the developer page in the footer quick links', () => {
    renderWithProviders(<Footer />, { route: '/en' });
    const quick = screen.getByRole('navigation', { name: 'Quick links' });
    expect(within(quick).getByRole('link', { name: 'Developer' })).toHaveAttribute(
      'href',
      '/en/developer',
    );
  });

  it('shows the developer profile, links and projects', async () => {
    renderWithProviders(<Developer />, { route: '/en/developer' });
    expect(
      await screen.findByRole('heading', { level: 1, name: /Website developer/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Janak (James) Rokaya' })).toBeInTheDocument();
    expect(screen.getByAltText(/Portrait of Janak \(James\) Rokaya/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Portfolio' })).toHaveAttribute(
      'href',
      'https://user007.cloud',
    );
    expect(
      screen.getByRole('link', { name: 'Visit Momento (opens in a new tab)' }),
    ).toHaveAttribute('target', '_blank');
    expect(screen.getByText(/Website design & development © \d{4} Janak/)).toBeInTheDocument();
  });
});
