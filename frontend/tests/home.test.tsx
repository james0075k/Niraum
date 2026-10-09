import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import Home from '@/pages/public/Home';

it('renders the brand motto', () => {
  render(
    <HelmetProvider>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </HelmetProvider>,
  );
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Niraum Metals');
  expect(screen.getByText('Strength Forged For Generations')).toBeInTheDocument();
});
