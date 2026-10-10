import { render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { adminRoute } from '@/app/router';

it('serves /admin/login client-side with noindex', async () => {
  const router = createMemoryRouter([adminRoute], { initialEntries: ['/admin/login'] });
  render(
    <HelmetProvider>
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </HelmetProvider>,
  );
  expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  await waitFor(() =>
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex,nofollow',
    ),
  );
});
