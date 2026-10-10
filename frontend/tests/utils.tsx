import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/lib/theme';

/** Renders with the app's providers (kept on rerender); no network retries in tests. */
export function renderWithProviders(ui: ReactElement, { route = '/' } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <HelmetProvider>
        <QueryClientProvider client={client}>
          <ThemeProvider defaultTheme="light" storageKey="niraum-theme">
            <MemoryRouter
              initialEntries={[route]}
              future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
            >
              {children}
            </MemoryRouter>
          </ThemeProvider>
        </QueryClientProvider>
      </HelmetProvider>
    );
  }
  return render(ui, { wrapper: Wrapper });
}
