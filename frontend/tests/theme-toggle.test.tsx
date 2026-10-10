import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { renderWithProviders } from './utils';

describe('ThemeToggle', () => {
  it('switches between light and dark, updates <html> and persists the choice', async () => {
    renderWithProviders(<ThemeToggle />);
    const button = screen.getByRole('button', { name: 'Switch to dark theme' });
    expect(document.documentElement).not.toHaveClass('dark');

    await userEvent.click(button);
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('niraum-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Switch to light theme' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('niraum-theme')).toBe('light');
  });
});
