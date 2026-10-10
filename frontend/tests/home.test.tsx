import { screen } from '@testing-library/react';
import { AxiosError } from 'axios';
import { vi } from 'vitest';
import Home from '@/pages/public/Home';
import { renderWithProviders } from './utils';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn().mockRejectedValue(new AxiosError('Network Error')), post: vi.fn() },
}));

it('renders the motto as the single H1 with local fallback content', () => {
  renderWithProviders(<Home />);
  const h1s = screen.getAllByRole('heading', { level: 1 });
  expect(h1s).toHaveLength(1);
  expect(h1s[0]).toHaveTextContent('Strength Forged For Generations');
  // Four operations from the Brand Brief.
  for (const name of ['Iron Ore', 'Metal Minerals', 'Stone & Aggregates', 'Logistics & Supply']) {
    expect(screen.getAllByRole('heading', { name }).length).toBeGreaterThan(0);
  }
});

it('shows unknown figures as TBC placeholders, never invented numbers', () => {
  renderWithProviders(<Home />);
  expect(screen.getByText('[PLACEHOLDER: Founding year]')).toBeInTheDocument();
  expect(screen.getByText('[PLACEHOLDER: Tonnage]')).toBeInTheDocument();
});
