import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { Route, Routes, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import { localePath, stripLang, switchLangPath } from '@/app/i18n';
import { Navbar } from '@/components/layout/Navbar';
import { Seo } from '@/components/seo/Seo';
import LangRedirect from '@/pages/public/LangRedirect';
import { renderWithProviders } from './utils';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn().mockRejectedValue(new AxiosError('Network Error')), post: vi.fn() },
}));

describe('language paths', () => {
  it('prefixes, strips and switches the language segment', () => {
    expect(localePath('ne', '/about')).toBe('/ne/about');
    expect(localePath('en', '/')).toBe('/en');
    expect(localePath('ne', '/contact?subject=Quote#form')).toBe('/ne/contact?subject=Quote#form');
    expect(localePath('ne', '/en/about')).toBe('/en/about');
    expect(localePath('ne', '/admin/login')).toBe('/admin/login');
    expect(localePath('ne', 'https://example.com')).toBe('https://example.com');
    expect(stripLang('/ne/projects/x')).toBe('/projects/x');
    expect(stripLang('/en')).toBe('/');
    expect(switchLangPath('/en/technical-data', 'ne')).toBe('/ne/technical-data');
  });
});

describe('Nepali pages', () => {
  it('renders the navbar in Nepali with links inside /ne', () => {
    renderWithProviders(<Navbar />, { route: '/ne/about' });
    const nav = screen.getByRole('navigation', { name: 'मुख्य' });
    const about = within(nav).getByRole('link', { name: 'हाम्रो बारेमा' });
    expect(about).toHaveAttribute('href', '/ne/about');
    expect(about).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'मूल्य सोधपुछ' })).toHaveAttribute(
      'href',
      '/ne/contact?subject=Quote%20request',
    );
  });

  it('language toggle keeps the page and remembers the choice', async () => {
    function Where() {
      return <p data-testid="where">{useLocation().pathname}</p>;
    }
    renderWithProviders(
      <>
        <Navbar />
        <Where />
      </>,
      { route: '/en/about' },
    );
    const toggle = screen.getAllByRole('navigation', { name: 'Language' })[0]!;
    const ne = within(toggle).getByRole('link', { name: 'Switch to नेपाली' });
    expect(ne).toHaveAttribute('href', '/ne/about');
    expect(within(toggle).getByRole('link', { name: 'English' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await userEvent.click(ne);
    expect(screen.getByTestId('where')).toHaveTextContent('/ne/about');
    expect(localStorage.getItem('niraum-lang')).toBe('ne');
  });

  it('emits hreflang alternates, x-default and the page language', async () => {
    renderWithProviders(<Seo title="About" />, { route: '/ne/about' });
    await waitFor(() => expect(document.head.querySelector('link[hreflang="ne"]')).not.toBeNull());
    const href = (l: string) =>
      document.head.querySelector(`link[hreflang="${l}"]`)?.getAttribute('href');
    expect(href('en')).toMatch(/\/en\/about$/);
    expect(href('ne')).toMatch(/\/ne\/about$/);
    expect(href('x-default')).toMatch(/\/en\/about$/);
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toMatch(
      /\/ne\/about$/,
    );
    expect(document.head.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe(
      'ne_NP',
    );
  });
});

describe('redirects to a language', () => {
  function App() {
    return (
      <Routes>
        <Route path="/" element={<LangRedirect />} />
        <Route path="/about" element={<LangRedirect />} />
        <Route path="/:lang/*" element={<p>landed</p>} />
      </Routes>
    );
  }
  function Where() {
    return <p data-testid="where">{useLocation().pathname}</p>;
  }

  it('sends / to the saved language', async () => {
    localStorage.setItem('niraum-lang', 'ne');
    renderWithProviders(
      <>
        <App />
        <Where />
      </>,
      { route: '/' },
    );
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent(/^\/ne$/));
  });

  it('sends an old unprefixed URL to the same page in English by default', async () => {
    Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true });
    renderWithProviders(
      <>
        <App />
        <Where />
      </>,
      { route: '/about' },
    );
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('/en/about'));
  });
});
