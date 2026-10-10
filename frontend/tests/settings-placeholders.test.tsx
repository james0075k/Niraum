import { screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { Footer } from '@/components/layout/Footer';
import { defaultSettings } from '@/content/site';
import { renderWithProviders } from './utils';

// Settings straight from a fresh seed: phone and email are still placeholder strings.
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn((url: string) =>
      url.startsWith('/settings/public')
        ? Promise.resolve({
            data: {
              data: {
                ...defaultSettings,
                contact: {
                  phone: ['[PLACEHOLDER: phone]'],
                  email: ['[PLACEHOLDER: email]'],
                  whatsapp: null,
                },
              },
            },
          })
        : Promise.reject(new Error('offline')),
    ),
    post: vi.fn(),
  },
}));

describe('placeholder contact values', () => {
  it('are never rendered as tel:/mailto: links — the chip shows instead', async () => {
    const { container } = renderWithProviders(<Footer />, { route: '/en' });
    // Wait for the API settings (placeholder email) to replace the local fallback.
    await waitFor(() => expect(screen.getByText(/\[PLACEHOLDER: Email\]/)).toBeInTheDocument());
    expect(screen.getByText(/\[PLACEHOLDER: Phone\]/)).toBeInTheDocument();
    expect(container.querySelector('a[href^="tel:"]')).toBeNull();
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
  });

  it('shows the Nepali chip and Nepali place names on /ne', async () => {
    renderWithProviders(<Footer />, { route: '/ne' });
    await waitFor(() => expect(screen.getByText(/\[पुष्टि हुन बाँकी: फोन\]/)).toBeInTheDocument());
    expect(screen.getByText(/ललितपुर-१३, ललितपुर/)).toBeInTheDocument();
  });
});
