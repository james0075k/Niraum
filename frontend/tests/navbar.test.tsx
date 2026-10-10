import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { vi } from 'vitest';
import { Navbar } from '@/components/layout/Navbar';
import { renderWithProviders } from './utils';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn().mockRejectedValue(new AxiosError('Network Error')), post: vi.fn() },
}));

describe('Navbar', () => {
  it('lists the main pages and marks the active route', () => {
    // Phase 4.5: public pages live under /en and /ne.
    renderWithProviders(<Navbar />, { route: '/en/about' });
    const nav = screen.getByRole('navigation', { name: 'Main' });
    // Phase 4.5 navigation order (blueprint §5).
    for (const label of [
      'Home',
      'About',
      'Our Project',
      'Products',
      'Technical Data',
      'Sustainability',
      'Investors',
      'Contact',
    ]) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
    }
    expect(within(nav).getByRole('link', { name: 'About' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
    expect(within(nav).getByRole('link', { name: 'Technical Data' })).toHaveAttribute(
      'href',
      '/en/technical-data',
    );
  });

  it('links "Request a Quote" to the contact form with the subject prefilled', () => {
    renderWithProviders(<Navbar />, { route: '/en' });
    expect(screen.getByRole('link', { name: 'Request a Quote' })).toHaveAttribute(
      'href',
      '/en/contact?subject=Quote%20request',
    );
  });

  it('opens the mobile menu sheet with every page link', async () => {
    renderWithProviders(<Navbar />);
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const mobile = await screen.findByRole('navigation', { name: 'Mobile' });
    expect(within(mobile).getAllByRole('link')).toHaveLength(8);
  });
});
