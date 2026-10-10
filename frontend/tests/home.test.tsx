import { screen } from '@testing-library/react';
import { AxiosError } from 'axios';
import { vi } from 'vitest';
import assay from '../../docs/content/data/assay_data.json';
import Home from '@/pages/public/Home';
import { renderWithProviders } from './utils';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn().mockRejectedValue(new AxiosError('Network Error')), post: vi.fn() },
}));

it('renders the motto as the single H1 with the blueprint sections', () => {
  renderWithProviders(<Home />, { route: '/en' });
  const h1s = screen.getAllByRole('heading', { level: 1 });
  expect(h1s).toHaveLength(1);
  expect(h1s[0]).toHaveTextContent('Strength Forged For Generations');
  for (const name of [
    'Hematite ore for cement plants',
    'Evaluation lots for foundry and metallurgical buyers',
    'Sampling and assay support',
  ]) {
    expect(screen.getByRole('heading', { name })).toBeInTheDocument();
  }
  // Hero + closing CTA band both lead to the bulk-supply inquiry.
  for (const link of screen.getAllByRole('link', { name: /Request Bulk Supply/ })) {
    expect(link).toHaveAttribute('href', '/en/contact?topic=supply#inquiry');
  }
});

it('stats come from the assay data, never invented — and never "high-grade"', () => {
  const { container } = renderWithProviders(<Home />, { route: '/en' });
  const overall = assay.summary.deposit_weighted_average;
  expect(
    screen.getByText(`${overall.Fe2O3.toFixed(2)}%`, { selector: '.sr-only' }),
  ).toBeInTheDocument();
  expect(screen.getByText('59.85%', { selector: '.sr-only' })).toBeInTheDocument();
  expect(screen.getByText(/Top sample Fe₂O₃ \(N-2\)/)).toBeInTheDocument();
  expect(screen.getByText('62.55 m', { selector: '.sr-only' })).toBeInTheDocument();
  expect(container.textContent).not.toMatch(/high[- ]grade/i);
});

it('renders in Nepali under /ne', () => {
  renderWithProviders(<Home />, { route: '/ne' });
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('पुस्तौँसम्म टिक्ने बल');
  expect(
    screen.getByRole('heading', { name: 'सिमेन्ट कारखानाका लागि हेमाटाइट खनिज' }),
  ).toBeInTheDocument();
});
